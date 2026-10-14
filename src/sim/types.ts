// ---------------------------------------------------------------------------
// Sims-style simulation core — shared types.
//
// The original game is turn-based (one tick = one in-game day). This layer adds
// the continuous, real-time half of a life sim: a clock you can pause and speed
// up, motive bars that drain, moodlets, skills, and autonomous behaviour.
//
// Everything here is intentionally free of React/three imports so the whole
// simulation can be unit-tested headlessly.
// ---------------------------------------------------------------------------

// --- Motives (Sims "needs") -------------------------------------------------
// Stored 0..100 where 100 = fully satisfied. The UI shows them as need bars.
export type MotiveId =
  | 'hunger'
  | 'bladder'
  | 'energy'
  | 'hygiene'
  | 'social'
  | 'fun'
  | 'comfort'
  | 'environment';

export const MOTIVE_IDS: MotiveId[] = [
  'hunger',
  'bladder',
  'energy',
  'hygiene',
  'social',
  'fun',
  'comfort',
  'environment',
];

export type Motives = Record<MotiveId, number>;

// --- Moodlets & emotion -----------------------------------------------------
export type EmotionId =
  | 'neutral'
  | 'content'
  | 'happy'
  | 'elated'
  | 'energized'
  | 'focused'
  | 'flirty'
  | 'sad'
  | 'angry'
  | 'embarrassed'
  | 'uncomfortable'
  | 'stressed';

export interface Moodlet {
  /** Stable id of the moodlet *type* (used for dedupe + refresh). */
  id: string;
  label: string;
  emoji: string;
  /** How good (+) or bad (-) this feels. */
  intensity: number;
  /** Emotion weights contributed while active. */
  emotion: Partial<Record<EmotionId, number>>;
  /** Absolute sim-minute timestamp when it expires. Infinity = held by condition. */
  expiresAt: number;
  /** Where it came from (interaction id, 'motive', etc.) — useful for debugging. */
  source: string;
}

export interface Mood {
  emotion: EmotionId;
  label: string;
  emoji: string;
  /** Net mood score; positive is good. */
  score: number;
  /** 0..100 normalised happiness for the UI. */
  grade: number;
}

// --- Skills -----------------------------------------------------------------
export type SkillId =
  | 'cooking'
  | 'charisma'
  | 'fitness'
  | 'logic'
  | 'creativity'
  | 'cleaning'
  | 'gardening'
  | 'gaming';

export const SKILL_IDS: SkillId[] = [
  'cooking',
  'charisma',
  'fitness',
  'logic',
  'creativity',
  'cleaning',
  'gardening',
  'gaming',
];

export interface SkillProgress {
  xp: number;
}

export type Skills = Partial<Record<SkillId, SkillProgress>>;

// --- Interactions -----------------------------------------------------------
export interface InteractionDef {
  id: string;
  label: string;
  emoji: string;
  /** Spatial tag used for grouping/listings. Free-form so both the show rooms
   *  and the life-sim rooms can share the interaction registry. */
  room: string;
  /** Object/station this uses, for UI + world anchoring. */
  object: string;
  /** How long one run takes, in sim minutes. */
  minutes: number;
  /** Motive changes applied on completion. */
  motiveDeltas: Partial<Record<MotiveId, number>>;
  /** Skill XP awarded on completion. */
  skillXp?: Partial<Record<SkillId, number>>;
  /** Transient moodlets granted on completion. */
  grants?: { moodletId: string; minutes: number }[];
  /**
   * Autonomy weights: how strongly each unmet motive pulls a Sim toward this
   * interaction. Higher weight on `hunger` means a hungry Sim seeks it out.
   */
  autonomy: Partial<Record<MotiveId, number>>;
  /** Unlock requirements. */
  requiresSkill?: { id: SkillId; level: number };
  /** Life stages allowed to use this (undefined = everyone). */
  stages?: string[];
}

export interface ActiveInteraction {
  defId: string;
  /** Sim minutes already spent. */
  elapsed: number;
  /** Total sim minutes required (snapshot of def.minutes at start). */
  duration: number;
  /** Who/what started it. `autonomy` = the Sim chose it themselves. */
  startedBy: 'player' | 'autonomy';
}

// --- Sim avatar -------------------------------------------------------------
export interface SimAvatar {
  id: string;
  nickname: string;
  /** Trait ids — looked up in the motive-modifier registry. */
  traits: string[];
  motives: Motives;
  skills: Skills;
  moodlets: Moodlet[];
  active: ActiveInteraction | null;
  /** Player-issued interactions waiting to run, in order. */
  queue: string[];
  /** Recently completed interaction ids (most recent first) for variety. */
  recent?: string[];
}

// --- Clock ------------------------------------------------------------------
/** 0 = paused, 1/2/3 = speed multiplier. */
export type SimSpeed = 0 | 1 | 2 | 3;

export interface SimClock {
  /** Total sim minutes elapsed since the sim started. */
  totalMinutes: number;
  /** Day index (1-based) the sim started on, to align with the weekly show. */
  startDay: number;
  /** Hour of day (0-23) the sim started at. */
  startHour: number;
  /** Sim minutes per real second at speed 1. */
  minutesPerSecond: number;
}
