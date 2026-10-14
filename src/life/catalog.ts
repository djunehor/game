import type { CatalogObject } from './types';

// ---------------------------------------------------------------------------
// Buy-mode catalog.
//
// Ratings are 0–10 per motive. An interaction's strength is `rating × SCALE`,
// which is what makes upgrading furniture matter: a ₦11,000 canopy bed restores
// far more Energy overnight than a ₦700 camp bed.
// ---------------------------------------------------------------------------

/** Motive points restored per rating point. */
export const RATING_SCALE = 8;

export function ratingDelta(rating: number | undefined): number {
  return Math.round((rating ?? 0) * RATING_SCALE);
}

// Room vocabulary for the home lot.
export type LifeRoom = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'study' | 'garden' | 'gym';

export const LIFE_ROOM_LABELS: Record<LifeRoom, { label: string; emoji: string }> = {
  living: { label: 'Living Room', emoji: '🛋️' },
  kitchen: { label: 'Kitchen', emoji: '🍳' },
  bedroom: { label: 'Bedroom', emoji: '🛏️' },
  bathroom: { label: 'Bathroom', emoji: '🛁' },
  study: { label: 'Study', emoji: '📚' },
  garden: { label: 'Garden', emoji: '🌿' },
  gym: { label: 'Gym', emoji: '🏋️' },
};

