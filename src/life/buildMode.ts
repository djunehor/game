import { isInsideLot, wallGeometry } from '../lot/grid';
import type { LotLayout } from '../lot/types';
import { CATALOG_BY_ID } from './catalog';

import type { PlacedObject } from './types';

// ---------------------------------------------------------------------------
// Build / Buy mode: grid placement with collision + affordability validation.
// ---------------------------------------------------------------------------

export const GRID = 1;
export const SELL_REFUND = 0.7;

export interface Footprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

/** Axis-aligned footprint of an object, accounting for 90° rotations. */
export function footprintOf(
  x: number,
  z: number,
  footprint: [number, number],
  rotation: 0 | 1 | 2 | 3,
): Footprint {
  const [w, d] = footprint;
  const width = rotation % 2 === 0 ? w : d;
  const depth = rotation % 2 === 0 ? d : w;
  return {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

function overlaps(a: Footprint, b: Footprint, pad = 0): boolean {
  return (
    a.minX < b.maxX - pad &&
    a.maxX > b.minX + pad &&
    a.minZ < b.maxZ - pad &&
    a.maxZ > b.minZ + pad
  );
}

export interface PlacementCheck {
  ok: boolean;
  reason?: string;
}

export function canPlace(
  lot: PlacedObject[],
  catalogId: string,
  x: number,
  z: number,
  rotation: 0 | 1 | 2 | 3,
  ignoreUid?: string,
  plot?: LotLayout,
): PlacementCheck {
  const def = CATALOG_BY_ID[catalogId];
  if (!def) return { ok: false, reason: 'Unknown object' };

  const box = footprintOf(x, z, def.footprint, rotation);

  // Without a plot we can only do the object-overlap check (unit tests).
  if (plot) {
    if (
      !isInsideLot(plot, box.minX + 0.01, box.minZ + 0.01) ||
      !isInsideLot(plot, box.maxX - 0.01, box.maxZ - 0.01)
    ) {
      return { ok: false, reason: 'Outside your land' };
    }
    // Walls you drew block furniture.
    for (const key of plot.walls) {
      const wall = wallGeometry(plot, key);
      if (!wall) continue;
      const half = 0.15;
      const wallBox: Footprint =
        wall.kind === 'h'
          ? { minX: wall.x - wall.length / 2, maxX: wall.x + wall.length / 2, minZ: wall.z - half, maxZ: wall.z + half }
          : { minX: wall.x - half, maxX: wall.x + half, minZ: wall.z - wall.length / 2, maxZ: wall.z + wall.length / 2 };
      if (overlaps(box, wallBox)) return { ok: false, reason: 'Blocked by a wall' };
    }
  }

  for (const other of lot) {
    if (other.uid === ignoreUid) continue;
    const otherDef = CATALOG_BY_ID[other.catalogId];
    if (!otherDef) continue;
    const otherBox = footprintOf(other.x, other.z, otherDef.footprint, other.rotation);
    if (overlaps(box, otherBox)) {
      return { ok: false, reason: `Too close to the ${otherDef.name}` };
    }
  }

  return { ok: true };
}

export function objectPrice(catalogId: string): number {
  return CATALOG_BY_ID[catalogId]?.price ?? 0;
}

export function sellValue(catalogId: string): number {
  return Math.round(objectPrice(catalogId) * SELL_REFUND);
}

export function canAfford(funds: number, catalogId: string): boolean {
  return funds >= objectPrice(catalogId);
}

/** Smallest free spot near (x, z) for the given object, or null if none. */
export function findFreeSpot(
  lot: PlacedObject[],
  catalogId: string,
  x: number,
  z: number,
  rotation: 0 | 1 | 2 | 3 = 0,
  searchRadius = 6,
  plot?: LotLayout,
): { x: number; z: number } | null {
  if (canPlace(lot, catalogId, x, z, rotation, undefined, plot).ok) return { x, z };
  for (let r = 1; r <= searchRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const cx = snap(x + dx);
        const cz = snap(z + dz);
        if (canPlace(lot, catalogId, cx, cz, rotation, undefined, plot).ok) return { x: cx, z: cz };
      }
    }
  }
  return null;
}
