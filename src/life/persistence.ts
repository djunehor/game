import type { Household } from './types';

const KEY = 'life-sim-household-v1';

export function saveHousehold(household: Household): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(household));
  } catch {
    /* storage unavailable — the session still works in memory */
  }
}

export function loadHousehold(): Household | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Household;
    if (!parsed?.sims?.length || !Array.isArray(parsed.lot)) return null;
    return parsed;
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
