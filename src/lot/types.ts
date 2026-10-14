// ---------------------------------------------------------------------------
// The lot: land you own, a tile grid you pave, and walls you draw.
//
// Rooms are *derived* from the walls rather than hard-coded, which is the whole
// point — the player decides the floor plan.
// ---------------------------------------------------------------------------

export type TileKind = 'grass' | 'floor' | 'deck';

export interface LotLayout {
  /** Lot size in tiles. */
  width: number;
  depth: number;
  /** World position of the (0,0) tile corner. */
  originX: number;
  originZ: number;
  /** World units per tile. */
  tileSize: number;
  /** Row-major tiles, length = width * depth. */
  tiles: TileKind[];
  /**
   * Wall segments on grid lines, serialised as `h,x,z` (runs along +X from tile
   * column x on grid line z) or `v,x,z` (runs along +Z from tile row z on grid
   * line x).
   */
  walls: string[];
  /**
   * Door segments. Like walls they separate rooms for space detection, but they
   * do not block movement — this is what makes a floor plan livable.
   */
  doors?: string[];
}

export interface LotRegion {
  id: number;
  tiles: number[];
  /** Centre of the region in world units. */
  centerX: number;
  centerZ: number;
  /** True when the region touches the lot boundary (i.e. it is outdoors). */
  outdoors: boolean;
  label: string;
}

export const WALL_COST = 30;
export const FLOOR_COST = 45;
export const DECK_COST = 70;
export const DOOR_COST = 120;
export const WALL_REFUND = 0.5;
export const FLOOR_REFUND = 0.5;
