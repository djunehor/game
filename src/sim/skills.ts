import { SKILL_IDS, type SkillId, type SkillProgress, type Skills } from './types';

export const MAX_SKILL_LEVEL = 10;

export interface SkillMeta {
  id: SkillId;
  label: string;
  emoji: string;
  description: string;
}

export const SKILL_META: Record<SkillId, SkillMeta> = {
  cooking: { id: 'cooking', label: 'Cooking', emoji: '🍳', description: 'Better meals, fewer burnt pots.' },
  charisma: { id: 'charisma', label: 'Charisma', emoji: '🎤', description: 'Win arguments and win hearts.' },
  fitness: { id: 'fitness', label: 'Fitness', emoji: '💪', description: 'Stamina for challenges and long nights.' },
  logic: { id: 'logic', label: 'Logic', emoji: '🧠', description: 'Puzzles, strategy and scheming.' },
  creativity: { id: 'creativity', label: 'Creativity', emoji: '🎨', description: 'Drama, performance and content.' },
  cleaning: { id: 'cleaning', label: 'Cleaning', emoji: '🧹', description: 'Keeps the environment pleasant.' },
  gardening: { id: 'gardening', label: 'Gardening', emoji: '🌱', description: 'Grows fresh ingredients.' },
  gaming: { id: 'gaming', label: 'Gaming', emoji: '🎮', description: 'Reflexes and fun in equal measure.' },
};

/** XP required to advance from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  if (level >= MAX_SKILL_LEVEL) return Infinity;
  return Math.round(120 * Math.pow(level + 1, 1.55));
}

/** Cumulative XP required to reach `level` from zero. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) total += xpToNextLevel(i);
  return total;
}

export function getSkillLevel(skills: Skills, id: SkillId): number {
  const xp = skills[id]?.xp ?? 0;
  let level = 0;
  while (level < MAX_SKILL_LEVEL && xp >= cumulativeXpForLevel(level + 1)) level++;
  return level;
}

export interface SkillProgressView {
  id: SkillId;
  label: string;
  emoji: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 progress toward the next level (1 when maxed). */
  ratio: number;
  maxed: boolean;
}

export function skillProgress(skills: Skills, id: SkillId): SkillProgressView {
  const meta = SKILL_META[id];
  const xp = skills[id]?.xp ?? 0;
  const level = getSkillLevel(skills, id);
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const maxed = level >= MAX_SKILL_LEVEL;
  const span = maxed ? 1 : Math.max(1, next - base);
  const into = xp - base;
  return {
    id,
    label: meta.label,
    emoji: meta.emoji,
    level,
    xp,
    xpIntoLevel: maxed ? 0 : into,
    xpForNext: maxed ? 0 : xpToNextLevel(level),
    ratio: maxed ? 1 : Math.max(0, Math.min(1, into / span)),
    maxed,
  };
}

export function allSkillProgress(skills: Skills): SkillProgressView[] {
  return SKILL_IDS.map((id) => skillProgress(skills, id));
}

export interface AddXpResult {
  skills: Skills;
  levelsGained: number;
  newLevel: number;
}

/** Award skill XP and report any level-ups. */
export function addSkillXp(skills: Skills, id: SkillId, amount: number): AddXpResult {
  if (amount <= 0) {
    return { skills, levelsGained: 0, newLevel: getSkillLevel(skills, id) };
  }
  const before = getSkillLevel(skills, id);
  const existing: SkillProgress = skills[id] ?? { xp: 0 };
  const next: Skills = { ...skills, [id]: { xp: existing.xp + amount } };
  const after = getSkillLevel(next, id);
  return { skills: next, levelsGained: after - before, newLevel: after };
}

export function meetsSkillRequirement(
  skills: Skills,
  requirement?: { id: SkillId; level: number },
): boolean {
  if (!requirement) return true;
  return getSkillLevel(skills, requirement.id) >= requirement.level;
}
