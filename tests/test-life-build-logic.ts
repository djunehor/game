import { CATALOG, CATALOG_BY_ID, RATING_SCALE, ratingDelta, catalogByCategory } from '../src/life/catalog';
import { canPlace, footprintOf, findFreeSpot, sellValue, canAfford, objectPrice, SELL_REFUND } from '../src/life/buildMode';
import {
  autonomyFor,
  deltasFor,
  interactionIdFor,
  interactionsForLot,
  lotEnvironmentRating,
  lotValue,
  objectsByRoom,
  parseObjectInteractionId,
  regionLabelAt,
} from '../src/life/objects';
import { createStarterLot, detectRegions, labelRegions } from '../src/lot/grid';
import type { PlacedObject } from '../src/life/types';
import { MOTIVE_IDS } from '../src/sim/types';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

const place = (catalogId: string, x: number, z: number, rotation: 0 | 1 | 2 | 3 = 0): PlacedObject => ({
  uid: `u-${catalogId}-${x}-${z}`,
  catalogId,
  x,
  z,
  rotation,
});

console.log('→ Testing Buy Mode: Catalog, Placement & Object Value');

// ------------------------------- Catalog ---------------------------------
{
  const ids = new Set(CATALOG.map((o) => o.id));
  assert(ids.size === CATALOG.length, `Catalog ids are unique (${CATALOG.length} objects)`);
  assert(CATALOG.every((o) => o.price > 0), 'Every object has a price');
  assert(CATALOG.every((o) => o.footprint[0] > 0 && o.footprint[1] > 0), 'Every object has a footprint');

  const ratingsValid = CATALOG.every((o) =>
    Object.values(o.ratings).every((v) => v !== undefined && v >= 0 && v <= 10),
  );
  assert(ratingsValid, 'All ratings sit within 0–10');

  const interactionsValid = CATALOG.every((o) =>
    o.interactions.every((i) => i.minutes > 0 && i.uses.length > 0),
  );
  assert(interactionsValid, 'Every object interaction has a duration and a target motive');

  // Ratings referenced by an interaction must exist on the object, or the
  // interaction would restore nothing.
  const usesBacked = CATALOG.every((o) =>
    o.interactions.every((i) => i.uses.every((m) => (o.ratings[m] ?? 0) > 0)),
  );
  assert(usesBacked, 'Every interaction draws on a rating the object actually has');

  assert(catalogByCategory('beds').length >= 3, 'Multiple beds exist so upgrades matter');
  assert(
    catalogByCategory('beds')[0].price < catalogByCategory('beds').at(-1)!.price,
    'Category listing is sorted cheapest first',
  );
  assert(Object.keys(CATALOG_BY_ID).length === CATALOG.length, 'Catalog lookup table is complete');
}

// --------------------------- Ratings -> deltas ----------------------------
{
  assert(RATING_SCALE === 8, 'Rating scale is 8 motive points per rating point');
  assert(ratingDelta(10) === 80, 'A perfect rating restores 80 points');
  assert(ratingDelta(0) === 0, 'A zero rating restores nothing');

  const camp = CATALOG_BY_ID['camp_bed'];
  const royal = CATALOG_BY_ID['canopy_bed'];
  const campSleep = camp.interactions.find((i) => i.key === 'sleep')!;
  const royalSleep = royal.interactions.find((i) => i.key === 'sleep')!;
  const campDeltas = deltasFor(camp, campSleep);
  const royalDeltas = deltasFor(royal, royalSleep);
  assert(
    (royalDeltas.energy ?? 0) > (campDeltas.energy ?? 0),
    `A better bed restores more energy (${royalDeltas.energy} vs ${campDeltas.energy})`,
  );

  const bbq = CATALOG_BY_ID['barbecue'];
  const grill = bbq.interactions[0];
  const withBonus = deltasFor(bbq, grill);
  assert((withBonus.fun ?? 0) > 0, 'Interaction bonuses are folded into the deltas');
  assert(
    (withBonus.hunger ?? 0) === ratingDelta(bbq.ratings.hunger) && withBonus.fun === 18,
    'Rating drives the target motive and the flat bonus is added on top',
  );

  const weights = autonomyFor(grill);
  assert(
    (weights.hunger ?? 0) > (weights.social ?? 0),
    'The primary motive carries more autonomy weight than the secondary',
  );
  const explicit = CATALOG_BY_ID['toilet'].interactions[0];
  assert(autonomyFor(explicit).bladder === 4, 'Explicit autonomy weights are respected');
}

