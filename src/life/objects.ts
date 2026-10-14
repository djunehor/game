import type { InteractionDef, MotiveId } from '../sim/types';
import { CATALOG_BY_ID, ratingDelta } from './catalog';
import type { CatalogObject, ObjectInteractionTemplate, PlacedObject } from './types';
import { regionAtWorld, tileIndex } from '../lot/grid';
import type { LotLayout, LotRegion } from '../lot/types';

// ---------------------------------------------------------------------------
// Turns placed objects into the interactions a Sim can actually perform.
// This is what makes buy mode matter: the object's ratings set the payoff.
// ---------------------------------------------------------------------------

/** Which of the player's own rooms a world position falls in. */
export function regionLabelAt(
  plot: LotLayout,
  regions: LotRegion[],
  x: number,
  z: number,
): string {
  const region = regionAtWorld(plot, regions, x, z);
  return region?.label ?? 'Outside';
}

/** Does a placed object sit on a floor tile (rather than bare grass)? */
export function isIndoors(plot: LotLayout, x: number, z: number): boolean {
  const tx = Math.floor((x - plot.originX) / plot.tileSize);
  const tz = Math.floor((z - plot.originZ) / plot.tileSize);
  if (tx < 0 || tz < 0 || tx >= plot.width || tz >= plot.depth) return false;
  return plot.tiles[tileIndex(plot, tx, tz)] !== 'grass';
}

/**
 * With a real lot there is no "garden room" anymore — outdoor furniture is
 * simply anything placed on the lot, indoors or out.
 */
export function isOutdoorAllowed(_def: CatalogObject, _room: string): boolean {
  return true;
}

/** Motive changes for one run of an object interaction. */
export function deltasFor(
  def: CatalogObject,
  template: ObjectInteractionTemplate,
): Partial<Record<MotiveId, number>> {
  const deltas: Partial<Record<MotiveId, number>> = {};
  for (const motive of template.uses) {
    deltas[motive] = ratingDelta(def.ratings[motive]);
  }
  for (const [motive, bonus] of Object.entries(template.bonus ?? {}) as [MotiveId, number][]) {
    deltas[motive] = (deltas[motive] ?? 0) + bonus;
  }
  return deltas;
}

/** Autonomy weights: the first listed motive matters most. */
export function autonomyFor(
  template: ObjectInteractionTemplate,
): Partial<Record<MotiveId, number>> {
  if (template.autonomy) return template.autonomy;
  const weights: Partial<Record<MotiveId, number>> = {};
  template.uses.forEach((motive, i) => {
    weights[motive] = i === 0 ? 3 : 1.4;
  });
  return weights;
}

export const OBJECT_INTERACTION_PREFIX = 'obj:';

export function interactionIdFor(uid: string, key: string): string {
  return `${OBJECT_INTERACTION_PREFIX}${uid}:${key}`;
}

export function parseObjectInteractionId(
  id: string,
): { uid: string; key: string } | null {
  if (!id.startsWith(OBJECT_INTERACTION_PREFIX)) return null;
  const rest = id.slice(OBJECT_INTERACTION_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep < 0) return null;
  return { uid: rest.slice(0, sep), key: rest.slice(sep + 1) };
}

/** Build the full interaction list for everything currently on the lot. */
export function interactionsForLot(
  lot: PlacedObject[],
  plot: LotLayout,
  regions: LotRegion[],
): InteractionDef[] {
  const out: InteractionDef[] = [];
  for (const placed of lot) {
    const def = CATALOG_BY_ID[placed.catalogId];
    if (!def) continue;
    const room = regionLabelAt(plot, regions, placed.x, placed.z);
    for (const template of def.interactions) {
      out.push({
        id: interactionIdFor(placed.uid, template.key),
        label: template.label,
        emoji: template.emoji,
        room,
        object: def.id,
        minutes: template.minutes,
        motiveDeltas: deltasFor(def, template),
        skillXp: template.skill ? { [template.skill.id]: template.skill.xp } : undefined,
        grants: template.moodlet
          ? [{ moodletId: template.moodlet.id, minutes: template.moodlet.minutes }]
          : undefined,
        autonomy: autonomyFor(template),
        requiresSkill: template.requiresSkill,
        stages: template.stages,
      });
    }
  }
  return out;
}

/**
 * How pleasant the lot is, 0–10. Drives passive Environment recovery, so buying
 * decor literally makes the house a nicer place to be.
 */
export function lotEnvironmentRating(lot: PlacedObject[]): number {
  let total = 0;
  let count = 0;
  for (const placed of lot) {
    const def = CATALOG_BY_ID[placed.catalogId];
    if (!def) continue;
    total += def.ratings.environment ?? 0;
    count++;
  }
  if (count === 0) return 2;
  return Math.max(0, Math.min(10, 2 + total / 4));
}

/** Objects grouped by the life room they sit in. */
export function objectsByRoom(
  lot: PlacedObject[],
  plot: LotLayout,
  regions: LotRegion[],
): Record<string, PlacedObject[]> {
  const grouped: Record<string, PlacedObject[]> = {};
  for (const placed of lot) {
    const room = regionLabelAt(plot, regions, placed.x, placed.z);
    (grouped[room] ??= []).push(placed);
  }
  return grouped;
}

export function lotValue(lot: PlacedObject[]): number {
  return lot.reduce((sum, p) => sum + (CATALOG_BY_ID[p.catalogId]?.price ?? 0), 0);
}
