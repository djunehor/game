import { chooseAutonomousInteraction, seedFromId, type AutonomyContext } from './autonomy';
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

export interface TickResult {
  avatar: SimAvatar;
  completed: InteractionDef | null;
  started: InteractionDef | null;
  levelUps: LevelUp[];
}

export interface TickOptions {
  /** Sim minute at the start of this tick. */
  now: number;
  autonomyEnabled?: boolean;
  allowed?: (def: InteractionDef) => boolean;
}

/** Start an interaction immediately, replacing whatever is running. */
export function startInteraction(
  avatar: SimAvatar,
  defId: string,
  startedBy: 'player' | 'autonomy',
): SimAvatar {
  const def = getInteraction(defId);
  if (!def) return avatar;
  return {
    ...avatar,
    active: { defId, elapsed: 0, duration: def.minutes, startedBy },
  };
}

/** Queue a player order; it runs when the current interaction finishes. */
export function enqueueInteraction(avatar: SimAvatar, defId: string): SimAvatar {
  if (!getInteraction(defId)) return avatar;
  if (!avatar.active) return startInteraction(avatar, defId, 'player');
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
  const { now, autonomyEnabled = true, allowed } = options;
  const endOfTick = now + minutes;

  let next: SimAvatar = {
    ...avatar,
    motives: decayMotives(avatar.motives, minutes, avatar.traits),
    moodlets: pruneMoodlets(avatar.moodlets, endOfTick),
  };

  let completed: InteractionDef | null = null;
  const levelUps: LevelUp[] = [];

  // --- Progress the active interaction -------------------------------------
  if (next.active) {
    const elapsed = next.active.elapsed + minutes;
    if (elapsed >= next.active.duration) {
      const def = getInteraction(next.active.defId);
      if (def) {
        const applied = applyCompletion(next, def, endOfTick);
        next = { ...applied.avatar, active: null };
        levelUps.push(...applied.levelUps);
        completed = def;
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
      };
      const chosen = chooseAutonomousInteraction(ctx);
      if (chosen) {
        pendingId = chosen.id;
        startedBy = 'autonomy';
      }
    }

    if (pendingId) {
      const def = getInteraction(pendingId);
      if (def) {
        next = {
          ...next,
          queue: fromQueue ? next.queue.slice(1) : next.queue,
          active: { defId: def.id, elapsed: 0, duration: def.minutes, startedBy },
        };
        started = def;
      } else if (fromQueue) {
        // Unknown queued id — drop it so the queue can't jam.
        next = { ...next, queue: next.queue.slice(1) };
      }
    }
  }

  return { avatar: next, completed, started, levelUps };
}
