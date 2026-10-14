import type { MotiveId } from '../sim/types';
import type { AspirationId, AspirationMeta, CareerId, CareerLevel, CareerMeta, LifeStage, LifeStageMeta } from './types';

// ---------------------------------------------------------------------------
// Life stages
// ---------------------------------------------------------------------------
export const LIFE_STAGES: Record<LifeStage, LifeStageMeta> = {
  baby: { id: 'baby', label: 'Baby', emoji: '👶', days: 3, skillCap: 0, canWork: false, canRomance: false, canBeAlone: false },
  child: { id: 'child', label: 'Child', emoji: '🧒', days: 8, skillCap: 3, canWork: false, canRomance: false, canBeAlone: true },
  teen: { id: 'teen', label: 'Teen', emoji: '🧑', days: 10, skillCap: 6, canWork: false, canRomance: true, canBeAlone: true },
  youngAdult: { id: 'youngAdult', label: 'Young Adult', emoji: '🧑‍🎓', days: 22, skillCap: 10, canWork: true, canRomance: true, canBeAlone: true },
  adult: { id: 'adult', label: 'Adult', emoji: '🧑‍💼', days: 28, skillCap: 10, canWork: true, canRomance: true, canBeAlone: true },
  elder: { id: 'elder', label: 'Elder', emoji: '🧓', days: 18, skillCap: 10, canWork: false, canRomance: true, canBeAlone: true },
};

/**
 * Once an elder has lived out their stage, they carry on for a few more days
 * before passing away. Long enough to say goodbye, short enough that the next
 * generation takes over.
 */
export const ELDER_GRACE_DAYS = 6;

export const STAGE_ORDER: LifeStage[] = ['baby', 'child', 'teen', 'youngAdult', 'adult', 'elder'];

