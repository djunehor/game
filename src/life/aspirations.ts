import type { Skills } from '../sim/types';
import { getSkillLevel } from '../sim/skills';
import type { AspirationId, CareerState, PlacedObject, Relationship, Sim } from './types';

// ---------------------------------------------------------------------------
// Aspirations: what a Sim is trying to achieve with their life.
//
// Each aspiration has milestones. Completing one pays out and lifts their mood;
// completing all of them fulfils the aspiration and gives a lasting boost.
// Progress is stored on the Sim so it survives a save.
// ---------------------------------------------------------------------------

export interface AspirationContext {
  sim: Sim;
  skills: Skills;
  career: CareerState | null;
  counters: Record<string, number>;
  relationships: Relationship[];
  /** Catalog ids of everything on the lot. */
  ownedCatalogIds: string[];
  lot: PlacedObject[];
}

export interface Milestone {
  id: string;
  label: string;
  emoji: string;
  check: (ctx: AspirationContext) => boolean;
  /** Progress toward the goal, for the UI. */
  progress?: (ctx: AspirationContext) => { current: number; target: number };
  reward: { funds?: number; moodlet?: { id: string; minutes: number } };
}

export const FULFILMENT_REWARD = { funds: 8000, moodlet: { id: 'pampered', minutes: 480 } };

// --- helpers ---------------------------------------------------------------

const skillLevel = (ctx: AspirationContext, id: Parameters<typeof getSkillLevel>[1]) =>
  getSkillLevel(ctx.skills, id);

const countOwned = (ctx: AspirationContext, catalogId: string) =>
  ctx.ownedCatalogIds.filter((id) => id === catalogId).length;

const friendsAtLeast = (ctx: AspirationContext, threshold: number) =>
  ctx.relationships.filter((r) => r.friendship >= threshold).length;

const bestRomance = (ctx: AspirationContext) =>
  ctx.relationships.reduce((max, r) => Math.max(max, r.romance), 0);

const skillsAtLeast = (ctx: AspirationContext, level: number, ids: Parameters<typeof getSkillLevel>[1][]) =>
  ids.filter((id) => skillLevel(ctx, id) >= level).length;

const ALL_SKILLS: Parameters<typeof getSkillLevel>[1][] = [
  'cooking',
  'charisma',
  'fitness',
  'logic',
  'creativity',
  'cleaning',
  'gardening',
  'gaming',
];

const counter = (ctx: AspirationContext, key: string) => ctx.counters[key] ?? 0;

// --- the tracks ------------------------------------------------------------