export const CATALOG: CatalogObject[] = [
  // ------------------------------- Beds -----------------------------------
  {
    id: 'camp_bed', name: 'Camp Bed', emoji: '🛏️', category: 'beds', price: 700,
    footprint: [2, 3], description: 'A frame and a thin mattress. It is technically a bed.',
    ratings: { energy: 4, comfort: 2 },
    interactions: [
      { key: 'sleep', label: 'Sleep', emoji: '😴', minutes: 420, uses: ['energy', 'comfort'], bonus: { bladder: -28, hunger: -20, hygiene: -14 }, moodlet: { id: 'slept_well', minutes: 180 }, autonomy: { energy: 3.4, comfort: 0.8 } },
      { key: 'nap', label: 'Power Nap', emoji: '🛌', minutes: 90, uses: ['energy'], autonomy: { energy: 1.6 } },
    ],
  },
  {
    id: 'double_bed', name: 'Double Bed', emoji: '🛏️', category: 'beds', price: 3400,
    footprint: [2, 3], description: 'Room for two, and a duvet worth fighting over.',
    ratings: { energy: 7, comfort: 5 },
    interactions: [
      { key: 'sleep', label: 'Sleep', emoji: '😴', minutes: 400, uses: ['energy', 'comfort'], bonus: { bladder: -26, hunger: -18, hygiene: -12 }, moodlet: { id: 'slept_well', minutes: 240 }, autonomy: { energy: 3.4, comfort: 1 } },
      { key: 'nap', label: 'Power Nap', emoji: '🛌', minutes: 80, uses: ['energy'], autonomy: { energy: 1.6 } },
      { key: 'cuddle', label: 'Cuddle', emoji: '🥰', minutes: 45, uses: ['comfort'], bonus: { social: 34, fun: 20 }, moodlet: { id: 'flirted_with', minutes: 240 }, autonomy: { social: 1.8, comfort: 1.2 } },
    ],
  },
  {
    id: 'canopy_bed', name: 'Royal Canopy Bed', emoji: '👑', category: 'beds', price: 11000,
    footprint: [3, 3], description: 'Four posts, heavy drapes, and the best sleep money buys.',
    ratings: { energy: 10, comfort: 9 },
    interactions: [
      { key: 'sleep', label: 'Sleep', emoji: '😴', minutes: 380, uses: ['energy', 'comfort'], bonus: { bladder: -24, hunger: -14, hygiene: -10 }, moodlet: { id: 'slept_well', minutes: 360 }, autonomy: { energy: 3.4, comfort: 1.4 } },
      { key: 'nap', label: 'Power Nap', emoji: '🛌', minutes: 70, uses: ['energy'], autonomy: { energy: 1.8 } },
      { key: 'cuddle', label: 'Cuddle', emoji: '🥰', minutes: 45, uses: ['comfort'], bonus: { social: 42, fun: 26 }, moodlet: { id: 'flirted_with', minutes: 300 }, autonomy: { social: 2, comfort: 1.4 } },
    ],
  },

  // ------------------------------ Seating ----------------------------------
  {
    id: 'dining_chair', name: 'Dining Chair', emoji: '🪑', category: 'seating', price: 120,
    footprint: [1, 1], description: 'Four legs and a hope.',
    ratings: { comfort: 2 },
    interactions: [{ key: 'sit', label: 'Sit', emoji: '🪑', minutes: 25, uses: ['comfort'], autonomy: { comfort: 1.4 } }],
  },
  {
    id: 'sofa', name: 'Sofa', emoji: '🛋️', category: 'seating', price: 900,
    footprint: [3, 1], description: 'Deep cushions. Dangerous for productivity.',
    ratings: { comfort: 6, fun: 2 },
    interactions: [
      { key: 'relax', label: 'Relax', emoji: '🛋️', minutes: 50, uses: ['comfort', 'fun'], autonomy: { comfort: 2.6, fun: 1.4 } },
      { key: 'chat', label: 'Chat', emoji: '💬', minutes: 40, uses: ['comfort'], bonus: { social: 34, fun: 16 }, skill: { id: 'charisma', xp: 40 }, moodlet: { id: 'great_chat', minutes: 180 }, autonomy: { social: 3.2 } },
    ],
  },
  {
    id: 'armchair', name: 'Armchair', emoji: '💺', category: 'seating', price: 600,
    footprint: [1, 1], description: 'Grandpa energy in chair form.',
    ratings: { comfort: 5 },
    interactions: [{ key: 'relax', label: 'Relax', emoji: '💺', minutes: 45, uses: ['comfort'], autonomy: { comfort: 2.4 } }],
  },
  {
    id: 'loveseat', name: 'Loveseat', emoji: '💞', category: 'seating', price: 1600,
    footprint: [2, 1], description: 'Technically fits two people who like each other.',
    ratings: { comfort: 7, social: 4 },
    interactions: [
      { key: 'snuggle', label: 'Snuggle', emoji: '🥰', minutes: 45, uses: ['comfort', 'social'], bonus: { fun: 22 }, moodlet: { id: 'flirted_with', minutes: 240 }, autonomy: { social: 2.4, comfort: 1.6 } },
      { key: 'relax', label: 'Relax', emoji: '💞', minutes: 45, uses: ['comfort'], autonomy: { comfort: 2.4 } },
    ],
  },

  // ------------------------------ Surfaces ---------------------------------
  {
    id: 'dining_table', name: 'Dining Table', emoji: '🍽️', category: 'surfaces', price: 420,
    footprint: [3, 2], description: 'Where meals become arguments.',
    ratings: { hunger: 3, social: 3 },
    interactions: [
      { key: 'share_meal', label: 'Share a Meal', emoji: '🍽️', minutes: 50, uses: ['hunger', 'social'], bonus: { fun: 14 }, moodlet: { id: 'just_ate', minutes: 180 }, autonomy: { hunger: 1.8, social: 1.6 } },
    ],
  },
  {
    id: 'coffee_table', name: 'Coffee Table', emoji: '🪵', category: 'surfaces', price: 380,
    footprint: [2, 1], description: 'Board games, mugs, and mystery crumbs.',
    ratings: { fun: 3, social: 2 },
    interactions: [
      { key: 'board_game', label: 'Play a Board Game', emoji: '🎲', minutes: 45, uses: ['fun', 'social'], skill: { id: 'gaming', xp: 40 }, moodlet: { id: 'won_game', minutes: 180 }, autonomy: { fun: 2.6, social: 1.6 } },
    ],
  },
  {
    id: 'desk', name: 'Desk', emoji: '🗄️', category: 'surfaces', price: 520,
    footprint: [2, 1], description: 'A serious surface for serious people.',
    ratings: { fun: 3 },
    interactions: [
      { key: 'study', label: 'Study', emoji: '📖', minutes: 50, uses: ['fun'], bonus: { fun: 10 }, skill: { id: 'logic', xp: 70 }, moodlet: { id: 'deep_focus', minutes: 180 }, autonomy: { fun: 1.2 } },
    ],
  },
  {
    id: 'bookshelf', name: 'Bookshelf', emoji: '📚', category: 'surfaces', price: 1100,
    footprint: [2, 1], description: 'Books you will absolutely read someday.',
    ratings: { fun: 5, environment: 3 },
    interactions: [
      { key: 'read', label: 'Read a Book', emoji: '📖', minutes: 55, uses: ['fun'], bonus: { comfort: 10 }, skill: { id: 'logic', xp: 60 }, moodlet: { id: 'deep_focus', minutes: 200 }, autonomy: { fun: 2.6 } },
    ],
  },

  // ----------------------------- Appliances --------------------------------
  {
    id: 'fridge', name: 'Fridge', emoji: '🧊', category: 'appliances', price: 1300,
    footprint: [2, 1], description: 'Cold, humming, full of possibility.',
    ratings: { hunger: 7 },
    interactions: [
      { key: 'eat', label: 'Grab a Snack', emoji: '🥡', minutes: 25, uses: ['hunger'], bonus: { fun: 5 }, moodlet: { id: 'just_ate', minutes: 150 }, autonomy: { hunger: 3 } },
      { key: 'cook', label: 'Cook a Meal', emoji: '🍳', minutes: 60, uses: ['hunger'], bonus: { hunger: 8, fun: 12 }, skill: { id: 'cooking', xp: 55 }, moodlet: { id: 'just_ate', minutes: 210 }, autonomy: { hunger: 2.2, fun: 0.4 } },
    ],
  },
  {
    id: 'stove', name: 'Stove', emoji: '🔥', category: 'appliances', price: 1050,
    footprint: [2, 1], description: 'Where culinary greatness (or smoke) happens.',
    ratings: { hunger: 6 },
    interactions: [
      { key: 'cook', label: 'Cook a Meal', emoji: '🍳', minutes: 60, uses: ['hunger'], bonus: { fun: 14, social: 8 }, skill: { id: 'cooking', xp: 70 }, moodlet: { id: 'just_ate', minutes: 240 }, autonomy: { hunger: 2.4, fun: 0.5 } },
      { key: 'gourmet', label: 'Cook a Gourmet Feast', emoji: '🤌', minutes: 95, uses: ['hunger'], bonus: { hunger: 18, fun: 26, social: 16 }, skill: { id: 'cooking', xp: 130 }, moodlet: { id: 'gourmet_meal', minutes: 360 }, autonomy: { hunger: 1.8, fun: 0.9 }, requiresSkill: { id: 'cooking', level: 3 } },
    ],
  },
  {
    id: 'microwave', name: 'Microwave', emoji: '🍲', category: 'appliances', price: 620,
    footprint: [1, 1], description: 'Dings when it feels like it.',
    ratings: { hunger: 4 },
    interactions: [
      { key: 'snack', label: 'Heat a Snack', emoji: '🍲', minutes: 15, uses: ['hunger'], moodlet: { id: 'just_ate', minutes: 120 }, autonomy: { hunger: 2.4 } },
    ],
  },
  {
    id: 'coffee_machine', name: 'Coffee Machine', emoji: '☕', category: 'appliances', price: 820,
    footprint: [1, 1], description: 'The real reason anyone gets up.',
    ratings: { energy: 5 },
    interactions: [
      { key: 'brew', label: 'Brew Coffee', emoji: '☕', minutes: 20, uses: ['energy'], bonus: { bladder: -8 }, moodlet: { id: 'caffeine_buzz', minutes: 150 }, autonomy: { energy: 2.4 } },
    ],
  },
  {
    id: 'barbecue', name: 'Barbecue Grill', emoji: '🍢', category: 'appliances', price: 1500,
    footprint: [2, 2], description: 'Outdoor cooking with a side of smoke.', outdoorOnly: true,
    ratings: { hunger: 8, social: 4 },
    interactions: [
      { key: 'grill', label: 'Grill Outdoors', emoji: '🍢', minutes: 55, uses: ['hunger', 'social'], bonus: { fun: 18 }, skill: { id: 'cooking', xp: 60 }, moodlet: { id: 'just_ate', minutes: 240 }, autonomy: { hunger: 2, social: 0.8 } },
    ],
  },

  // ------------------------------ Plumbing ---------------------------------
  {
    id: 'toilet', name: 'Toilet', emoji: '🚽', category: 'plumbing', price: 520,
    footprint: [1, 1], description: 'Essential. No further comment.',
    ratings: { bladder: 8 },
    interactions: [
      { key: 'use', label: 'Use the Toilet', emoji: '🚽', minutes: 12, uses: ['bladder'], bonus: { hygiene: -6 }, autonomy: { bladder: 4 } },
    ],
  },
  {
    id: 'shower', name: 'Shower', emoji: '🚿', category: 'plumbing', price: 860,
    footprint: [1, 1], description: 'Quick, efficient, wakes you right up.',
    ratings: { hygiene: 7, comfort: 3 },
    interactions: [
      { key: 'shower', label: 'Take a Shower', emoji: '🚿', minutes: 30, uses: ['hygiene', 'comfort'], bonus: { fun: 8 }, moodlet: { id: 'squeaky_clean', minutes: 240 }, autonomy: { hygiene: 3.4 } },
    ],
  },
  {
    id: 'bathtub', name: 'Bathtub', emoji: '🛁', category: 'plumbing', price: 2200,
    footprint: [2, 1], description: 'For when a shower simply will not do.',
    ratings: { hygiene: 9, comfort: 6 },
    interactions: [
      { key: 'soak', label: 'Take a Bath', emoji: '🛁', minutes: 50, uses: ['hygiene', 'comfort'], bonus: { fun: 14 }, moodlet: { id: 'pampered', minutes: 240 }, autonomy: { hygiene: 2.6, comfort: 2 } },
    ],
  },
  {
    id: 'sink', name: 'Sink', emoji: '🧼', category: 'plumbing', price: 340,
    footprint: [1, 1], description: 'Also useful for washing up.',
    ratings: { hygiene: 3, environment: 2 },
    interactions: [
      { key: 'wash', label: 'Wash Up', emoji: '🧼', minutes: 20, uses: ['hygiene'], bonus: { environment: 12 }, autonomy: { hygiene: 1.4 } },
      { key: 'dishes', label: 'Wash the Dishes', emoji: '🍽️', minutes: 40, uses: ['environment'], skill: { id: 'cleaning', xp: 45 }, autonomy: { environment: 2.6 } },
    ],
  },

  // ----------------------------- Electronics -------------------------------
  {
    id: 'tv', name: 'Television', emoji: '📺', category: 'electronics', price: 1600,
    footprint: [2, 1], description: 'The altar of the living room.',
    ratings: { fun: 7, social: 2 },
    interactions: [
      { key: 'watch', label: 'Watch TV', emoji: '📺', minutes: 55, uses: ['fun'], bonus: { comfort: 8, social: 8 }, autonomy: { fun: 3.2 } },
    ],
  },
  {
    id: 'stereo', name: 'Stereo', emoji: '🔊', category: 'electronics', price: 1250,
    footprint: [1, 1], description: 'Neighbours will have opinions.',
    ratings: { fun: 6, social: 3 },
    interactions: [
      { key: 'dance', label: 'Dance', emoji: '💃', minutes: 40, uses: ['fun', 'social'], bonus: { energy: -12, hygiene: -10 }, skill: { id: 'fitness', xp: 35 }, autonomy: { fun: 2.6, social: 1.4 } },
    ],
  },
  {
    id: 'computer', name: 'Computer', emoji: '💻', category: 'electronics', price: 2600,
    footprint: [1, 1], description: 'Work, play, and everything between.',
    ratings: { fun: 7 },
    interactions: [
      { key: 'games', label: 'Play Games', emoji: '🎮', minutes: 50, uses: ['fun'], bonus: { fun: 12 }, skill: { id: 'gaming', xp: 70 }, autonomy: { fun: 3 } },
      { key: 'write', label: 'Write', emoji: '✍️', minutes: 55, uses: ['fun'], bonus: { fun: 6 }, skill: { id: 'creativity', xp: 75 }, moodlet: { id: 'creative_spark', minutes: 200 }, autonomy: { fun: 1.4 } },
    ],
  },
  {
    id: 'games_console', name: 'Games Console', emoji: '🎮', category: 'electronics', price: 950,
    footprint: [1, 1], description: 'Four controllers, three of them flat.',
    ratings: { fun: 8 },
    interactions: [
      { key: 'game', label: 'Play Console', emoji: '🎮', minutes: 45, uses: ['fun'], bonus: { comfort: 6 }, skill: { id: 'gaming', xp: 65 }, moodlet: { id: 'won_game', minutes: 150 }, autonomy: { fun: 3.2 } },
    ],
  },

  // -------------------------------- Skill ----------------------------------
  {
    id: 'easel', name: 'Easel', emoji: '🎨', category: 'skill', price: 1150,
    footprint: [1, 1], description: 'Where happy little accidents happen.',
    ratings: { fun: 3 },
    interactions: [
      { key: 'paint', label: 'Paint', emoji: '🎨', minutes: 60, uses: ['fun'], bonus: { fun: 16, comfort: -6 }, skill: { id: 'creativity', xp: 85 }, moodlet: { id: 'creative_spark', minutes: 240 }, autonomy: { fun: 1.6 } },
    ],
  },
  {
    id: 'treadmill', name: 'Treadmill', emoji: '🏃', category: 'skill', price: 1900,
    footprint: [1, 2], description: 'Expensive clothes rack with a belt.',
    ratings: { fun: 4 },
    interactions: [
      { key: 'run', label: 'Go Running', emoji: '🏃', minutes: 60, uses: ['fun'], bonus: { energy: -26, hygiene: -22, comfort: -10 }, skill: { id: 'fitness', xp: 85 }, moodlet: { id: 'workout_high', minutes: 240 }, autonomy: { fun: 1.4 } },
    ],
  },
  {
    id: 'chess_table', name: 'Chess Table', emoji: '♟️', category: 'skill', price: 900,
    footprint: [1, 1], description: 'For people who think several moves ahead.',
    ratings: { fun: 4, social: 2 },
    interactions: [
      { key: 'chess', label: 'Play Chess', emoji: '♟️', minutes: 45, uses: ['fun'], bonus: { social: 14 }, skill: { id: 'logic', xp: 80 }, moodlet: { id: 'deep_focus', minutes: 200 }, autonomy: { fun: 1.6 } },
    ],
  },
  {
    id: 'telescope', name: 'Telescope', emoji: '🔭', category: 'skill', price: 1800,
    footprint: [1, 1], description: 'Look up. Way up.', outdoorOnly: true,
    ratings: { fun: 5 },
    interactions: [
      { key: 'stargaze', label: 'Stargaze', emoji: '🔭', minutes: 50, uses: ['fun'], bonus: { fun: 12 }, skill: { id: 'logic', xp: 75 }, moodlet: { id: 'deep_focus', minutes: 200 }, autonomy: { fun: 1.5 } },
    ],
  },
  {
    id: 'mirror', name: 'Mirror', emoji: '🪞', category: 'skill', price: 380,
    footprint: [1, 1], description: 'Practice your best angle.',
    ratings: { fun: 3 },
    interactions: [
      { key: 'speech', label: 'Practice Speech', emoji: '🎤', minutes: 45, uses: ['fun'], bonus: { social: 14 }, skill: { id: 'charisma', xp: 75 }, moodlet: { id: 'creative_spark', minutes: 180 }, autonomy: { fun: 1.3, social: 0.8 } },
    ],
  },

  // -------------------------------- Decor ----------------------------------
  {
    id: 'plant', name: 'Potted Plant', emoji: '🪴', category: 'decor', price: 160,
    footprint: [1, 1], description: 'A small green friend.',
    ratings: { environment: 4 },
    interactions: [{ key: 'admire', label: 'Admire', emoji: '🪴', minutes: 12, uses: ['environment'], autonomy: { environment: 2 } }],
  },
  {
    id: 'painting', name: 'Painting', emoji: '🖼️', category: 'decor', price: 430,
    footprint: [1, 1], description: 'Adds instant culture.',
    ratings: { environment: 5 },
    interactions: [{ key: 'admire', label: 'Admire Art', emoji: '🖼️', minutes: 12, uses: ['environment'], autonomy: { environment: 2 } }],
  },
  {
    id: 'expensive_art', name: 'Statement Artwork', emoji: '🗿', category: 'decor', price: 3200,
    footprint: [1, 1], description: 'Nobody knows what it means. It cost a lot.',
    ratings: { environment: 9 },
    interactions: [{ key: 'admire', label: 'Contemplate Art', emoji: '🗿', minutes: 15, uses: ['environment'], bonus: { fun: 6 }, autonomy: { environment: 2.4 } }],
  },
  {
    id: 'rug', name: 'Rug', emoji: '🧶', category: 'decor', price: 270,
    footprint: [2, 3], description: 'Ties the room together. Allegedly.',
    ratings: { environment: 3, comfort: 2 },
    interactions: [],
  },
  {
    id: 'floor_lamp', name: 'Floor Lamp', emoji: '💡', category: 'decor', price: 210,
    footprint: [1, 1], description: 'Mood lighting, literally.',
    ratings: { environment: 3 },
    interactions: [],
  },

  // ------------------------------- Outdoor ---------------------------------
  {
    id: 'lounger', name: 'Sun Lounger', emoji: '🕶️', category: 'outdoor', price: 540,
    footprint: [1, 2], description: 'For doing nothing, professionally.', outdoorOnly: true,
    ratings: { comfort: 6, fun: 3 },
    interactions: [
      { key: 'sunbathe', label: 'Sunbathe', emoji: '🕶️', minutes: 60, uses: ['comfort', 'fun'], bonus: { energy: 10 }, autonomy: { comfort: 2.4, fun: 1.2 } },
    ],
  },
  {
    id: 'hot_tub', name: 'Hot Tub', emoji: '🫧', category: 'outdoor', price: 3800,
    footprint: [2, 2], description: 'Bubbles fix almost everything.', outdoorOnly: true,
    ratings: { comfort: 9, fun: 6, hygiene: 6 },
    interactions: [
      { key: 'soak', label: 'Soak in the Hot Tub', emoji: '🫧', minutes: 50, uses: ['comfort', 'fun', 'hygiene'], bonus: { social: 16 }, moodlet: { id: 'pampered', minutes: 300 }, autonomy: { comfort: 3, fun: 1.4, hygiene: 0.8 } },
    ],
  },
  {
    id: 'garden_plot', name: 'Garden Plot', emoji: '🌱', category: 'outdoor', price: 420,
    footprint: [2, 2], description: 'Grow something. Anything.', outdoorOnly: true,
    ratings: { environment: 5 },
    interactions: [
      { key: 'tend', label: 'Tend the Garden', emoji: '🌱', minutes: 45, uses: ['environment'], bonus: { fun: 14 }, skill: { id: 'gardening', xp: 80 }, moodlet: { id: 'green_thumb', minutes: 240 }, autonomy: { environment: 2.6 } },
    ],
  },
  {
    id: 'swing_set', name: 'Swing Set', emoji: '🛝', category: 'outdoor', price: 700,
    footprint: [3, 2], description: 'Peak childhood engineering.', outdoorOnly: true,
    ratings: { fun: 6 },
    interactions: [
      { key: 'swing', label: 'Swing', emoji: '🛝', minutes: 35, uses: ['fun'], bonus: { social: 18 }, autonomy: { fun: 2.4 }, stages: ['child', 'teen'] },
    ],
  },
];

export const CATALOG_BY_ID: Record<string, CatalogObject> = Object.fromEntries(
  CATALOG.map((o) => [o.id, o]),
);

export const CATEGORY_LABELS: Record<CatalogObject['category'], { label: string; emoji: string }> = {
  beds: { label: 'Beds', emoji: '🛏️' },
  seating: { label: 'Seating', emoji: '🛋️' },
  surfaces: { label: 'Surfaces', emoji: '🪵' },
  appliances: { label: 'Appliances', emoji: '🍳' },
  plumbing: { label: 'Plumbing', emoji: '🚽' },
  electronics: { label: 'Electronics', emoji: '📺' },
  skill: { label: 'Skill Objects', emoji: '🎨' },
  decor: { label: 'Decor', emoji: '🖼️' },
  outdoor: { label: 'Outdoor', emoji: '🌳' },
};

export function catalogByCategory(category: CatalogObject['category']): CatalogObject[] {
  return CATALOG.filter((o) => o.category === category).sort((a, b) => a.price - b.price);
}