export function nextStage(stage: LifeStage): LifeStage | null {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

// ---------------------------------------------------------------------------
// Traits (Sims personality — drive how fast motives drain)
// ---------------------------------------------------------------------------
export interface LifeTraitMeta {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** >1 drains faster. */
  modifiers: Partial<Record<MotiveId, number>>;
  conflicts?: string[];
}

export const LIFE_TRAITS: LifeTraitMeta[] = [
  { id: 'neat', label: 'Neat', emoji: '🧼', description: 'Hates mess; keeps the place spotless.', modifiers: { hygiene: 0.8, environment: 0.7 } },
  { id: 'slob', label: 'Slob', emoji: '🦠', description: 'Thrives in chaos.', modifiers: { environment: 1.5, hygiene: 0.7 }, conflicts: ['neat'] },
  { id: 'cheerful', label: 'Cheerful', emoji: '😄', description: 'Rarely rattled.', modifiers: { fun: 0.8, social: 0.85 } },
  { id: 'gloomy', label: 'Gloomy', emoji: '🌧️', description: 'Sees the cloud in every silver lining.', modifiers: { fun: 1.4, social: 1.2 }, conflicts: ['cheerful'] },
  { id: 'active', label: 'Active', emoji: '🏃', description: 'Loves to move.', modifiers: { energy: 0.8, fun: 1.15 } },
  { id: 'lazy', label: 'Lazy', emoji: '🛋️', description: 'Why stand when you can sit?', modifiers: { fun: 1.2, energy: 1.2 }, conflicts: ['active'] },
  { id: 'genius', label: 'Genius', emoji: '🧠', description: 'Always thinking.', modifiers: { fun: 1.15 } },
  { id: 'creative', label: 'Creative', emoji: '🎨', description: 'Sees the world differently.', modifiers: { fun: 1.15 } },
  { id: 'foodie', label: 'Foodie', emoji: '🍜', description: 'Eats with intent.', modifiers: { hunger: 1.35 } },
  { id: 'romantic', label: 'Romantic', emoji: '💞', description: 'Wears their heart on display.', modifiers: { social: 1.2 } },
  { id: 'familyOriented', label: 'Family-Oriented', emoji: '👨‍👩‍👧', description: 'Home is everything.', modifiers: { social: 1.25, comfort: 0.85 } },
  { id: 'goofball', label: 'Goofball', emoji: '🤪', description: 'Life is a bit.', modifiers: { fun: 1.3, social: 1.1 } },
  { id: 'hotHeaded', label: 'Hot-Headed', emoji: '🌶️', description: 'Quick to boil.', modifiers: { comfort: 1.35 } },
  { id: 'ambitious', label: 'Ambitious', emoji: '📈', description: 'Never satisfied.', modifiers: { fun: 1.25, energy: 1.1 } },
  { id: 'squeamish', label: 'Squeamish', emoji: '😖', description: 'Easily grossed out.', modifiers: { hygiene: 1.3, environment: 1.2 } },
  { id: 'loner', label: 'Loner', emoji: '🚶', description: 'Happy in their own company.', modifiers: { social: 0.6 } },
];

export const LIFE_TRAITS_BY_ID: Record<string, LifeTraitMeta> = Object.fromEntries(
  LIFE_TRAITS.map((t) => [t.id, t]),
);

export const MAX_TRAITS = 3;

// ---------------------------------------------------------------------------
// Aspirations
// ---------------------------------------------------------------------------
export const ASPIRATIONS: Record<AspirationId, AspirationMeta> = {
  fortune: { id: 'fortune', label: 'Fabulously Wealthy', emoji: '💰', description: 'Build a fortune and live large.', focus: ['comfort', 'fun'], bonusSkill: 'logic' },
  family: { id: 'family', label: 'Big Happy Family', emoji: '👨‍👩‍👧‍👦', description: 'Raise a thriving household.', focus: ['social', 'comfort'], bonusSkill: 'cooking' },
  knowledge: { id: 'knowledge', label: 'Renaissance Sim', emoji: '📚', description: 'Master every skill.', focus: ['fun'], bonusSkill: 'logic' },
  popularity: { id: 'popularity', label: 'Friend of the World', emoji: '🎉', description: 'Know everyone worth knowing.', focus: ['social', 'fun'], bonusSkill: 'charisma' },
  romance: { id: 'romance', label: 'Serial Romantic', emoji: '💋', description: 'Love is the whole point.', focus: ['social'], bonusSkill: 'charisma' },
  creativity: { id: 'creativity', label: 'Painter Extraordinaire', emoji: '🖌️', description: 'Create something that outlives you.', focus: ['fun'], bonusSkill: 'creativity' },
  nature: { id: 'nature', label: 'Freelance Botanist', emoji: '🌿', description: 'Live close to the earth.', focus: ['environment'], bonusSkill: 'gardening' },
  athletic: { id: 'athletic', label: 'Bodybuilder', emoji: '🏋️', description: 'Push the body to its limit.', focus: ['fun', 'energy'], bonusSkill: 'fitness' },
};

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------
const weekdayShifts = [1, 2, 3, 4, 5];

function ladder(titles: string[], pay: number[], startHour = 9, endHour = 17): CareerLevel[] {
  return titles.map((title, i) => ({
    title,
    pay: pay[i],
    startHour,
    endHour,
    days: weekdayShifts,
  }));
}

export const CAREERS: Record<CareerId, CareerMeta> = {
  tech: {
    id: 'tech', label: 'Tech', emoji: '💻', skill: 'logic',
    levels: ladder(
      ['IT Intern', 'Junior Dev', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Architect', 'CTO', 'Founder', 'Unicorn CEO', 'Tech Legend'],
      [180, 320, 520, 780, 1150, 1600, 2300, 3100, 4200, 6000],
    ),
  },
  culinary: {
    id: 'culinary', label: 'Culinary', emoji: '🍳', skill: 'cooking',
    levels: ladder(
      ['Dishwasher', 'Line Cook', 'Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Restaurant Owner', 'Celebrity Chef', 'Michelin Star', 'Culinary Icon'],
      [150, 280, 460, 700, 1050, 1500, 2200, 3000, 4200, 6200],
      10, 18,
    ),
  },
  medicine: {
    id: 'medicine', label: 'Medicine', emoji: '🩺', skill: 'logic',
    levels: ladder(
      ['Orderly', 'Nurse Aide', 'Nurse', 'Senior Nurse', 'Registrar', 'Doctor', 'Consultant', 'Surgeon', 'Chief Surgeon', 'Hospital Director'],
      [200, 360, 600, 900, 1300, 1800, 2600, 3500, 4800, 7000],
      7, 19,
    ),
  },
  business: {
    id: 'business', label: 'Business', emoji: '📊', skill: 'charisma',
    levels: ladder(
      ['Intern', 'Analyst', 'Associate', 'Manager', 'Senior Manager', 'Director', 'VP', 'COO', 'CEO', 'Tycoon'],
      [190, 340, 560, 850, 1250, 1750, 2500, 3400, 4600, 6500],
    ),
  },
  entertainment: {
    id: 'entertainment', label: 'Entertainment', emoji: '🎬', skill: 'charisma',
    levels: ladder(
      ['Extra', 'Background Vocalist', 'Supporting Role', 'Lead Role', 'Headliner', 'Recording Artist', 'Award Winner', 'Superstar', 'Global Icon', 'Hall of Fame'],
      [170, 300, 520, 820, 1200, 1750, 2500, 3600, 5000, 7200],
      14, 22,
    ),
  },
  athletics: {
    id: 'athletics', label: 'Athletics', emoji: '🏅', skill: 'fitness',
    levels: ladder(
      ['Rookie', 'Reserve', 'Starter', 'All-Star', 'Captain', 'National Champion', 'Olympian', 'World Champion', 'Legend', 'GOAT'],
      [160, 290, 480, 760, 1100, 1600, 2300, 3300, 4600, 6800],
      8, 16,
    ),
  },
  artist: {
    id: 'artist', label: 'Artist', emoji: '🎨', skill: 'creativity',
    levels: ladder(
      ['Doodler', 'Street Artist', 'Gallery Assistant', 'Exhibiting Artist', 'Commissioned Artist', 'Gallery Feature', 'Renowned Artist', 'Master Painter', 'National Treasure', 'Immortal'],
      [140, 260, 430, 680, 1000, 1450, 2100, 3000, 4200, 6000],
      11, 19,
    ),
  },
};

export const CAREER_LIST = Object.values(CAREERS);
