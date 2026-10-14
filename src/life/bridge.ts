import { useSimStore } from '../sim/simStore';
import { clockParts } from '../sim/time';
import { useLifeStore } from './lifeStore';
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

/** Trigger day rollovers (ageing, bills, missed shifts) from the sim clock. */
export function syncLifeClock(): void {
  if (!useLifeStore.getState().household) return;
  const parts = clockParts(useSimStore.getState().clock);
  useLifeStore.getState().advanceLifeDay(parts.dayOffset, parts.weekday);
}
