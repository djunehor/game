import { DECK_COST, FLOOR_COST, type LotLayout, type LotRegion, type TileKind } from './types';
import type { PlacedObject } from '../life/types';
import { CATALOG_BY_ID } from '../life/catalog';

// ---------------------------------------------------------------------------
// Pure grid maths for the lot: indexing, wall edges, room detection by flood
// fill, and automatic room naming. No React, no three.js — fully testable.
// ---------------------------------------------------------------------------

export function tileIndex(lot: LotLayout, x: number, z: number): number {
  return z * lot.width + x;
}

export function inBounds(lot: LotLayout, x: number, z: number): boolean {
  return x >= 0 && z >= 0 && x < lot.width && z < lot.depth;
}

export function tileAt(lot: LotLayout, x: number, z: number): TileKind | null {
  return inBounds(lot, x, z) ? lot.tiles[tileIndex(lot, x, z)] : null;
}

// --- Wall segments ---------------------------------------------------------
// A horizontal segment sits on a horizontal grid line and separates the tiles
// north and south of it; vertical segments separate east/west neighbours.

export function hKey(x: number, z: number): string {
  return `h,${x},${z}`;
}

export function vKey(x: number, z: number): string {
  return `v,${x},${z}`;
}

export function wallSet(lot: LotLayout): Set<string> {
  return new Set(lot.walls);
}

/** Walls *and* doors — anything that separates one space from another. */
export function blockerSet(lot: LotLayout): Set<string> {
  return new Set([...lot.walls, ...(lot.doors ?? [])]);
}

export function doorSet(lot: LotLayout): Set<string> {
  return new Set(lot.doors ?? []);
}

/** Is there a wall on the shared edge between two adjacent tiles? */
export function wallBetween(
  walls: Set<string>,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): boolean {
  if (az === bz) {
    // Horizontal neighbours → a vertical wall on the shared grid line.
    const line = Math.max(ax, bx);
    return walls.has(vKey(line, az));
  }
  if (ax === bx) {
    // Vertical neighbours → a horizontal wall on the shared grid line.
    const line = Math.max(az, bz);
    return walls.has(hKey(ax, line));
  }
  return true; // Diagonal neighbours never connect.
}

/** The four wall segments that make up a tile's outline. */
export function tileEdges(x: number, z: number): { key: string; kind: 'h' | 'v' }[] {
  return [
    { key: hKey(x, z), kind: 'h' },
    { key: hKey(x, z + 1), kind: 'h' },
    { key: vKey(x, z), kind: 'v' },
    { key: vKey(x + 1, z), kind: 'v' },
  ];
}

/** World-space segment description, for rendering and collision. */
export interface WallGeometry {
  key: string;
  kind: 'h' | 'v';
  /** Centre of the segment in world units. */
  x: number;
  z: number;
  /** Length along its axis. */
  length: number;
}

export function wallGeometry(lot: LotLayout, key: string): WallGeometry | null {
  const [kind, rawX, rawZ] = key.split(',');
  const gx = Number(rawX);
  const gz = Number(rawZ);
  if (!Number.isFinite(gx) || !Number.isFinite(gz)) return null;
  const { originX, originZ, tileSize } = lot;
  if (kind === 'h') {
    return {
      key,
      kind: 'h',
      x: originX + (gx + 0.5) * tileSize,
      z: originZ + gz * tileSize,
      length: tileSize,
    };
  }
  return {
    key,
    kind: 'v',
    x: originX + gx * tileSize,
    z: originZ + (gz + 0.5) * tileSize,
    length: tileSize,
  };
}

/** Every wall segment that is legal to draw on this lot. */
export function validWallKeys(lot: LotLayout): Set<string> {
  const keys = new Set<string>();
  for (let z = 0; z <= lot.depth; z++) {
    for (let x = 0; x < lot.width; x++) keys.add(hKey(x, z));
  }
  for (let x = 0; x <= lot.width; x++) {
    for (let z = 0; z < lot.depth; z++) keys.add(vKey(x, z));
  }
  return keys;
}

// --- Room detection --------------------------------------------------------

/** Flood fill the tiles, stopping at walls. */
export function detectRegions(lot: LotLayout): LotRegion[] {
  const walls = blockerSet(lot);
  const seen = new Array<boolean>(lot.width * lot.depth).fill(false);
  const regions: LotRegion[] = [];

  for (let z = 0; z < lot.depth; z++) {
    for (let x = 0; x < lot.width; x++) {
      const start = tileIndex(lot, x, z);
      if (seen[start]) continue;

      const tiles: number[] = [];
      const queue: [number, number][] = [[x, z]];
      seen[start] = true;
      let outdoors = false;
      let sumX = 0;
      let sumZ = 0;

      while (queue.length) {
        const [cx, cz] = queue.pop()!;
        tiles.push(tileIndex(lot, cx, cz));
        sumX += cx;
        sumZ += cz;
        if (cx === 0 || cz === 0 || cx === lot.width - 1 || cz === lot.depth - 1) outdoors = true;

        const neighbours: [number, number][] = [
          [cx + 1, cz],
          [cx - 1, cz],
          [cx, cz + 1],
          [cx, cz - 1],
        ];
        for (const [nx, nz] of neighbours) {
          if (!inBounds(lot, nx, nz)) continue;
          const ni = tileIndex(lot, nx, nz);
          if (seen[ni]) continue;
          if (wallBetween(walls, cx, cz, nx, nz)) continue;
          seen[ni] = true;
          queue.push([nx, nz]);
        }
      }

      regions.push({
        id: regions.length,
        tiles,
        centerX: lot.originX + (sumX / tiles.length + 0.5) * lot.tileSize,
        centerZ: lot.originZ + (sumZ / tiles.length + 0.5) * lot.tileSize,
        outdoors,
        label: outdoors ? 'Garden' : 'Room',
      });
    }
  }

  return regions;
}

