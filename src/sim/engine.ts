import {
  chooseAutonomousInteraction,
  normaliseTargets,
  seedFromId,
  type AutonomyContext,
  type SocialTarget,
} from './autonomy';
import { getInteraction } from './interactions';
import { addMoodlet, createMoodlet, pruneMoodlets } from './moodlets';
import { applyMotiveDeltas, createInitialMotives, decayMotives } from './motives';
import { addSkillXp } from './skills';
import type { InteractionDef, SimAvatar, SkillId } from './types';

export const RECENT_MEMORY = 4;

export function createSimAvatar(
  id: string,
  nickname: string,
  traits: string | string[],
  seed = seedFromId(id),
): SimAvatar {
  return {
    id,
    nickname,
    traits: Array.isArray(traits) ? traits : [traits],
    motives: createInitialMotives(seed),
    skills: {},
    moodlets: [],
    active: null,
    queue: [],
    recent: [],
  };
}

export interface LevelUp {
  skill: SkillId;
  level: number;
}

export interface SocialOutcome {
  actorId: string;
  targetId: string;
  defId: string;
}

export interface TickResult {
  avatar: SimAvatar;
  completed: InteractionDef | null;
  started: InteractionDef | null;
  levelUps: LevelUp[];
  /** Set when a targeted interaction resolved. */
  social: SocialOutcome | null;
}

export interface TickOptions {
  /** Sim minute at the start of this tick. */
  now: number;
  autonomyEnabled?: boolean;
  allowed?: (def: InteractionDef) => boolean;
  /** Other Sims available to socialise with. */
  socialTargets?: (string | SocialTarget)[];
}