export const ASPIRATION_MILESTONES: Record<AspirationId, Milestone[]> = {
  fortune: [
    {
      id: 'fortune_shifts',
      label: 'Work 5 shifts',
      emoji: '💼',
      check: (c) => (c.career?.shiftsWorked ?? 0) >= 5,
      progress: (c) => ({ current: Math.min(5, c.career?.shiftsWorked ?? 0), target: 5 }),
      reward: { funds: 1200, moodlet: { id: 'workout_high', minutes: 180 } },
    },
    {
      id: 'fortune_objects',
      label: 'Own 15 objects',
      emoji: '🛋️',
      check: (c) => c.lot.length >= 15,
      progress: (c) => ({ current: Math.min(15, c.lot.length), target: 15 }),
      reward: { funds: 1500 },
    },
    {
      id: 'fortune_level',
      label: 'Reach career level 3',
      emoji: '📈',
      check: (c) => (c.career?.level ?? 0) >= 3,
      progress: (c) => ({ current: Math.min(3, c.career?.level ?? 0), target: 3 }),
      reward: { funds: 2500, moodlet: { id: 'pampered', minutes: 240 } },
    },
  ],
  family: [
    {
      id: 'family_friends',
      label: 'Make 2 close friends',
      emoji: '🤝',
      check: (c) => friendsAtLeast(c, 40) >= 2,
      progress: (c) => ({ current: Math.min(2, friendsAtLeast(c, 40)), target: 2 }),
      reward: { funds: 800, moodlet: { id: 'great_chat', minutes: 240 } },
    },
    {
      id: 'family_cook',
      label: 'Cook 5 meals at home',
      emoji: '🍳',
      check: (c) => counter(c, 'stove') + counter(c, 'fridge') >= 5,
      progress: (c) => ({
        current: Math.min(5, counter(c, 'stove') + counter(c, 'fridge')),
        target: 5,
      }),
      reward: { funds: 600, moodlet: { id: 'gourmet_meal', minutes: 240 } },
    },
    {
      id: 'family_cooking_skill',
      label: 'Reach Cooking level 5',
      emoji: '👩‍🍳',
      check: (c) => skillLevel(c, 'cooking') >= 5,
      progress: (c) => ({ current: Math.min(5, skillLevel(c, 'cooking')), target: 5 }),
      reward: { funds: 1200, moodlet: { id: 'pampered', minutes: 240 } },
    },
  ],
  knowledge: [
    {
      id: 'knowledge_any3',
      label: 'Reach level 3 in any skill',
      emoji: '🎓',
      check: (c) => ALL_SKILLS.some((id) => skillLevel(c, id) >= 3),
      reward: { funds: 700, moodlet: { id: 'deep_focus', minutes: 240 } },
    },
    {
      id: 'knowledge_two5',
      label: 'Reach level 5 in two skills',
      emoji: '🧠',
      check: (c) => skillsAtLeast(c, 5, ALL_SKILLS) >= 2,
      progress: (c) => ({ current: Math.min(2, skillsAtLeast(c, 5, ALL_SKILLS)), target: 2 }),
      reward: { funds: 1600, moodlet: { id: 'deep_focus', minutes: 360 } },
    },
    {
      id: 'knowledge_read',
      label: 'Read 3 books',
      emoji: '📚',
      check: (c) => counter(c, 'bookshelf') >= 3,
      progress: (c) => ({ current: Math.min(3, counter(c, 'bookshelf')), target: 3 }),
      reward: { funds: 900, moodlet: { id: 'deep_focus', minutes: 240 } },
    },
  ],
  popularity: [
    {
      id: 'popularity_friends',
      label: 'Make 3 friends',
      emoji: '👥',
      check: (c) => friendsAtLeast(c, 40) >= 3,
      progress: (c) => ({ current: Math.min(3, friendsAtLeast(c, 40)), target: 3 }),
      reward: { funds: 900, moodlet: { id: 'great_chat', minutes: 300 } },
    },
    {
      id: 'popularity_socialise',
      label: 'Socialise 10 times',
      emoji: '💬',
      check: (c) => counter(c, 'sim') >= 10,
      progress: (c) => ({ current: Math.min(10, counter(c, 'sim')), target: 10 }),
      reward: { funds: 1100, moodlet: { id: 'great_chat', minutes: 240 } },
    },
    {
      id: 'popularity_charisma',
      label: 'Reach Charisma level 5',
      emoji: '🎤',
      check: (c) => skillLevel(c, 'charisma') >= 5,
      progress: (c) => ({ current: Math.min(5, skillLevel(c, 'charisma')), target: 5 }),
      reward: { funds: 1800, moodlet: { id: 'pampered', minutes: 300 } },
    },
  ],
  romance: [
    {
      id: 'romance_fall',
      label: 'Fall for someone',
      emoji: '💗',
      check: (c) => bestRomance(c) >= 40,
      progress: (c) => ({ current: Math.min(40, Math.round(bestRomance(c))), target: 40 }),
      reward: { funds: 900, moodlet: { id: 'flirted_with', minutes: 360 } },
    },
    {
      id: 'romance_flirt',
      label: 'Flirt 5 times',
      emoji: '😘',
      check: (c) => counter(c, 'social_flirt') >= 5,
      progress: (c) => ({ current: Math.min(5, counter(c, 'social_flirt')), target: 5 }),
      reward: { funds: 700, moodlet: { id: 'flirted_with', minutes: 240 } },
    },
    {
      id: 'romance_partner',
      label: 'Find a partner',
      emoji: '💞',
      check: (c) => bestRomance(c) >= 60,
      progress: (c) => ({ current: Math.min(60, Math.round(bestRomance(c))), target: 60 }),
      reward: { funds: 2200, moodlet: { id: 'pampered', minutes: 400 } },
    },
  ],
  creativity: [
    {
      id: 'creativity_paint',
      label: 'Paint 3 times',
      emoji: '🎨',
      check: (c) => counter(c, 'easel') >= 3,
      progress: (c) => ({ current: Math.min(3, counter(c, 'easel')), target: 3 }),
      reward: { funds: 700, moodlet: { id: 'creative_spark', minutes: 240 } },
    },
    {
      id: 'creativity_skill',
      label: 'Reach Creativity level 5',
      emoji: '🖌️',
      check: (c) => skillLevel(c, 'creativity') >= 5,
      progress: (c) => ({ current: Math.min(5, skillLevel(c, 'creativity')), target: 5 }),
      reward: { funds: 1800, moodlet: { id: 'creative_spark', minutes: 300 } },
    },
    {
      id: 'creativity_easel',
      label: 'Own an easel',
      emoji: '🖼️',
      check: (c) => countOwned(c, 'easel') > 0,
      reward: { funds: 500 },
    },
  ],
  nature: [
    {
      id: 'nature_garden',
      label: 'Tend the garden 3 times',
      emoji: '🌱',
      check: (c) => counter(c, 'garden_plot') >= 3,
      progress: (c) => ({ current: Math.min(3, counter(c, 'garden_plot')), target: 3 }),
      reward: { funds: 600, moodlet: { id: 'green_thumb', minutes: 240 } },
    },
    {
      id: 'nature_skill',
      label: 'Reach Gardening level 5',
      emoji: '🌿',
      check: (c) => skillLevel(c, 'gardening') >= 5,
      progress: (c) => ({ current: Math.min(5, skillLevel(c, 'gardening')), target: 5 }),
      reward: { funds: 1500, moodlet: { id: 'green_thumb', minutes: 300 } },
    },
    {
      id: 'nature_plants',
      label: 'Own 3 plants',
      emoji: '🪴',
      check: (c) => countOwned(c, 'plant') >= 3,
      progress: (c) => ({ current: Math.min(3, countOwned(c, 'plant')), target: 3 }),
      reward: { funds: 500 },
    },
  ],
  athletic: [
    {
      id: 'athletic_train',
      label: 'Work out 3 times',
      emoji: '🏋️',
      check: (c) => counter(c, 'treadmill') >= 3,
      progress: (c) => ({ current: Math.min(3, counter(c, 'treadmill')), target: 3 }),
      reward: { funds: 700, moodlet: { id: 'workout_high', minutes: 240 } },
    },
    {
      id: 'athletic_skill',
      label: 'Reach Fitness level 5',
      emoji: '💪',
      check: (c) => skillLevel(c, 'fitness') >= 5,
      progress: (c) => ({ current: Math.min(5, skillLevel(c, 'fitness')), target: 5 }),
      reward: { funds: 1800, moodlet: { id: 'workout_high', minutes: 300 } },
    },
    {
      id: 'athletic_gear',
      label: 'Own a treadmill',
      emoji: '🏃',
      check: (c) => countOwned(c, 'treadmill') > 0,
      reward: { funds: 500 },
    },
  ],
};