const CATEGORY_ROOM: Record<string, string> = {
  beds: 'Bedroom',
  plumbing: 'Bathroom',
  appliances: 'Kitchen',
  surfaces: 'Kitchen',
  electronics: 'Living Room',
  seating: 'Living Room',
  skill: 'Study',
  decor: 'Living Room',
  outdoor: 'Garden',
};

/** Merge object-based naming in, so regions get sensible labels. */
export function labelRegions(lot: LotLayout, regions: LotRegion[], objects: PlacedObject[]): LotRegion[] {
  const regionOfTile = new Map<number, number>();
  regions.forEach((region) => region.tiles.forEach((tile) => regionOfTile.set(tile, region.id)));

  const votes: Record<number, Record<string, number>> = {};
  for (const placed of objects) {
    const tx = Math.floor((placed.x - lot.originX) / lot.tileSize);
    const tz = Math.floor((placed.z - lot.originZ) / lot.tileSize);
    if (!inBounds(lot, tx, tz)) continue;
    const regionId = regionOfTile.get(tileIndex(lot, tx, tz));
    if (regionId === undefined) continue;
    const def = CATALOG_BY_ID[placed.catalogId];
    if (!def) continue;
    const name = CATEGORY_ROOM[def.category] ?? 'Room';
    const bucket = (votes[regionId] ??= {});
    bucket[name] = (bucket[name] ?? 0) + 1;
  }

  const used: Record<string, number> = {};
  return regions.map((region) => {
    if (region.outdoors) return { ...region, label: 'Garden' };
    const bucket = votes[region.id];
    let best = 'Room';
    if (bucket) {
      best = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0][0];
    }
    used[best] = (used[best] ?? 0) + 1;
    return { ...region, label: used[best] > 1 ? `${best} ${used[best]}` : best };
  });
}

/** Which region a world position falls in. */
export function regionAtWorld(
  lot: LotLayout,
  regions: LotRegion[],
  worldX: number,
  worldZ: number,
): LotRegion | null {
  const tx = Math.floor((worldX - lot.originX) / lot.tileSize);
  const tz = Math.floor((worldZ - lot.originZ) / lot.tileSize);
  if (!inBounds(lot, tx, tz)) return null;
  const index = tileIndex(lot, tx, tz);
  return regions.find((region) => region.tiles.includes(index)) ?? null;
}

// --- Costs -----------------------------------------------------------------

export function floorCost(kind: TileKind): number {
  if (kind === 'deck') return DECK_COST;
  if (kind === 'floor') return FLOOR_COST;
  return 0;
}

export function isInsideLot(lot: LotLayout, worldX: number, worldZ: number): boolean {
  const tx = (worldX - lot.originX) / lot.tileSize;
  const tz = (worldZ - lot.originZ) / lot.tileSize;
  return tx >= 0 && tz >= 0 && tx < lot.width && tz < lot.depth;
}

/**
 * Default plot: a grass field with a modest starter home.
 *
 * The plan is deliberately open — wide doorways and a clear central path — so a
 * Sim can actually walk around, and there is lawn out front to stand on.
 */
export function createStarterLot(width = 26, depth = 22, originX = -24, originZ = -12): LotLayout {
  const tiles: TileKind[] = new Array(width * depth).fill('grass');
  const walls: string[] = [];

  const hx = 5;
  const hz = 5;
  const w = 16;
  const d = 10;

  for (let z = hz; z < hz + d; z++) {
    for (let x = hx; x < hx + w; x++) tiles[z * width + x] = 'floor';
  }

  // Outer shell.
  for (let x = hx; x < hx + w; x++) {
    walls.push(hKey(x, hz));
    walls.push(hKey(x, hz + d));
  }
  for (let z = hz; z < hz + d; z++) {
    walls.push(vKey(hx, z));
    walls.push(vKey(hx + w, z));
  }

  // Interior partitions.
  for (let z = hz; z < hz + d; z++) walls.push(vKey(hx + 10, z));
  for (let x = hx; x < hx + 10; x++) walls.push(hKey(x, hz + 5));

  // Doorways, two tiles wide so nobody gets stuck on the frame.
  const doors: string[] = [
    vKey(hx, hz + 4), vKey(hx, hz + 5), // front door
    vKey(hx + 10, hz + 4), vKey(hx + 10, hz + 5), // through to the right wing
    hKey(hx + 4, hz + 5), hKey(hx + 5, hz + 5), // through to the back room
  ];

  const wallKeys = new Set(walls);
  for (const door of doors) wallKeys.delete(door);

  return {
    width,
    depth,
    originX,
    originZ,
    tileSize: 1,
    tiles,
    walls: [...wallKeys],
    doors,
  };
}
