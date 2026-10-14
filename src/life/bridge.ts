import { useSimStore } from '../sim/simStore';
import { getInteraction } from '../sim/interactions';
import { addMoodlet, createMoodlet } from '../sim/moodlets';
import { addSkillXp } from '../sim/skills';
import { applyMotiveDeltas } from '../sim/motives';
import { clockParts } from '../sim/time';
import { useLifeStore } from './lifeStore';
import { adjustRelationship } from './aging';
import {
  FULFILMENT_REWARD,
  aspirationStatus,
  newlyCompletedMilestones,
  type AspirationContext,
} from './aspirations';
import { ASPIRATIONS } from './content';
import { applyConsequenceEffects, pendingConsequence } from './consequences';
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

/**
 * Check every Sim's aspiration against the state of the world and pay out for
 * anything they have just achieved. Cheap enough to run on a timer.
 */
export function evaluateAspirations(): void {
  const home = useLifeStore.getState().household;
  if (!home) return;
  const sim = useSimStore.getState();

  for (const member of home.sims) {
    const avatar = sim.avatars[member.id];
    if (!avatar) continue;

    const ctx: AspirationContext = {
      sim: member,
      skills: avatar.skills,
      career: member.career,
      counters: avatar.counters ?? {},
      relationships: Object.values(member.relationships),
      ownedCatalogIds: home.lot.map((o) => o.catalogId),
      lot: home.lot,
    };

    const achieved = newlyCompletedMilestones(member.aspiration, ctx);
    if (achieved.length === 0) continue;

    for (const milestone of achieved) {
      useLifeStore.getState().markMilestone(member.id, milestone.id);

      const reward = milestone.reward;
      if (reward.funds) useLifeStore.getState().addFunds(reward.funds);

      if (reward.moodlet) {
        const fresh = useSimStore.getState().avatars[member.id];
        if (fresh) {
          const moodlet = createMoodlet(
            reward.moodlet.id,
            useSimStore.getState().clock.totalMinutes,
            reward.moodlet.minutes,
            `aspiration:${milestone.id}`,
          );
          if (moodlet) {
            useSimStore.setState((s) => ({
              avatars: {
                ...s.avatars,
                [member.id]: { ...fresh, moodlets: addMoodlet(fresh.moodlets, moodlet) },
              },
            }));
          }
        }
      }

      useLifeStore.getState().notify(
        `${member.firstName}: ${milestone.label}${reward.funds ? ` (+₦${reward.funds.toLocaleString()})` : ''}`,
        milestone.emoji,
        'money',
      );
    }

    // Whole track complete?
    const refreshed = useLifeStore.getState().household?.sims.find((s) => s.id === member.id);
    if (refreshed) {
      const status = aspirationStatus(member.aspiration, {
        ...ctx,
        sim: refreshed,
      });
      if (status.fulfilled) {
        const meta = ASPIRATIONS[member.aspiration];
        useLifeStore.getState().addFunds(FULFILMENT_REWARD.funds);
        const bonusXp = 400;
        useSimStore.setState((s) => {
          const target = s.avatars[member.id];
          if (!target) return s;
          const result = addSkillXp(target.skills, meta.bonusSkill, bonusXp);
          return { avatars: { ...s.avatars, [member.id]: { ...target, skills: result.skills } } };
        });
        useLifeStore.getState().notify(
          `${member.firstName} fulfilled their dream: ${meta.label}! (+₦${FULFILMENT_REWARD.funds.toLocaleString()})`,
          '🌟',
          'birthday',
        );
      }
    }
  }
}

/**
 * Rock-bottom consequences. A need left at zero now actually costs the Sim
 * something instead of merely looking sad.
 */
export function evaluateConsequences(): void {
  const home = useLifeStore.getState().household;
  if (!home) return;
  const sim = useSimStore.getState();
  const now = sim.clock.totalMinutes;

  for (const member of home.sims) {
    const avatar = sim.avatars[member.id];
    if (!avatar) continue;

    const consequence = pendingConsequence(
      avatar.motives,
      avatar.consequenceCooldowns ?? {},
      now,
    );
    if (!consequence) continue;

    const motives = applyConsequenceEffects(avatar.motives, consequence, applyMotiveDeltas);
    const moodlet = createMoodlet(
      consequence.moodlet.id,
      now,
      consequence.moodlet.minutes,
      `consequence:${consequence.id}`,
    );

    useSimStore.setState((s) => {
      const target = s.avatars[member.id];
      if (!target) return s;
      return {
        avatars: {
          ...s.avatars,
          [member.id]: {
            ...target,
            motives,
            moodlets: moodlet ? addMoodlet(target.moodlets, moodlet) : target.moodlets,
            consequenceCooldowns: {
              ...(target.consequenceCooldowns ?? {}),
              [consequence.id]: now,
            },
            // Collapsing ends whatever they were in the middle of.
            active: consequence.interrupts ? null : target.active,
          },
        },
      };
    });

    // Being mortified also cools your friendships a little.
    if (consequence.id === 'accident' || consequence.id === 'lonely_spiral') {
      for (const other of home.sims) {
        if (other.id === member.id) continue;
        const rel = member.relationships[other.id];
        if (!rel) continue;
        useLifeStore.setState((s) => {
          if (!s.household) return s;
          return {
            household: {
              ...s.household,
              sims: s.household.sims.map((m) =>
                m.id === member.id
                  ? {
                      ...m,
                      relationships: {
                        ...m.relationships,
                        [other.id]: adjustRelationship(rel, { friendship: -4 }),
                      },
                    }
                  : m,
              ),
            },
          };
        });
      }
    }

    useLifeStore.getState().notify(consequence.message(member.firstName), consequence.emoji, 'warning');
  }
}

/** Trigger day rollovers (ageing, bills, missed shifts) from the sim clock. */
export function syncLifeClock(): void {
  if (!useLifeStore.getState().household) return;
  const parts = clockParts(useSimStore.getState().clock);
  useLifeStore.getState().advanceLifeDay(parts.dayOffset, parts.weekday);
}
