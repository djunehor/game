import {
  createStarterLot,
  detectRegions,
  floorCost,
  hKey,
  inBounds,
  isInsideLot,
  labelRegions,
  regionAtWorld,
  tileAt,
  tileIndex,
  validWallKeys,
  vKey,
  wallBetween,
  wallGeometry,
  wallSet,
} from '../src/lot/grid';
import { FLOOR_COST, DECK_COST, WALL_COST } from '../src/lot/types';
import type { LotLayout } from '../src/lot/types';
import { canPlace } from '../src/life/buildMode';
import { regionLabelAt } from '../src/life/objects';
import type { PlacedObject } from '../src/life/types';

// ---------------------------------------------------------------------------
// The lot is the foundation: land, tiles, walls the player drew, and rooms
// derived from those walls. Nothing here may depend on a hard-coded floor plan.
// ---------------------------------------------------------------------------

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

/** A bare 4x4 grass plot with no walls. */
function bareLot(): LotLayout {
  return {
    width: 4,
    depth: 4,
    originX: 0,
    originZ: 0,
    tileSize: 1,
    tiles: new Array(16).fill('grass'),
    walls: [],
  };
}

console.log('→ Testing the Lot Foundation (land, walls, rooms)');

// --------------------------- Grid basics ----------------------------------
{
  const lot = bareLot();
  assert(tileIndex(lot, 2, 1) === 1 * 4 + 2, 'tileIndex is row-major');
  assert(inBounds(lot, 3, 3) && !inBounds(lot, 4, 0) && !inBounds(lot, -1, 0), 'inBounds rejects out-of-range tiles');
  assert(tileAt(lot, 1, 1) === 'grass', 'Fresh land is grass');
  assert(tileAt(lot, 9, 9) === null, 'Off-lot tiles return null');
  assert(isInsideLot(lot, 0.5, 0.5) && !isInsideLot(lot, -0.5, 0.5), 'isInsideLot works in world units');

  assert(floorCost('grass') === 0, 'Grass is free');
  assert(floorCost('floor') === FLOOR_COST, 'Indoor floor costs the floor rate');
  assert(floorCost('deck') === DECK_COST, 'Decking costs the deck rate');
  assert(WALL_COST > 0, 'Walls cost money');
}

// --------------------------- Wall segments --------------------------------
{
  const lot = bareLot();
  const keys = validWallKeys(lot);
  assert(keys.has(hKey(0, 0)) && keys.has(hKey(3, 4)), 'Horizontal segments cover the full grid');
  assert(keys.has(vKey(0, 0)) && keys.has(vKey(4, 3)), 'Vertical segments cover the full grid');
  assert(!keys.has(hKey(4, 0)), 'Horizontal segments stop at the last column');
  assert(!keys.has(vKey(0, 4)), 'Vertical segments stop at the last row');

  const walls = new Set([vKey(2, 1)]);
  assert(wallBetween(walls, 1, 1, 2, 1), 'A vertical wall separates east/west neighbours');
  assert(!wallBetween(walls, 2, 1, 3, 1), 'No wall where none was drawn');

  const hWalls = new Set([hKey(1, 2)]);
  assert(wallBetween(hWalls, 1, 1, 1, 2), 'A horizontal wall separates north/south neighbours');
  assert(!wallBetween(hWalls, 1, 0, 1, 1), 'The other side of that tile is still open');

  const geo = wallGeometry(lot, hKey(1, 2))!;
  assert(geo.kind === 'h' && geo.x === 1.5 && geo.z === 2, 'Horizontal wall geometry is centred on the line');
  const vgeo = wallGeometry(lot, vKey(2, 1))!;
  assert(vgeo.kind === 'v' && vgeo.x === 2 && vgeo.z === 1.5, 'Vertical wall geometry is centred on the line');
  assert(wallGeometry(lot, 'garbage') === null, 'Malformed wall keys are rejected');
}

// ------------------------- Room detection ---------------------------------
{
  const lot = bareLot();
  const open = detectRegions(lot);
  assert(open.length === 1, 'An unwalled plot is a single region');
  assert(open[0].outdoors, 'A region touching the boundary counts as outdoors');
  assert(open[0].tiles.length === 16, 'The single region covers every tile');

  // Enclose an interior 2x2 block.
  const housed: LotLayout = {
    ...lot,
    walls: [
      hKey(1, 1), hKey(2, 1),
      hKey(1, 3), hKey(2, 3),
      vKey(1, 1), vKey(1, 2),
      vKey(3, 1), vKey(3, 2),
    ],
  };
  const regions = detectRegions(housed);
  const inside = regions.find((r) => !r.outdoors);
  assert(Boolean(inside), 'Walls create an interior region');
  assert(inside!.tiles.length === 4, 'The interior region is the 2x2 room');
  assert(!inside!.outdoors, 'Surrounded rooms are not outdoors');
  assert(regions.length === 2, 'The outside remains one region');

  // A doorway reconnects the space.
  const doorless = { ...housed, walls: housed.walls.filter((w) => w !== hKey(2, 1)) };
  const withDoor = detectRegions(doorless);
  assert(withDoor.length === 1, 'A doorway merges the room back into the outside');
}

