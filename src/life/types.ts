import type { Gender, Hairstyle } from '../types';
import type { MotiveId, SkillId } from '../sim/types';
import type { LotLayout } from '../lot/types';

// ---------------------------------------------------------------------------
// A life sim, not a competition show.
//
//   Sims live on a Lot. A Lot holds Placed Objects bought from the Catalog.
//   Objects expose Interactions. Interactions satisfy Motives. Careers pay for
//   better objects. Time advances and Sims age.
// ---------------------------------------------------------------------------

export type LifeStage = 'baby' | 'child' | 'teen' | 'youngAdult' | 'adult' | 'elder';

export interface LifeStageMeta {
  id: LifeStage;
  label: string;
  emoji: string;
  /** Days spent in this stage before ageing up. */
  days: number;
  /** Highest skill level reachable in this stage. */
  skillCap: number;
  canWork: boolean;
  canRomance: boolean;
  canBeAlone: boolean;
}

export type AspirationId =
  | 'fortune'
  | 'family'
  | 'knowledge'
  | 'popularity'
  | 'romance'
  | 'creativity'
  | 'nature'
  | 'athletic';

export interface AspirationMeta {
  id: AspirationId;
  label: string;
  emoji: string;
  description: string;
  /** Motives this aspiration cares about most (used for the bonus moodlet). */
  focus: MotiveId[];
  bonusSkill: SkillId;
}

export type CareerId =
  | 'tech'
  | 'culinary'
  | 'medicine'
  | 'business'
  | 'entertainment'
  | 'athletics'
  | 'artist';

export interface CareerLevel {
  title: string;
  /** Pay per shift, in ₦. */
  pay: number;
  /** Sim hours. */
  startHour: number;
  endHour: number;
  /** 0 = Sunday. */
  days: number[];
}

export interface CareerMeta {
  id: CareerId;
  label: string;
  emoji: string;
  levels: CareerLevel[];
  /** Skill that drives promotion. */
  skill: SkillId;
}

export interface CareerState {
  id: CareerId;
  level: number;
  /** 0..100; feeds promotion. */
  performance: number;
  shiftsWorked: number;
}

export type RelationKind =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'bestFriend'
  | 'enemy'
  | 'crush'
  | 'partner'
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling';

export interface Relationship {
  friendship: number; // -100..100
  romance: number; // 0..100
  kind: RelationKind;
}

export interface Sim {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  stage: LifeStage;
  /** Days lived in the current life stage. */
  daysInStage: number;
  /** Sims traits (2–3 ids) — drive motive decay and autonomy. */
  traits: string[];
  aspiration: AspirationId;
  avatar: string;
  accentColor: string;
  skinTone?: string;
  hairstyle?: Hairstyle;
  career: CareerState | null;
  /** Set while the Sim is off at work / school. */
  atWork: boolean;
  relationships: Record<string, Relationship>;
  generation: number;
  /** Player-controlled Sims render a portrait in the HUD. */
  playable: boolean;
}

// --- Buy mode ---------------------------------------------------------------

export type ObjectCategory =
  | 'seating'
  | 'surfaces'
  | 'beds'
  | 'plumbing'
  | 'appliances'
  | 'electronics'
  | 'skill'
  | 'decor'
  | 'outdoor';

export interface ObjectRatings {
  hunger?: number;
  bladder?: number;
  energy?: number;
  hygiene?: number;
  social?: number;
  fun?: number;
  comfort?: number;
  environment?: number;
}

export interface ObjectInteractionTemplate {
  key: string;
  label: string;
  emoji: string;
  minutes: number;
  /**
   * Which of the object's ratings this interaction draws on. The delta applied
   * is `rating × RATING_SCALE`, so a better object satisfies the motive faster.
   */
  uses: MotiveId[];
  /** Flat additions regardless of object quality. */
  bonus?: Partial<Record<MotiveId, number>>;
  skill?: { id: SkillId; xp: number };
  moodlet?: { id: string; minutes: number };
  /** Overrides the weight derived from `uses`. */
  autonomy?: Partial<Record<MotiveId, number>>;
  requiresSkill?: { id: SkillId; level: number };
  /** Only certain life stages can use it. */
  stages?: LifeStage[];
}

export interface CatalogObject {
  id: string;
  name: string;
  emoji: string;
  category: ObjectCategory;
  price: number;
  /** Grid cells [width, depth]. */
  footprint: [number, number];
  description: string;
  /** Motive ratings 0–10. Drives both the interaction strength and the room's environment. */
  ratings: ObjectRatings;
  interactions: ObjectInteractionTemplate[];
  /** Only placeable outdoors. */
  outdoorOnly?: boolean;
}

export interface PlacedObject {
  uid: string;
  catalogId: string;
  x: number;
  z: number;
  /** Grid rotation in 90° steps. */
  rotation: 0 | 1 | 2 | 3;
}

// --- Household / lot --------------------------------------------------------

export interface Household {
  /** Save-format version; see persistence.ts. */
  version?: number;
  name: string;
  funds: number;
  sims: Sim[];
  /** The land: tiles and the walls the player built. */
  plot: LotLayout;
  /** Furniture placed on that land. */
  lot: PlacedObject[];
  generation: number;
}
