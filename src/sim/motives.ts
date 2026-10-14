import {
  MOTIVE_IDS,
  type Motives,
  type MotiveId,
} from './types';

export interface MotiveMeta {
  id: MotiveId;
  label: string;
  emoji: string;
  /** Points drained per sim hour at neutral personality. */
  decayPerHour: number;
  /** Below this the Sim is in trouble (drives moodlets + autonomy urgency). */
  criticalBelow: number;
}

export const MOTIVE_META: Record<MotiveId, MotiveMeta> = {
  hunger: { id: 'hunger', label: 'Hunger', emoji: '🍽️', decayPerHour: 4.2, criticalBelow: 20 },
  bladder: { id: 'bladder', label: 'Bladder', emoji: '🚽', decayPerHour: 6.5, criticalBelow: 20 },
  energy: { id: 'energy', label: 'Energy', emoji: '⚡', decayPerHour: 4.0, criticalBelow: 20 },
  hygiene: { id: 'hygiene', label: 'Hygiene', emoji: '🚿', decayPerHour: 2.9, criticalBelow: 25 },
  social: { id: 'social', label: 'Social', emoji: '💬', decayPerHour: 3.6, criticalBelow: 25 },
  fun: { id: 'fun', label: 'Fun', emoji: '🎉', decayPerHour: 4.4, criticalBelow: 25 },
  comfort: { id: 'comfort', label: 'Comfort', emoji: '🛋️', decayPerHour: 2.3, criticalBelow: 25 },
  environment: { id: 'environment', label: 'Environment', emoji: '🌿', decayPerHour: 1.5, criticalBelow: 30 },
};

/**
 * Personality shapes how fast each motive drains. Multipliers are applied to the
 * base decay rate (>1 drains faster).
 */
export const TRAIT_MOTIVE_MODIFIERS: Record<string, Partial<Record<MotiveId, number>>> = {
  'Pepper Dem': { social: 1.35, comfort: 1.15, fun: 1.1 },
  'Strategic Schemer': { fun: 1.2, social: 1.1, energy: 0.95 },
  'Kitchen General': { hunger: 0.75, environment: 0.9 },
  'Lover Boy / Girl': { social: 1.4, hygiene: 1.15 },
  'Peace Maker': { social: 0.85, comfort: 0.9, fun: 1.05 },
  'Clout Chaser': { fun: 1.3, social: 1.2, energy: 1.1 },
  'Gentle Giant': { energy: 0.85, hunger: 1.1, comfort: 0.9 },
  'Crying Specialist': { comfort: 1.3, social: 1.15, fun: 1.1 },
};

export function clampMotive(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Fresh motives — mostly satisfied with a little seeded variation. */
export function createInitialMotives(seed = 0.5): Motives {
  const roll = (i: number) => {
    const v = Math.sin(seed * 91.7 + i * 47.3) * 43758.5453;
    return v - Math.floor(v);
  };
  const motives = {} as Motives;
  MOTIVE_IDS.forEach((id, i) => {
    motives[id] = clampMotive(62 + roll(i) * 30);
  });
  return motives;
}

/** Decay a motive set by `minutes` of sim time, honouring trait modifiers. */
export function decayMotives(
  motives: Motives,
  minutes: number,
  traits: string | string[],
): Motives {
  const hours = minutes / 60;
  const list = Array.isArray(traits) ? traits : [traits];
  // Multiple traits compound: an Active + Lazy Sim lands somewhere in between.
  const mods: Partial<Record<MotiveId, number>> = {};
  for (const trait of list) {
    const m = TRAIT_MOTIVE_MODIFIERS[trait];
    if (!m) continue;
    for (const [id, mult] of Object.entries(m) as [MotiveId, number][]) {
      mods[id] = (mods[id] ?? 1) * mult;
    }
  }
  const next = {} as Motives;
  for (const id of MOTIVE_IDS) {
    const rate = MOTIVE_META[id].decayPerHour * (mods[id] ?? 1);
    next[id] = clampMotive(motives[id] - rate * hours);
  }
  return next;
}

/** Apply interaction deltas (positive = satisfies the motive). */
export function applyMotiveDeltas(
  motives: Motives,
  deltas: Partial<Record<MotiveId, number>>,
): Motives {
  const next = { ...motives };
  for (const id of MOTIVE_IDS) {
    const delta = deltas[id];
    if (delta) next[id] = clampMotive(next[id] + delta);
  }
  return next;
}

/** 0 (fully satisfied) .. 1 (empty) — how badly this Sim needs something. */
export function motiveUrgency(value: number): number {
  return clampMotive(100 - value) / 100;
}

export function lowestMotive(motives: Motives): { id: MotiveId; value: number } {
  let id: MotiveId = MOTIVE_IDS[0];
  let value = motives[id];
  for (const candidate of MOTIVE_IDS) {
    if (motives[candidate] < value) {
      id = candidate;
      value = motives[candidate];
    }
  }
  return { id, value };
}

export function averageMotive(motives: Motives): number {
  return MOTIVE_IDS.reduce((sum, id) => sum + motives[id], 0) / MOTIVE_IDS.length;
}

export function motivesInCrisis(motives: Motives): MotiveId[] {
  return MOTIVE_IDS.filter((id) => motives[id] < MOTIVE_META[id].criticalBelow);
}

/** Colour band used by the HUD need bars. */
export function motiveColor(value: number): string {
  if (value < 20) return '#ef4444';
  if (value < 40) return '#f97316';
  if (value < 60) return '#eab308';
  if (value < 80) return '#22c55e';
  return '#10b981';
}