export interface MilestoneStatus {
  milestone: Milestone;
  done: boolean;
  current: number;
  target: number;
}

export interface AspirationStatus {
  id: AspirationId;
  milestones: MilestoneStatus[];
  completed: number;
  total: number;
  fulfilled: boolean;
}

export function aspirationStatus(
  aspiration: AspirationId,
  ctx: AspirationContext,
): AspirationStatus {
  const milestones = ASPIRATION_MILESTONES[aspiration] ?? [];
  const statuses = milestones.map((milestone) => {
    const done = ctx.sim.aspirationProgress?.[milestone.id] ?? false;
    const progress = milestone.progress?.(ctx);
    return {
      milestone,
      done,
      current: progress?.current ?? (done ? 1 : 0),
      target: progress?.target ?? 1,
    };
  });
  const completed = statuses.filter((s) => s.done).length;
  return {
    id: aspiration,
    milestones: statuses,
    completed,
    total: statuses.length,
    fulfilled: completed === statuses.length && statuses.length > 0,
  };
}

/** Milestones that should be marked complete right now. */
export function newlyCompletedMilestones(
  aspiration: AspirationId,
  ctx: AspirationContext,
): Milestone[] {
  return (ASPIRATION_MILESTONES[aspiration] ?? []).filter(
    (milestone) =>
      !(ctx.sim.aspirationProgress?.[milestone.id] ?? false) && milestone.check(ctx),
  );
}
