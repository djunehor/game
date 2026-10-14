import { useSimStore } from '../sim/simStore';
import { getInteraction } from '../sim/interactions';
import { addMoodlet, createMoodlet } from '../sim/moodlets';
import { applyMotiveDeltas } from '../sim/motives';
import { clockParts } from '../sim/time';
import { useLifeStore } from './lifeStore';
import { adjustRelationship } from './aging';
import type { InteractionDef } from '../sim/types';

// ---------------------------------------------------------------------------
// Wires the household into the shared simulation core.
// ---------------------------------------------------------------------------

/** Make sure every household member has a live Sim. */
export function syncLifeSims(): void {
  const household = useLifeStore.getState().household;
  const sim = useSimStore.getState();
  if (!household) return;

  for (const member of household.sims) {
    sim.upsertAvatar(member.id, member.firstName, member.traits);
  }
  syncAvatarSocialMeta();

  const liveIds = new Set(household.sims.map((s) => s.id));
  for (const id of Object.keys(useSimStore.getState().avatars)) {
    if (!liveIds.has(id)) useSimStore.getState().removeAvatar(id);
  }

  // Life-stage gate: a baby cannot use a treadmill.
  const stageById = new Map(household.sims.map((s) => [s.id, s.stage]));
  useSimStore.getState().setExtraGate((avatarId: string, def: InteractionDef) => {
    if (!def.stages) return true;
    const stage = stageById.get(avatarId);
    return stage ? def.stages.includes(stage) : true;
  });
}

/**
 * Resolve a Sim-to-Sim interaction: the relationship moves for both of them and
 * the person on the receiving end gets their own reaction.
 */
export function resolveSocialOutcome(
  actorId: string,
  targetId: string,
  defId: string,
): void {
  const def = getInteraction(defId);
  if (!def?.social) return;

  const life = useLifeStore.getState();
  const home = life.household;
  if (!home) return;

  const actor = home.sims.find((s) => s.id === actorId);
  const target = home.sims.find((s) => s.id === targetId);
  if (!actor || !target) return;

  // 1. The relationship changes for both parties.
  const delta = def.social.relationship;
  useLifeStore.setState((s) => {
    if (!s.household) return s;
    return {
      household: {
        ...s.household,
        sims: s.household.sims.map((member) => {
          const otherId = member.id === actorId ? targetId : member.id === targetId ? actorId : null;
          if (!otherId) return member;
          const existing = member.relationships[otherId] ?? {
            friendship: 0,
            romance: 0,
            kind: 'stranger' as const,
          };
          return {
            ...member,
            relationships: {
              ...member.relationships,
              [otherId]: adjustRelationship(existing, delta),
            },
          };
        }),
      },
    };
  });

  // 2. The target reacts in the moment.
  const sim = useSimStore.getState();
  const targetAvatar = sim.avatars[targetId];
  if (targetAvatar) {
    const now = sim.clock.totalMinutes;
    let moodlets = targetAvatar.moodlets;
    const grant = def.social.targetMoodlet;
    if (grant) {
      const moodlet = createMoodlet(grant.id, now, grant.minutes, defId);
      if (moodlet) moodlets = addMoodlet(moodlets, moodlet);
    }
    useSimStore.setState((s) => ({
      avatars: {
        ...s.avatars,
        [targetId]: {
          ...targetAvatar,
          moodlets,
          motives: applyMotiveDeltas(targetAvatar.motives, def.social!.targetMotiveDeltas ?? {}),
        },
      },
    }));
  }

  // 3. Tell the player what just happened between them.
  const newKind = adjustRelationship(
    actor.relationships[targetId] ?? { friendship: 0, romance: 0, kind: 'stranger' as const },
    delta,
  ).kind;
  const verb = delta.friendship && delta.friendship > 0 ? 'got on well with' : 'clashed with';
  // Keep the sim core's copy of the relationship current so the next autonomy
  // decision sees the updated closeness.
  syncAvatarSocialMeta();

  useLifeStore.getState().notify(
    `${actor.firstName} ${verb} ${target.firstName} (${newKind})`,
    def.emoji,
    'info',
  );
}

/** Wire the sim core's social events into the household. */
export function connectSocialOutcomes(): void {
  useSimStore.getState().setSocialSink(({ actorId, targetId, defId }) =>
    resolveSocialOutcome(actorId, targetId, defId),
  );
}

/**
 * Mirror the household's life stages and relationships onto the Sims, so the
 * simulation can gate social interactions (no flirting with children, no hugs
 * between strangers).
 */
export function syncAvatarSocialMeta(): void {
  const home = useLifeStore.getState().household;
  if (!home) return;
  useSimStore.setState((s) => {
    const avatars = { ...s.avatars };
    let changed = false;
    for (const member of home.sims) {
      const avatar = avatars[member.id];
      if (!avatar) continue;
      const relationships = Object.fromEntries(
        Object.entries(member.relationships).map(([id, rel]) => [
          id,
          { friendship: Math.round(rel.friendship), romance: Math.round(rel.romance) },
        ]),
      );
      avatars[member.id] = { ...avatar, stage: member.stage, relationships };
      changed = true;
    }
    return changed ? { avatars } : s;
  });
}

/** Trigger day rollovers (ageing, bills, missed shifts) from the sim clock. */
export function syncLifeClock(): void {
  if (!useLifeStore.getState().household) return;
  const parts = clockParts(useSimStore.getState().clock);
  useLifeStore.getState().advanceLifeDay(parts.dayOffset, parts.weekday);
}