// --------------------------- Placed -> interactions -----------------------
{
  const plot = createStarterLot();
  const lot = [
    { ...place('double_bed', -9, 17), x: plot.originX + 7.5, z: plot.originZ + 6.5 },
    { ...place('fridge', -13, -9), x: plot.originX + 8.5, z: plot.originZ + 11.5 },
  ];
  const regions = labelRegions(plot, detectRegions(plot), lot);
  const interactions = interactionsForLot(lot, plot, regions);
  assert(interactions.length > 0, 'Placed objects produce interactions');
  assert(
    interactions.every((i) => i.id.startsWith('obj:')),
    'Object interactions are namespaced so they never collide with base ones',
  );
  assert(
    new Set(interactions.map((i) => i.room)).size >= 2,
    'Interactions are tagged with the room they sit in, derived from the walls',
  );

  const parsed = parseObjectInteractionId(interactions[0].id);
  assert(parsed !== null && parsed.uid === interactions[0].id.split(':')[1].split(':')[0], 'Interaction ids round-trip');
  assert(parseObjectInteractionId('shower') === null, 'Non-object ids are ignored by the parser');

  const bedUid = lot[0].uid;
  assert(
    interactions.some((i) => i.id === interactionIdFor(bedUid, 'sleep')),
    'Interaction ids are stable per placed object',
  );

  // Rooms come from the player's own walls, not a hard-coded floor plan.
  const bedRegion = regionLabelAt(plot, regions, plot.originX + 7.5, plot.originZ + 6.5);
  assert(typeof bedRegion === 'string' && bedRegion.length > 0, `Room lookup resolves a label (${bedRegion})`);
  assert(regionLabelAt(plot, regions, 9999, 9999) === 'Outside', 'Off-lot positions are Outside');

  // Environment quality rises with decor.
  assert(lotEnvironmentRating([]) === 2, 'An empty lot is drab (rating 2)');
  const decorated = lotEnvironmentRating([place('expensive_art', 0, 0), place('plant', 1, 0)]);
  assert(decorated > 2, `Decor raises the environment rating (${decorated.toFixed(1)})`);

  assert(lotValue(lot) === 3400 + 1300, 'Lot value sums the catalog prices');
  assert(objectsByRoom(lot, plot, regions)['Outside'] === undefined, 'objectsByRoom keys by real room names');
}

// ------------------------------ Placement --------------------------------
{
  const lot = [place('sofa', -10, 6)];
  assert(canPlace(lot, 'plant', 30, -20, 0).ok, 'Empty floor is placeable');
  assert(!canPlace(lot, 'plant', -10, 6, 0).ok, 'Cannot place on top of another object');
  // With real land there is no "garden room" rule anymore — you own the plot.
  assert(canPlace([], 'barbecue', 16, -8, 0).ok, 'Outdoor objects can be placed anywhere on your land');
  assert(!canPlace(lot, 'does_not_exist', 0, 0, 0).ok, 'Unknown catalog ids are refused');


  // Rotation swaps the footprint.
  const wide = footprintOf(0, 0, [3, 1], 0);
  const tall = footprintOf(0, 0, [3, 1], 1);
  assert(wide.maxX - wide.minX === 3 && wide.maxZ - wide.minZ === 1, 'Unrotated footprint uses width × depth');
  assert(tall.maxX - tall.minX === 1 && tall.maxZ - tall.minZ === 3, 'Rotating 90° swaps the footprint');

  // Moving ignores the object being moved.
  assert(canPlace(lot, 'sofa', -10, 6, 0, lot[0].uid).ok, 'Moving an object ignores its own old position');

  assert(objectPrice('sofa') === 900, 'objectPrice reads the catalog');
  assert(sellValue('sofa') === Math.round(900 * SELL_REFUND), `Selling refunds ${SELL_REFUND * 100}%`);
  assert(canAfford(1000, 'sofa'), 'canAfford passes when funds cover the price');
  assert(!canAfford(100, 'sofa'), 'canAfford fails when funds are short');

  const spot = findFreeSpot([place('sofa', 0, 0)], 'plant', 0, 0);
  assert(spot !== null && canPlace([place('sofa', 0, 0)], 'plant', spot.x, spot.z, 0).ok, 'findFreeSpot returns a legal alternative spot');
  assert(findFreeSpot([], 'plant', 0, 0) !== null, 'findFreeSpot returns the requested spot when free');
}

// ---------------------- Motive coverage of the catalog --------------------
{
  const covered = new Set<string>();
  for (const obj of CATALOG) {
    for (const inter of obj.interactions) for (const m of inter.uses) covered.add(m);
  }
  const missing = MOTIVE_IDS.filter((m) => !covered.has(m));
  assert(missing.length === 0, `Buy mode covers every motive (missing: ${missing.join(', ') || 'none'})`);
}

console.log(`\nLife Buy Mode Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
