import { CAREERS } from './content';
import type { CareerState, Sim } from './types';
import type { Skills } from '../sim/types';
import { getSkillLevel } from '../sim/skills';
import { LIFE_STAGES } from './content';

// ---------------------------------------------------------------------------
// Careers: shifts, pay, performance and promotion.
// ---------------------------------------------------------------------------

/** Weekday is 1 = Monday … 7 = Sunday (matching the game clock). */
const WEEKDAY_TO_JS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 };

export function isWorkDay(career: CareerState, weekday: number): boolean {
  const meta = CAREERS[career.id];
  if (!meta) return false;
  const level = meta.levels[Math.min(career.level, meta.levels.length - 1)];
  return level.days.includes(WEEKDAY_TO_JS[weekday] ?? -1);
}

export function shiftFor(career: CareerState, weekday: number) {
  const meta = CAREERS[career.id];
  if (!meta) return null;
  const level = meta.levels[Math.min(career.level, meta.levels.length - 1)];
  if (!level.days.includes(WEEKDAY_TO_JS[weekday] ?? -1)) return null;
  return level;
}

/** Is the Sim supposed to be at work right now? */
export function isOnShift(career: CareerState, weekday: number, hour: number): boolean {
  const shift = shiftFor(career, weekday);
  if (!shift) return false;
  return hour >= shift.startHour && hour < shift.endHour;
}

export function shiftPay(career: CareerState): number {
  const meta = CAREERS[career.id];
  if (!meta) return 0;
  return meta.levels[Math.min(career.level, meta.levels.length - 1)].pay;
}

export function levelTitle(career: CareerState): string {
  const meta = CAREERS[career.id];
  if (!meta) return 'Unemployed';
  return meta.levels[Math.min(career.level, meta.levels.length - 1)].title;
}

export function canBePromoted(career: CareerState, skills: Skills): boolean {
  const meta = CAREERS[career.id];
  if (!meta) return false;
  if (career.level >= meta.levels.length - 1) return false;
  const required = Math.min(career.level + 1, 10);
  return getSkillLevel(skills, meta.skill) >= required;
}

export const PROMOTION_THRESHOLD = 100;

export interface WorkResult {
  career: CareerState;
  paid: number;
  promoted: boolean;
  fired: boolean;
}

/** Apply the outcome of one completed shift. */
export function completeShift(sim: Sim, skills: Skills): WorkResult {
  const career = sim.career;
  if (!career) return { career: { id: 'tech', level: 0, performance: 0, shiftsWorked: 0 }, paid: 0, promoted: false, fired: false };

  const meta = CAREERS[career.id];
  const requiredSkill = getSkillLevel(skills, meta.skill);

  // Doing well needs the skill the career runs on.
  const gain = 18 + requiredSkill * 6;
  const performance = Math.max(0, Math.min(PROMOTION_THRESHOLD, career.performance + gain));

  let next: CareerState = { ...career, performance, shiftsWorked: career.shiftsWorked + 1 };
  let promoted = false;

  if (performance >= PROMOTION_THRESHOLD && canBePromoted(next, skills)) {
    next = { ...next, level: next.level + 1, performance: 0 };
    promoted = true;
  }

  const paid = shiftPay(career);
  // Chronic no-shows tank performance.
  const fired = false;

  return { career: next, paid, promoted, fired };
}

/** Called when a shift is missed — performance slips. */
export function missShift(career: CareerState): CareerState {
  return { ...career, performance: Math.max(0, career.performance - 25) };
}

export function adultOnly(sim: Sim): boolean {
  return LIFE_STAGES[sim.stage].canWork;
}
