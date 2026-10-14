import { LIFE_STAGES, MAX_TRAITS, nextStage } from './content';
import type { LifeStage, Relationship, RelationKind, Sim } from './types';

// ---------------------------------------------------------------------------
// Ageing, life stages, and relationship state.
// ---------------------------------------------------------------------------

export interface AgeResult {
  sim: Sim;
  agedUp: boolean;
  newStage: LifeStage | null;
}

/** Advance a Sim by `days` of lived time, ageing them up when the stage ends. */
export function advanceAge(sim: Sim, days: number): AgeResult {
  let stage = sim.stage;
  let daysInStage = sim.daysInStage + days;
  let agedUp = false;

  // Loop so a long time-skip can push through several stages.
  for (let guard = 0; guard < 8; guard++) {
    const meta = LIFE_STAGES[stage];
    if (daysInStage < meta.days) break;
    const following = nextStage(stage);
    if (!following) {
      daysInStage = meta.days; // Elders stay elders.
      break;
    }
    daysInStage -= meta.days;
    stage = following;
    agedUp = true;
  }

  return {
    sim: { ...sim, stage, daysInStage },
    agedUp,
    newStage: agedUp ? stage : null,
  };
}

export function stageProgress(sim: Sim): number {
  const meta = LIFE_STAGES[sim.stage];
  return Math.max(0, Math.min(1, sim.daysInStage / meta.days));
}

export function skillCapFor(stage: LifeStage): number {
  return LIFE_STAGES[stage].skillCap;
}

export function canUseInteraction(
  sim: Pick<Sim, 'stage'>,
  interaction: { stages?: string[] },
): boolean {
  if (!interaction.stages) return true;
  return interaction.stages.includes(sim.stage);
}

export function traitsFor(sim: Pick<Sim, 'traits'>, count = MAX_TRAITS): string[] {
  return sim.traits.slice(0, count);
}

// ------------------------------ Relationships ------------------------------

export function emptyRelationship(): Relationship {
  return { friendship: 0, romance: 0, kind: 'stranger' };
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** Relationship label derived from the two meters. */
export function relationKindFor(rel: Pick<Relationship, 'friendship' | 'romance'>, stage?: LifeStage): RelationKind {
  if (rel.friendship <= -50) return 'enemy';
  if (rel.romance >= 60 && rel.friendship >= 60) return 'spouse';
  if (rel.romance >= 40) return 'partner';
  if (rel.romance >= 15) return 'crush';
  if (rel.friendship >= 75) return 'bestFriend';
  if (rel.friendship >= 40) return 'friend';
  if (rel.friendship >= 10) return 'acquaintance';
  void stage;
  return 'stranger';
}

export interface RelationshipDelta {
  friendship?: number;
  romance?: number;
}

export function adjustRelationship(
  rel: Relationship,
  delta: RelationshipDelta,
): Relationship {
  const friendship = clamp(rel.friendship + (delta.friendship ?? 0), -100, 100);
  const romance = clamp(rel.romance + (delta.romance ?? 0), 0, 100);
  const next: Relationship = { friendship, romance, kind: rel.kind };
  // Family/special kinds are set explicitly and survive meter changes.
  const familyKinds: RelationKind[] = ['parent', 'child', 'sibling'];
  if (!familyKinds.includes(rel.kind)) next.kind = relationKindFor(next);
  return next;
}

/** Apply the same change to both sides of a relationship. */
export function applyMutualRelationship(
  rel: Relationship,
  delta: RelationshipDelta,
): Relationship {
  return adjustRelationship(rel, delta);
}

export function friendshipLabel(value: number): string {
  if (value <= -50) return 'Despised';
  if (value <= -10) return 'Tense';
  if (value < 10) return 'Neutral';
  if (value < 40) return 'Acquaintance';
  if (value < 75) return 'Friend';
  return 'Best Friend';
}
