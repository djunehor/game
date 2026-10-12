// AI housemate generation: name + profile pools used to backfill houses
// so every house always has a full 20-person roster.

import type { GameMember } from './types';

export const FIRST_NAMES = [
  'Adaeze', 'Chiamaka', 'Ngozi', 'Amina', 'Fatima', 'Blessing', 'Temiloluwa', 'Kemi',
  'Funke', 'Yewande', 'Ogechi', 'Halima', 'Chidinma', 'Sade', 'Rukayat', 'Ifeoma',
  'Chinedu', 'Emeka', 'Olumide', 'Tunde', 'Ibrahim', 'Musa', 'Segun', 'Kehinde',
  'Femi', 'Chidi', 'Obinna', 'Seyi', 'Babatunde', 'Emeka', 'Sodiq', 'Dayo',
];

export const LAST_NAMES = [
  'Okafor', 'Adeyemi', 'Eze', 'Balogun', 'Nwosu', 'Okonkwo', 'Bello', 'Adebayo',
  'Olawale', 'Mohammed', 'Uche', 'Obi', 'Afolabi', 'Ibrahim', 'Chukwu', 'Salami',
  'Oyelaran', 'Bankole', 'Onwuka', 'Durojaiye', 'Adeleke', 'Nwachukwu', 'Bamidele',
];

export const NICKNAMES = [
  'Ade', 'Chi', 'Temi', 'Kem', 'Funk', 'Yew', 'Oge', 'Hali', 'Chidi', 'Rukky',
  'Ify', 'Chine', 'Emeka', 'Olu', 'Tunde', 'Ibro', 'Musa', 'Seg', 'Kenny',
  'Femi', 'Chidi', 'Obi', 'Seyi', 'Baba', 'Sodiq', 'Dayo', 'Zee', 'Tee',
];

export const AVATARS = ['😎', '🤩', '😏', '😇', '🕶️', '🤓', '🥶', '😌', '🫡', '🤠'];

export const SKIN_TONES = ['#f6d7b0', '#e8b98a', '#c98a5b', '#8d5524', '#5c3a21'];

export const HAIRSTYLES = ['afro', 'lowcut', 'curls', 'braids', 'locs', 'bald'];

export const ACCENT_COLORS = [
  '#e63946', '#f5b841', '#22b573', '#3a86ff', '#8338ec',
  '#ff6b35', '#00b4d8', '#e07be0', '#06d6a0', '#9c6644',
];

export const PROFESSIONS = [
  'Tech Sis / Tech Bro', 'Instagram Influencer', 'Musician & Vibe Machine',
  'Fashion Designer', 'Fitness Coach', 'Corporate Lawyer', 'Culinary Chef',
  'Real Estate Hustler', 'Nurse', 'Event Planner',
];

export const TRAITS = [
  'Pepper Dem', 'Strategic Schemer', 'Kitchen General', 'Lover Boy / Girl',
  'Peace Maker', 'Clout Chaser', 'Gentle Giant', 'Crying Specialist',
];

export const BIO_FRAGMENTS = [
  'here to win and won\u2019t apologise for it.',
  'came for the 100M, staying for the drama.',
  'the house therapist with a sharp tongue.',
  'quiet until provoked, then it\u2019s war.',
  'collecting fans like they\u2019re NEPA bills.',
  'a walking plot twist.',
  'allergic to fake people.',
  'the kitchen runs through them.',
];

// Deterministic seeded RNG so AI backfill is stable per house.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateAiHousemate(seed: number, index: number): GameMember {
  const rng = mulberry32(seed + index * 1013904223);
  const firstName = pick(rng, FIRST_NAMES);
  const lastName = pick(rng, LAST_NAMES);
  const nickname = pick(rng, NICKNAMES);
  const gender = rng() > 0.5 ? 'F' : 'M';

  return {
    // Stable, seed-independent id (1-indexed) so it matches the client's local
    // AI housemate ids (ai-1…ai-8). If the id changed when the roster syncs, the
    // client would tear down and rebuild every NPC — remounting their drei <Html>
    // name tags and triggering React's "unmount a root while rendering" warning.
    id: `ai-${index + 1}`,
    name: `${firstName} ${lastName}`,
    nickname,
    gender,
    age: 22 + Math.floor(rng() * 16),
    stateOfOrigin: 'Lagos',
    profession: pick(rng, PROFESSIONS),
    trait: pick(rng, TRAITS),
    avatar: pick(rng, AVATARS),
    accentColor: pick(rng, ACCENT_COLORS),
    skinTone: pick(rng, SKIN_TONES),
    hairstyle: pick(rng, HAIRSTYLES),
    bio: `${nickname} ${pick(rng, BIO_FRAGMENTS)}`,
    energy: 80 + Math.floor(rng() * 20),
    sanity: 80 + Math.floor(rng() * 20),
    hunger: 60 + Math.floor(rng() * 30),
    houseStanding: 50 + Math.floor(rng() * 20),
    fanbaseClout: 12000 + Math.floor(rng() * 12000),
    bbCoins: 2000 + Math.floor(rng() * 4000),
    strikes: 0,
    status: 'active',
    isHoH: false,
    isImmune: false,
    isNominated: false,
    isHuman: false,
    currentRoom: 'Lounge',
    relationships: {},
  };
}