// --------------------------- Room naming ----------------------------------
{
  const lot = createStarterLot();
  const regions = detectRegions(lot);
  assert(regions.length >= 2, `The starter home has multiple regions (${regions.length})`);

  const bed: PlacedObject = { uid: 'u1', catalogId: 'double_bed', x: lot.originX + 7.5, z: lot.originZ + 6.5, rotation: 0 };
  const stove: PlacedObject = { uid: 'u2', catalogId: 'stove', x: lot.originX + 7.5, z: lot.originZ + 6.5, rotation: 0 };
  // Left-back room (x 6..11, z 10..13) is behind the partition.
  const toilets: PlacedObject = { uid: 'u3', catalogId: 'toilet', x: lot.originX + 8.5, z: lot.originZ + 11.5, rotation: 0 };

  const named = labelRegions(lot, regions, [bed, toilets]);
  assert(named.some((r) => r.label === 'Bedroom'), 'A room with a bed is named Bedroom');
  assert(named.some((r) => r.label === 'Bathroom'), 'A room with a toilet is named Bathroom');
  assert(named.some((r) => r.label === 'Garden'), 'The outdoor region is the Garden');

  const kitchenNamed = labelRegions(lot, regions, [stove]);
  assert(kitchenNamed.some((r) => r.label === 'Kitchen'), 'A room with a stove is named Kitchen');

  // Region lookup by world position.
  const region = regionAtWorld(lot, regions, lot.originX + 7.5, lot.originZ + 6.5);
  assert(region !== null && !region.outdoors, 'regionAtWorld finds the room a point sits in');
  assert(regionAtWorld(lot, regions, 999, 999) === null, 'regionAtWorld returns null far off the lot');

  const regions2 = labelRegions(lot, regions, [bed]);
  assert(
    regionLabelAt(lot, regions2, lot.originX + 7.5, lot.originZ + 6.5) === 'Bedroom',
    'regionLabelAt resolves a world position to its room name',
  );
  assert(
    regionLabelAt(lot, regions2, 999, 999) === 'Outside',
    'Positions off the lot are labelled Outside',
  );
}

// --------------------- Placement respects YOUR walls ----------------------
{
  const lot = createStarterLot();
  // A wall drawn across the middle of the plot must block furniture.
  const key = hKey(10, 10);
  const withWall: LotLayout = { ...lot, walls: [...lot.walls, key] };
  const blocked = canPlace([], 'plant', withWall.originX + 10.5, withWall.originZ + 10, 0, undefined, withWall);
  assert(!blocked.ok && blocked.reason === 'Blocked by a wall', 'Furniture cannot be placed through a wall you built');

  const open = canPlace([], 'plant', withWall.originX + 10.5, withWall.originZ + 12.5, 0, undefined, withWall);
  assert(open.ok, 'The same plot has open floor elsewhere');

  const offLot = canPlace([], 'plant', 999, 999, 0, undefined, withWall);
  assert(!offLot.ok && offLot.reason === 'Outside your land', 'Furniture cannot be placed off your land');

  const outside = canPlace([], 'camp_bed', lot.originX - 6, lot.originZ - 6, 0, undefined, lot);
  assert(!outside.ok, 'Negative-side overflow is caught too');

  // Obstacle overlap still works with a plot present.
  const existing: PlacedObject[] = [{ uid: 'x', catalogId: 'sofa', x: lot.originX + 10.5, z: lot.originZ + 12.5, rotation: 0 }];
  const clash = canPlace(existing, 'plant', lot.originX + 10.5, lot.originZ + 12.5, 0, undefined, lot);
  assert(!clash.ok, 'Objects still cannot overlap');
}

// ------------------------ Starter lot sanity ------------------------------
{
  const lot = createStarterLot();
  assert(lot.width > 10 && lot.depth > 10, 'The starter plot is a decent size of land');
  assert(lot.tiles.includes('floor'), 'The starter plot comes with some flooring');
  assert(lot.walls.length > 0, 'The starter plot comes with a wall shell');
  assert(wallSet(lot).size === lot.walls.length, 'Wall keys are unique');

  const regions = detectRegions(lot);
  const indoorTiles = regions.filter((r) => !r.outdoors).reduce((n, r) => n + r.tiles.length, 0);
  assert(indoorTiles > 0, 'Part of the starter plot is enclosed');

  // The player owns this land: it is not the show's compound.
  assert(
    lot.walls.every((k) => validWallKeys(lot).has(k)),
    'Every starter wall is a legal segment on the grid',
  );
}

console.log(`\nLot Foundation Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
