import type { Household } from './types';

const KEY = 'life-sim-household-v1';

/**
 * Bump whenever the shape of `Household` changes in a way older saves cannot
 * satisfy. Loading a save that predates a required field must fail loudly
 * (by returning null) rather than half-load and render an empty world.
 *
 *   1 — household + flat furniture list
 *   2 — added `plot` (tile grid + player-drawn walls)
 */
export const SAVE_VERSION = 2;

export function saveHousehold(household: Household): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...household, version: SAVE_VERSION }));
  } catch {
    /* storage unavailable — the session still works in memory */
  }
}

/** The fields every version of the game has had. */
function hasCoreFields(household: unknown): boolean {
  const h = household as Household | null;
  if (!h || typeof h !== 'object') return false;
  if (!Array.isArray(h.sims) || h.sims.length === 0) return false;
  if (typeof h.funds !== 'number') return false;
  return Array.isArray(h.lot);
}

/**
 * The land. Without this the world renders empty, so a save that lacks it
 * cannot be salvaged — there is no sensible default floor plan to invent.
 */
function hasValidPlot(household: unknown): boolean {
  const plot = (household as Household | null)?.plot;
  if (!plot || typeof plot !== 'object') return false;
  if (typeof plot.width !== 'number' || typeof plot.depth !== 'number') return false;
  if (!Array.isArray(plot.tiles) || plot.tiles.length !== plot.width * plot.depth) return false;
  if (!Array.isArray(plot.walls)) return false;
  if (typeof plot.originX !== 'number' || typeof plot.originZ !== 'number') return false;
  return true;
}

export function loadHousehold(): Household | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;

    if (hasCoreFields(parsed) && hasValidPlot(parsed)) {
      // Stamp the current version: a save written before versioning is still
      // perfectly playable if it has land, so keep the household.
      return { ...(parsed as Household), version: SAVE_VERSION };
    }

    // Unusable (saved before the lot existed, or corrupt). Drop it so the
    // player gets a clean start instead of an empty green world.
    localStorage.removeItem(KEY);
    return null;
  } catch {
    return null;
  }
}

export function clearHousehold(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
