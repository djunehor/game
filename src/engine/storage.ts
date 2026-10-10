import type { GameState } from '../types';

const STORAGE_KEY = 'biggie-house-save-v1';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode) — fail silently.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || !parsed.player || !parsed.housemates) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