/** Start an interaction immediately, replacing whatever is running. */
/** Targets the interaction actually permits (stage + closeness). */
function eligibleSocialTargets(
  def: InteractionDef,
  actor: SimAvatar,
  targets: (string | SocialTarget)[] | undefined,
): SocialTarget[] {
  const spec = def.social;
  if (!spec) return [];
  return normaliseTargets(targets).filter((target) => {
    if (spec.targetStages && target.stage && !spec.targetStages.includes(target.stage)) return false;
    const rel = actor.relationships?.[target.id];
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

export function startInteraction(
  avatar: SimAvatar,
  defId: string,
  startedBy: 'player' | 'autonomy',
  targetSimId?: string,
): SimAvatar {
  const def = getInteraction(defId);
  if (!def) return avatar;
  return {
    ...avatar,
    active: {
      defId,
      elapsed: 0,
      duration: def.minutes,
      startedBy,
      targetSimId: def.social ? targetSimId : undefined,
    },
  };
}

/** Queue a player order; it runs when the current interaction finishes. */
export function enqueueInteraction(
  avatar: SimAvatar,
  defId: string,
  targetSimId?: string,
): SimAvatar {
  const def = getInteraction(defId);
  if (!def) return avatar;
  if (!avatar.active) return startInteraction(avatar, defId, 'player', targetSimId);
  // Queued entries carry their target in the id list only for social actions,
  // so keep the simple queue for object interactions.
  return { ...avatar, queue: [...avatar.queue, defId] };
}

export function cancelActive(avatar: SimAvatar): SimAvatar {
  if (!avatar.active) return avatar;
  return { ...avatar, active: null };
}

export function clearQueue(avatar: SimAvatar): SimAvatar {
  if (avatar.queue.length === 0) return avatar;
  return { ...avatar, queue: [] };
}

function applyCompletion(
  avatar: SimAvatar,
  def: InteractionDef,
  now: number,
): { avatar: SimAvatar; levelUps: LevelUp[] } {
  let next: SimAvatar = {
    ...avatar,
    motives: applyMotiveDeltas(avatar.motives, def.motiveDeltas),
    recent: [def.id, ...(avatar.recent ?? []).filter((id) => id !== def.id)].slice(0, RECENT_MEMORY),
  };

  const levelUps: LevelUp[] = [];
  if (def.skillXp) {
    let skills = next.skills;
    for (const [skill, xp] of Object.entries(def.skillXp) as [SkillId, number][]) {
      const result = addSkillXp(skills, skill, xp);
      skills = result.skills;
      if (result.levelsGained > 0) levelUps.push({ skill, level: result.newLevel });
    }
    next = { ...next, skills };
  }

  if (def.grants) {
    let moodlets = next.moodlets;
    for (const grant of def.grants) {
      const moodlet = createMoodlet(grant.moodletId, now, grant.minutes, def.id);
      if (moodlet) moodlets = addMoodlet(moodlets, moodlet);
    }
    next = { ...next, moodlets };
  }

  return { avatar: next, levelUps };
}

/**
 * Advance one Sim by `minutes` of sim time.
 *
 * Order of operations per tick:
 *   1. Drain motives.
 *   2. Expire moodlets.
 *   3. Progress / complete the active interaction.
 *   4. Pull the next order off the queue, or pick something autonomously.
 */
export function tickAvatar(avatar: SimAvatar, minutes: number, options: TickOptions): TickResult {
  const { now, autonomyEnabled = true, allowed, socialTargets = [] } = options;
  const endOfTick = now + minutes;

  let next: SimAvatar = {
    ...avatar,
    motives: decayMotives(avatar.motives, minutes, avatar.traits),
    moodlets: pruneMoodlets(avatar.moodlets, endOfTick),
  };

  let completed: InteractionDef | null = null;
  let social: SocialOutcome | null = null;
  const levelUps: LevelUp[] = [];

  // --- Progress the active interaction -------------------------------------
  if (next.active) {
    const elapsed = next.active.elapsed + minutes;
    if (elapsed >= next.active.duration) {
      const def = getInteraction(next.active.defId);
      if (def) {
        const applied = applyCompletion(next, def, endOfTick);
        const targetId = next.active.targetSimId;
        next = { ...applied.avatar, active: null };
        levelUps.push(...applied.levelUps);
        completed = def;
        if (def.social && targetId) {
          social = { actorId: next.id, targetId, defId: def.id };
        }
      } else {
        next = { ...next, active: null };
      }
    } else {
      next = { ...next, active: { ...next.active, elapsed } };
    }
  }

  // --- Start the next thing --------------------------------------------------
  let started: InteractionDef | null = null;
  if (!next.active) {
    let pendingId: string | undefined;
    let startedBy: 'player' | 'autonomy' = 'player';
    let fromQueue = false;
    let autoTargetId: string | undefined;

    if (next.queue.length > 0) {
      pendingId = next.queue[0];
      fromQueue = true;
    } else if (autonomyEnabled) {
      const ctx: AutonomyContext = {
        motives: next.motives,
        skills: next.skills,
        traits: next.traits,
        now: endOfTick,
        seed: seedFromId(next.id),
        allowed,
        recent: next.recent,
        socialTargets,
      };
      const chosen = chooseAutonomousInteraction(ctx);
      if (chosen) {
        pendingId = chosen.id;
        startedBy = 'autonomy';
        if (chosen.social) {
          const eligible = eligibleSocialTargets(chosen, next, socialTargets);
          if (eligible.length > 0) {
            // Spread the attention around rather than always picking the first.
            const pick = Math.floor(Math.abs(Math.sin(endOfTick)) * eligible.length);
            autoTargetId = eligible[pick % eligible.length].id;
          } else {
            pendingId = undefined; // nobody suitable after all
          }
        }
      }
    }

    if (pendingId) {
      const def = getInteraction(pendingId);
      if (def) {
        next = {
          ...next,
          queue: fromQueue ? next.queue.slice(1) : next.queue,
          active: {
            defId: def.id,
            elapsed: 0,
            duration: def.minutes,
            startedBy,
            targetSimId: def.social ? autoTargetId : undefined,
          },
        };
        started = def;
      } else if (fromQueue) {
        // Unknown queued id — drop it so the queue can't jam.
        next = { ...next, queue: next.queue.slice(1) };
      }
    }
  }

  return { avatar: next, completed, started, levelUps, social };
}
