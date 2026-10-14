import type { MotiveId, Motives } from '../sim/types';

// ---------------------------------------------------------------------------
// Consequences: what happens when a need is left to hit rock bottom.
//
// Without these, a motive reaching zero is just a sad face — the Sim carries on
// regardless. Each consequence interrupts them, costs them something and
// carries a cooldown so it cannot fire repeatedly.
// ---------------------------------------------------------------------------

export interface Consequence {
  id: string;
  motive: MotiveId;
  /** Fires at or below this value. */
  threshold: number;
  /** Sim minutes before it can happen to the same Sim again. */
  cooldownMinutes: number;
  moodlet: { id: string; minutes: number };
  /** Extra motive changes applied on top of the scene. */
  effects?: Partial<Record<MotiveId, number>>;
  emoji: string;
  message: (name: string) => string;
  /** Cancel whatever they were doing — you cannot nap through this. */
  interrupts: boolean;
}

export const CONSEQUENCES: Consequence[] = [
  {
    id: 'collapse',
    motive: 'energy',
    threshold: 1,
    cooldownMinutes: 360,
    moodlet: { id: 'exhausted_collapse', minutes: 300 },
    effects: { energy: 30, hygiene: -25, comfort: -20, fun: -10 },
    emoji: '🥵',
    message: (name) => `${name} passed out from exhaustion and had to be helped to bed.`,
    interrupts: true,
  },
  {
    id: 'accident',
    motive: 'bladder',
    threshold: 0,
    cooldownMinutes: 480,
    moodlet: { id: 'embarrassed_moment', minutes: 360 },
    effects: { bladder: 80, hygiene: -55, environment: -25, comfort: -15 },
    emoji: '😳',
    message: (name) => `${name} did not make it to the toilet in time. Mortifying.`,
    interrupts: true,
  },
  {
    id: 'faint',
    motive: 'hunger',
    threshold: 0,
    cooldownMinutes: 480,
    moodlet: { id: 'exhausted_collapse', minutes: 240 },
    effects: { hunger: 35, energy: -25, comfort: -20, fun: -12 },
    emoji: '🫠',
    message: (name) => `${name} fainted from hunger. Somebody get them a plate.`,
    interrupts: true,
  },
  {
    id: 'meltdown',
    motive: 'fun',
    threshold: 0,
    cooldownMinutes: 600,
    moodlet: { id: 'rude_encounter', minutes: 180 },
    effects: { fun: 40, social: -20, comfort: -10 },
    emoji: '😩',
    message: (name) => `${name} had a total meltdown from sheer boredom.`,
    interrupts: false,
  },
  {
    id: 'lonely_spiral',
    motive: 'social',
    threshold: 0,
    cooldownMinutes: 720,
    moodlet: { id: 'embarrassed_moment', minutes: 240 },
    effects: { social: 30, fun: -15, comfort: -15 },
    emoji: '🫥',
    message: (name) => `${name} went quiet and withdrawn — nobody has spoken to them in days.`,
    interrupts: false,
  },
];

export type Consequences = Record<string, number>;

/**
 * Which consequence (if any) should fire for this Sim right now.
 * Returns the worst applicable one so a Sim in total crisis collapses rather
 * than merely sulking.
 */
export function pendingConsequence(
  motives: Motives,
  cooldowns: Consequences,
  now: number,
): Consequence | null {
  let worst: Consequence | null = null;
  for (const consequence of CONSEQUENCES) {
    if (motives[consequence.motive] > consequence.threshold) continue;
    const last = cooldowns[consequence.id];
    if (last !== undefined && now - last < consequence.cooldownMinutes) continue;
    // Order by how empty the motive is, then by how severe the scene is.
    if (
      !worst ||
      motives[consequence.motive] < motives[worst.motive] ||
      consequence.interrupts
    ) {
      worst = consequence;
    }
  }
  return worst;
}

/** Apply a consequence's effects to a motive set. */
export function applyConsequenceEffects(
  motives: Motives,
  consequence: Consequence,
  applyDeltas: (m: Motives, deltas: Partial<Record<MotiveId, number>>) => Motives,
): Motives {
  if (!consequence.effects) return motives;
  return applyDeltas(motives, consequence.effects);
}
