import { allInteractions, getInteraction } from './interactions';
import { motiveUrgency } from './motives';
import { meetsSkillRequirement } from './skills';
import type { InteractionDef, Motives, Skills } from './types';

export interface AutonomyContext {
  motives: Motives;
  skills: Skills;
  traits: string[];
  /** Sim minute used for deterministic jitter (so choices vary over time). */
  now: number;
  /** Stable per-avatar seed. */
  seed: number;
  /** Extra gate (e.g. HoH-only objects). Defaults to allowing everything. */
  allowed?: (def: InteractionDef) => boolean;
  /** Recently performed interaction ids to discourage repetition. */
  recent?: string[];
  /** Other Sims this Sim could interact with right now. */
  socialTargets?: (string | { id: string; stage?: string })[];
  /** The actor's relationships, used to gate affectionate interactions. */
  relationships?: Record<string, { friendship: number; romance: number }>;
}

export interface SocialTarget {
  id: string;
  stage?: string;
}

export function normaliseTargets(
  targets: (string | SocialTarget)[] | undefined,
): SocialTarget[] {
  if (!targets) return [];
  return targets.map((t) => (typeof t === 'string' ? { id: t } : t));
}

/**
 * Can this Sim perform `def` on anybody right now? Checks the life stages the
 * interaction accepts and how close the two of them are.
 */
function hasEligibleSocialTarget(def: InteractionDef, ctx: AutonomyContext): boolean {
  const targets = normaliseTargets(ctx.socialTargets);
  if (targets.length === 0) return false;
  const spec = def.social!;
  return targets.some((target) => {
    if (spec.targetStages && target.stage && !spec.targetStages.includes(target.stage)) {
      return false;
    }
    const rel = ctx.relationships?.[target.id];
    if (spec.requiresRelationship) {
      if (!rel) return false;
      if (
        spec.requiresRelationship.friendship !== undefined &&
        rel.friendship < spec.requiresRelationship.friendship
      ) {
        return false;
      }
      if (
        spec.requiresRelationship.romance !== undefined &&
        rel.romance < spec.requiresRelationship.romance
      ) {
        return false;
      }
    }
    return true;
  });
}

function hash(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

export function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Utility score for an interaction: the sum of each tracked motive's urgency
 * (how empty it is) weighted by how much the interaction addresses it.
 * Returns null when the interaction is locked.
 */
export function scoreInteraction(def: InteractionDef, ctx: AutonomyContext): number | null {
  if (ctx.allowed && !ctx.allowed(def)) return null;
  if (!meetsSkillRequirement(ctx.skills, def.requiresSkill)) return null;
  // Socialising needs somebody eligible to socialise with.
  if (def.social && !hasEligibleSocialTarget(def, ctx)) return null;

  let score = 0;
  for (const [motive, weight] of Object.entries(def.autonomy) as [keyof Motives, number][]) {
    score += weight * motiveUrgency(ctx.motives[motive]);
  }

  // Mild variety: decay the score for things done very recently.
  const recentIndex = ctx.recent?.indexOf(def.id) ?? -1;
  if (recentIndex >= 0) score *= 0.45;

  // Deterministic jitter so two Sims with identical needs don't lock-step.
  score *= 0.85 + hash(ctx.seed, def.id.length * 7 + ctx.now / 30) * 0.3;

  return score;
}

export interface ScoredInteraction {
  def: InteractionDef;
  score: number;
}

export function rankInteractions(ctx: AutonomyContext): ScoredInteraction[] {
  const ranked: ScoredInteraction[] = [];
  for (const def of allInteractions()) {
    const score = scoreInteraction(def, ctx);
    if (score !== null && score > 0) ranked.push({ def, score });
  }
  return ranked.sort((a, b) => b.score - a.score);
}

/** Minimum utility before a Sim will bother acting on its own. */
export const AUTONOMY_THRESHOLD = 0.18;

export function chooseAutonomousInteraction(ctx: AutonomyContext): InteractionDef | null {
  const best = rankInteractions(ctx)[0];
  if (!best || best.score < AUTONOMY_THRESHOLD) return null;
  return best.def;
}

/** Resolve an interaction id, ignoring unknown ids. */
export function resolveInteraction(id: string): InteractionDef | undefined {
  return getInteraction(id);
}
