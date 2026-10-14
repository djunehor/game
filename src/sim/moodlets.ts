import { MOTIVE_IDS, type EmotionId, type Mood, type Moodlet, type Motives } from './types';

export interface EmotionMeta {
  id: EmotionId;
  label: string;
  emoji: string;
  color: string;
}

export const EMOTION_META: Record<EmotionId, EmotionMeta> = {
  neutral: { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#94a3b8' },
  content: { id: 'content', label: 'Content', emoji: '🙂', color: '#86efac' },
  happy: { id: 'happy', label: 'Happy', emoji: '😄', color: '#22c55e' },
  elated: { id: 'elated', label: 'Elated', emoji: '🤩', color: '#10b981' },
  energized: { id: 'energized', label: 'Energized', emoji: '⚡', color: '#facc15' },
  focused: { id: 'focused', label: 'Focused', emoji: '🧠', color: '#38bdf8' },
  flirty: { id: 'flirty', label: 'Flirty', emoji: '😘', color: '#f472b6' },
  sad: { id: 'sad', label: 'Sad', emoji: '😢', color: '#60a5fa' },
  angry: { id: 'angry', label: 'Angry', emoji: '😠', color: '#ef4444' },
  embarrassed: { id: 'embarrassed', label: 'Embarrassed', emoji: '😳', color: '#fb923c' },
  uncomfortable: { id: 'uncomfortable', label: 'Uncomfortable', emoji: '😖', color: '#f97316' },
  stressed: { id: 'stressed', label: 'Stressed', emoji: '😰', color: '#a855f7' },
};

export interface MoodletDef {
  label: string;
  emoji: string;
  intensity: number;
  emotion: Partial<Record<EmotionId, number>>;
}

/** Transient moodlets that interactions can grant. */
export const MOODLET_CATALOG: Record<string, MoodletDef> = {
  just_ate: { label: 'Well Fed', emoji: '😋', intensity: 2, emotion: { happy: 2 } },
  gourmet_meal: { label: 'Gourmet Meal', emoji: '🤌', intensity: 3, emotion: { happy: 2, elated: 1 } },
  caffeine_buzz: { label: 'Caffeine Buzz', emoji: '☕', intensity: 2, emotion: { energized: 3 } },
  workout_high: { label: 'Workout High', emoji: '💪', intensity: 3, emotion: { energized: 2, happy: 1 } },
  squeaky_clean: { label: 'Squeaky Clean', emoji: '✨', intensity: 2, emotion: { happy: 2 } },
  clean_house: { label: 'Clean House', emoji: '🧼', intensity: 2, emotion: { content: 2 } },
  great_chat: { label: 'Great Chat', emoji: '💬', intensity: 3, emotion: { happy: 2, flirty: 1 } },
  flirted_with: { label: 'Butterflies', emoji: '🦋', intensity: 3, emotion: { flirty: 4 } },
  won_game: { label: 'Winner', emoji: '🏆', intensity: 3, emotion: { elated: 3 } },
  creative_spark: { label: 'Creative Spark', emoji: '🎨', intensity: 2, emotion: { focused: 3 } },
  deep_focus: { label: 'Deep Focus', emoji: '📚', intensity: 2, emotion: { focused: 3 } },
  green_thumb: { label: 'Green Thumb', emoji: '🌱', intensity: 2, emotion: { content: 3 } },
  pampered: { label: 'Pampered', emoji: '💅', intensity: 3, emotion: { happy: 2, elated: 1 } },
  slept_well: { label: 'Well Rested', emoji: '😴', intensity: 3, emotion: { energized: 2, happy: 1 } },
  embarrassed_moment: { label: 'Embarrassed', emoji: '😳', intensity: -3, emotion: { embarrassed: 4 } },
  rude_encounter: { label: 'Rudeness', emoji: '😤', intensity: -3, emotion: { angry: 4 } },
  exhausted_collapse: { label: 'Exhausted', emoji: '🥵', intensity: -3, emotion: { uncomfortable: 4 } },
  grieving: { label: 'Grieving', emoji: '🕯️', intensity: -5, emotion: { sad: 5 } },
  lived_well: { label: 'Lived Well', emoji: '🕊️', intensity: 2, emotion: { content: 2 } },
};

function makeMoodlet(id: string, def: MoodletDef, expiresAt: number, source: string): Moodlet {
  return {
    id,
    label: def.label,
    emoji: def.emoji,
    intensity: def.intensity,
    emotion: def.emotion,
    expiresAt,
    source,
  };
}

/** Create a transient moodlet from the catalog. */
export function createMoodlet(id: string, now: number, minutes: number, source = 'interaction'): Moodlet | null {
  const def = MOODLET_CATALOG[id];
  if (!def) return null;
  return makeMoodlet(id, def, now + minutes, source);
}

/**
 * Insert or refresh a transient moodlet (same id replaces, keeping the longer
 * remaining time so stacking the same action doesn't shorten the effect).
 */
export function addMoodlet(list: Moodlet[], moodlet: Moodlet): Moodlet[] {
  const existing = list.find((m) => m.id === moodlet.id);
  if (!existing) return [...list, moodlet];
  return list.map((m) =>
    m.id === moodlet.id ? { ...m, expiresAt: Math.max(m.expiresAt, moodlet.expiresAt) } : m,
  );
}

export function pruneMoodlets(list: Moodlet[], now: number): Moodlet[] {
  const kept = list.filter((m) => m.expiresAt > now);
  return kept.length === list.length ? list : kept;
}

interface ConditionMoodlet extends MoodletDef {
  id: string;
  when: (motives: Motives) => boolean;
}

/** Moodlets that hold for as long as a motive stays in a bad/great band. */
export const CONDITION_MOODLETS: ConditionMoodlet[] = [
  { id: 'cond:starving', label: 'Starving', emoji: '🍽️', intensity: -4, emotion: { uncomfortable: 2, sad: 2 }, when: (m) => m.hunger < 15 },
  { id: 'cond:stuffed', label: 'Stuffed', emoji: '🤰', intensity: 1, emotion: { content: 2 }, when: (m) => m.hunger > 85 },
  { id: 'cond:desperate', label: 'Has To Go!', emoji: '🚽', intensity: -5, emotion: { uncomfortable: 4, stressed: 2 }, when: (m) => m.bladder < 15 },
  { id: 'cond:exhausted', label: 'Exhausted', emoji: '🥱', intensity: -4, emotion: { uncomfortable: 3, sad: 1 }, when: (m) => m.energy < 15 },
  { id: 'cond:well_rested', label: 'Well Rested', emoji: '😌', intensity: 2, emotion: { energized: 3 }, when: (m) => m.energy > 85 },
  { id: 'cond:grungy', label: 'Grungy', emoji: '🤢', intensity: -3, emotion: { uncomfortable: 3, embarrassed: 1 }, when: (m) => m.hygiene < 20 },
  { id: 'cond:clean', label: 'Fresh & Clean', emoji: '🫧', intensity: 2, emotion: { happy: 2 }, when: (m) => m.hygiene > 85 },
  { id: 'cond:lonely', label: 'Lonely', emoji: '🫥', intensity: -3, emotion: { sad: 4 }, when: (m) => m.social < 20 },
  { id: 'cond:social', label: 'Social Butterfly', emoji: '🦋', intensity: 3, emotion: { happy: 2, flirty: 1 }, when: (m) => m.social > 85 },
  { id: 'cond:bored', label: 'Bored', emoji: '😑', intensity: -2, emotion: { sad: 2, stressed: 1 }, when: (m) => m.fun < 20 },
  { id: 'cond:entertained', label: 'Entertained', emoji: '🎊', intensity: 3, emotion: { happy: 3 }, when: (m) => m.fun > 85 },
  { id: 'cond:uncomfortable', label: 'Uncomfortable', emoji: '😖', intensity: -2, emotion: { uncomfortable: 3 }, when: (m) => m.comfort < 20 },
  { id: 'cond:cozy', label: 'Cozy', emoji: '🛋️', intensity: 2, emotion: { content: 3 }, when: (m) => m.comfort > 85 },
  { id: 'cond:filthy', label: 'Filthy Surroundings', emoji: '🪳', intensity: -2, emotion: { uncomfortable: 2, angry: 1 }, when: (m) => m.environment < 25 },
  { id: 'cond:beautiful', label: 'Beautiful Decor', emoji: '🌿', intensity: 2, emotion: { content: 3 }, when: (m) => m.environment > 80 },
];

export function computeConditionMoodlets(motives: Motives): Moodlet[] {
  const out: Moodlet[] = [];
  for (const def of CONDITION_MOODLETS) {
    if (def.when(motives)) {
      out.push(makeMoodlet(def.id, def, Infinity, 'motive'));
    }
  }
  // Everything is going well — a small holistic bonus.
  const allGood = MOTIVE_IDS.every((id) => motives[id] > 60);
  if (allGood) {
    out.push(
      makeMoodlet('cond:in_the_zone', { label: 'In The Zone', emoji: '🌟', intensity: 3, emotion: { elated: 3 } }, Infinity, 'motive'),
    );
  }
  return out;
}

/** All moodlets currently active (transient + condition-driven). */
export function allMoodlets(avatar: { motives: Motives; moodlets: Moodlet[] }, now: number): Moodlet[] {
  return [...pruneMoodlets(avatar.moodlets, now), ...computeConditionMoodlets(avatar.motives)];
}

/** Collapse moodlets into a single mood + emotion. */
export function deriveMood(moodlets: Moodlet[]): Mood {
  const score = moodlets.reduce((sum, m) => sum + m.intensity, 0);

  const weights = {} as Record<EmotionId, number>;
  for (const m of moodlets) {
    for (const [emotion, weight] of Object.entries(m.emotion) as [EmotionId, number][]) {
      weights[emotion] = (weights[emotion] ?? 0) + weight;
    }
  }

  let dominant: EmotionId = 'neutral';
  let best = 0;
  for (const [emotion, weight] of Object.entries(weights) as [EmotionId, number][]) {
    if (weight > best) {
      best = weight;
      dominant = emotion;
    }
  }

  // Overrides: a strong net negative should read as sad/stressed, a big net
  // positive as elated, regardless of which moodlet happened to dominate.
  let emotion = dominant;
  if (score <= -10) emotion = 'sad';
  else if (score <= -5 && ['happy', 'elated', 'content', 'energized', 'flirty'].includes(dominant)) emotion = 'stressed';
  else if (score >= 12) emotion = 'elated';

  const meta = EMOTION_META[emotion];
  return {
    emotion,
    label: meta.label,
    emoji: meta.emoji,
    score,
    grade: Math.max(0, Math.min(100, Math.round(50 + score * 4))),
  };
}

export function computeMood(avatar: { motives: Motives; moodlets: Moodlet[] }, now: number): Mood {
  return deriveMood(allMoodlets(avatar, now));
}
