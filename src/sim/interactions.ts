import type { InteractionDef } from './types';

/**
 * Sims-style interaction catalog. Each entry is something a Sim can *do* at an
 * object. Motive deltas are applied when the interaction completes; autonomy
 * weights decide who seeks it out on their own.
 */
export const INTERACTIONS: InteractionDef[] = [
  {
    id: 'eat_leftovers',
    label: 'Eat Leftovers',
    emoji: '🥡',
    room: 'Kitchen',
    object: 'fridge',
    minutes: 30,
    motiveDeltas: { hunger: 48, fun: 5 },
    grants: [{ moodletId: 'just_ate', minutes: 180 }],
    autonomy: { hunger: 3 },
  },
  {
    id: 'cook_meal',
    label: 'Cook a Meal',
    emoji: '🍳',
    room: 'Kitchen',
    object: 'stove',
    minutes: 60,
    motiveDeltas: { hunger: 62, fun: 10 },
    skillXp: { cooking: 55 },
    grants: [{ moodletId: 'just_ate', minutes: 240 }],
    autonomy: { hunger: 2.2, fun: 0.4 },
  },
  {
    id: 'cook_gourmet',
    label: 'Cook a Gourmet Feast',
    emoji: '🤌',
    room: 'Kitchen',
    object: 'stove',
    minutes: 95,
    motiveDeltas: { hunger: 85, fun: 22, social: 12 },
    skillXp: { cooking: 120, charisma: 15 },
    grants: [{ moodletId: 'gourmet_meal', minutes: 360 }],
    autonomy: { hunger: 1.6, fun: 0.8 },
    requiresSkill: { id: 'cooking', level: 3 },
  },
  {
    id: 'brew_coffee',
    label: 'Brew Coffee',
    emoji: '☕',
    room: 'Kitchen',
    object: 'coffee_machine',
    minutes: 20,
    motiveDeltas: { energy: 34, bladder: -8 },
    grants: [{ moodletId: 'caffeine_buzz', minutes: 150 }],
    autonomy: { energy: 2.4 },
  },
  {
    id: 'wash_dishes',
    label: 'Wash Dishes',
    emoji: '🧼',
    room: 'Kitchen',
    object: 'sink',
    minutes: 45,
    motiveDeltas: { environment: 32, comfort: 8 },
    skillXp: { cleaning: 45 },
    autonomy: { environment: 2.6 },
  },

  // -------------------------------- Lounge --------------------------------
  {
    id: 'watch_tv',
    label: 'Watch Biggie TV',
    emoji: '📺',
    room: 'Lounge',
    object: 'tv',
    minutes: 55,
    motiveDeltas: { fun: 46, energy: 8, social: 8 },
    grants: [{ moodletId: 'just_ate', minutes: 0 }],
    autonomy: { fun: 3, energy: 0.3 },
  },
  {
    id: 'play_ludo',
    label: 'Play Ludo',
    emoji: '🎲',
    room: 'Lounge',
    object: 'coffee_table',
    minutes: 45,
    motiveDeltas: { fun: 40, social: 32 },
    skillXp: { gaming: 40, logic: 15 },
    grants: [{ moodletId: 'won_game', minutes: 180 }],
    autonomy: { fun: 2.4, social: 1.6 },
  },
  {
    id: 'dance_party',
    label: 'Dance',
    emoji: '💃',
    room: 'Lounge',
    object: 'stereo',
    minutes: 40,
    motiveDeltas: { fun: 44, social: 30, energy: -14, hygiene: -10 },
    skillXp: { fitness: 35, creativity: 20 },
    autonomy: { fun: 2.6, social: 1.4 },
  },
  {
    id: 'chat_housemates',
    label: 'Chat with Housemates',
    emoji: '💬',
    room: 'Lounge',
    object: 'sofa',
    minutes: 40,
    motiveDeltas: { social: 50, fun: 18, comfort: 10 },
    skillXp: { charisma: 40 },
    grants: [{ moodletId: 'great_chat', minutes: 180 }],
    autonomy: { social: 3.2, comfort: 0.5 },
  },
  {
    id: 'flirt',
    label: 'Shoot Your Shot',
    emoji: '😘',
    room: 'Lounge',
    object: 'sofa',
    minutes: 35,
    motiveDeltas: { social: 42, fun: 26 },
    skillXp: { charisma: 60 },
    grants: [{ moodletId: 'flirted_with', minutes: 240 }],
    autonomy: { social: 1.8, fun: 1.0 },
    requiresSkill: { id: 'charisma', level: 2 },
  },
  {
    id: 'clean_lounge',
    label: 'Tidy the Lounge',
    emoji: '🧹',
    room: 'Lounge',
    object: 'floor',
    minutes: 50,
    motiveDeltas: { environment: 38, comfort: 10 },
    skillXp: { cleaning: 55 },
    grants: [{ moodletId: 'clean_house', minutes: 240 }],
    autonomy: { environment: 2.4 },
  },

  // ------------------------------- Bedroom --------------------------------
  {
    id: 'sleep',
    label: 'Sleep',
    emoji: '😴',
    room: 'Bedroom',
    object: 'bed',
    minutes: 420,
    motiveDeltas: { energy: 92, comfort: 30, bladder: -30, hunger: -22, hygiene: -18 },
    grants: [{ moodletId: 'slept_well', minutes: 300 }],
    autonomy: { energy: 3.4, comfort: 0.8 },
  },
  {
    id: 'power_nap',
    label: 'Power Nap',
    emoji: '🛌',
    room: 'Bedroom',
    object: 'bed',
    minutes: 90,
    motiveDeltas: { energy: 38, comfort: 14 },
    autonomy: { energy: 1.8, comfort: 0.6 },
  },
  {
    id: 'shower',
    label: 'Take a Shower',
    emoji: '🚿',
    room: 'Bedroom',
    object: 'shower',
    minutes: 30,
    motiveDeltas: { hygiene: 78, comfort: 16, fun: 8 },
    grants: [{ moodletId: 'squeaky_clean', minutes: 240 }],
    autonomy: { hygiene: 3.4, comfort: 0.4 },
  },
  {
    id: 'use_toilet',
    label: 'Use the Toilet',
    emoji: '🚽',
    room: 'Bedroom',
    object: 'toilet',
    minutes: 12,
    motiveDeltas: { bladder: 92, hygiene: -8 },
    autonomy: { bladder: 4 },
  },
  {
    id: 'practice_speech',
    label: 'Practice Speech',
    emoji: '🎤',
    room: 'Bedroom',
    object: 'mirror',
    minutes: 45,
    motiveDeltas: { fun: 20, social: 12 },
    skillXp: { charisma: 70, creativity: 25 },
    grants: [{ moodletId: 'creative_spark', minutes: 200 }],
    autonomy: { fun: 1.2, social: 0.8 },
  },
  {
    id: 'primp',
    label: 'Primp at the Mirror',
    emoji: '💅',
    room: 'Bedroom',
    object: 'vanity',
    minutes: 35,
    motiveDeltas: { fun: 22, hygiene: 18, comfort: 10 },
    grants: [{ moodletId: 'pampered', minutes: 240 }],
    autonomy: { fun: 1.4, hygiene: 0.8 },
  },

  // --------------------------------- Garden -------------------------------
  {
    id: 'swim',
    label: 'Go Swimming',
    emoji: '🏊',
    room: 'Garden',
    object: 'pool',
    minutes: 55,
    motiveDeltas: { fun: 48, hygiene: 14, energy: -18, comfort: -8 },
    skillXp: { fitness: 55 },
    grants: [{ moodletId: 'workout_high', minutes: 180 }],
    autonomy: { fun: 2.2, energy: 0.4 },
  },
  {
    id: 'workout',
    label: 'Work Out',
    emoji: '🏋️',
    room: 'Garden',
    object: 'gym',
    minutes: 60,
    motiveDeltas: { fun: 26, energy: -26, hygiene: -22, comfort: -10 },
    skillXp: { fitness: 80 },
    grants: [{ moodletId: 'workout_high', minutes: 240 }],
    autonomy: { fun: 1.4, energy: 0.5 },
  },
  {
    id: 'grill_suya',
    label: 'Grill Suya',
    emoji: '🍢',
    room: 'Garden',
    object: 'grill',
    minutes: 55,
    motiveDeltas: { hunger: 58, fun: 20, social: 18 },
    skillXp: { cooking: 60 },
    grants: [{ moodletId: 'just_ate', minutes: 240 }],
    autonomy: { hunger: 1.8, social: 0.6 },
  },
  {
    id: 'sunbathe',
    label: 'Sunbathe',
    emoji: '🕶️',
    room: 'Garden',
    object: 'lounger',
    minutes: 60,
    motiveDeltas: { comfort: 40, fun: 26, energy: 12 },
    autonomy: { comfort: 2.4, fun: 1.0 },
  },
  {
    id: 'soak_jacuzzi',
    label: 'Soak in the Jacuzzi',
    emoji: '🛁',
    room: 'Garden',
    object: 'jacuzzi',
    minutes: 50,
    motiveDeltas: { comfort: 52, hygiene: 30, fun: 30, social: 10 },
    grants: [{ moodletId: 'pampered', minutes: 240 }],
    autonomy: { comfort: 2.6, hygiene: 0.8 },
  },
  {
    id: 'water_plants',
    label: 'Tend the Garden',
    emoji: '🌱',
    room: 'Garden',
    object: 'plant_bed',
    minutes: 45,
    motiveDeltas: { environment: 34, fun: 14 },
    skillXp: { gardening: 75 },
    grants: [{ moodletId: 'green_thumb', minutes: 240 }],
    autonomy: { environment: 2.2 },
  },

  // ------------------------------- HoH Suite ------------------------------
  {
    id: 'hoh_sleep',
    label: 'Sleep in the HoH Bed',
    emoji: '👑',
    room: 'HoH Suite',
    object: 'hoh_bed',
    minutes: 400,
    motiveDeltas: { energy: 96, comfort: 46, bladder: -28, hunger: -20 },
    grants: [{ moodletId: 'slept_well', minutes: 360 }],
    autonomy: { energy: 2.6, comfort: 1.6 },
  },
  {
    id: 'hoh_jacuzzi',
    label: 'HoH Jacuzzi',
    emoji: '🛁',
    room: 'HoH Suite',
    object: 'hoh_jacuzzi',
    minutes: 50,
    motiveDeltas: { comfort: 60, fun: 34, hygiene: 26 },
    grants: [{ moodletId: 'pampered', minutes: 300 }],
    autonomy: { comfort: 3, fun: 1.2 },
  },
  {
    id: 'watch_cameras',
    label: 'Watch the Cameras',
    emoji: '🖥️',
    room: 'HoH Suite',
    object: 'cameras',
    minutes: 40,
    motiveDeltas: { fun: 28, social: 8 },
    skillXp: { logic: 65 },
    grants: [{ moodletId: 'deep_focus', minutes: 180 }],
    autonomy: { fun: 1.6 },
  },

  // ------------------------------ Diary Room ------------------------------
  {
    id: 'confess',
    label: 'Confess to Biggie',
    emoji: '🎙️',
    room: 'Diary Room',
    object: 'diary_chair',
    minutes: 35,
    motiveDeltas: { social: 38, fun: 22, comfort: 16 },
    skillXp: { charisma: 45 },
    grants: [{ moodletId: 'great_chat', minutes: 180 }],
    autonomy: { social: 1.6, comfort: 1.0 },
  },
  {
    id: 'cry_it_out',
    label: 'Let It All Out',
    emoji: '😭',
    room: 'Diary Room',
    object: 'diary_chair',
    minutes: 30,
    motiveDeltas: { comfort: 40, fun: 10, social: 14 },
    skillXp: { charisma: 20 },
    autonomy: { comfort: 2.4, social: 0.5 },
  },

  // --------------------------------- Arena --------------------------------
  {
    id: 'obstacle_drills',
    label: 'Obstacle Drills',
    emoji: '🧗',
    room: 'Arena',
    object: 'arena_course',
    minutes: 65,
    motiveDeltas: { fun: 34, energy: -34, hygiene: -26, comfort: -12 },
    skillXp: { fitness: 95, logic: 20 },
    grants: [{ moodletId: 'workout_high', minutes: 240 }],
    autonomy: { fun: 1.6, energy: 0.5 },
  },
  {
    id: 'shoot_hoops',
    label: 'Shoot Hoops',
    emoji: '🏀',
    room: 'Arena',
    object: 'arena_course',
    minutes: 40,
    motiveDeltas: { fun: 40, social: 22, energy: -16 },
    skillXp: { fitness: 45 },
    autonomy: { fun: 2.4, social: 1.0 },
  },
];

// ---------------------------------------------------------------------------
// Registry
// The base list below is the "house defaults". The life layer (buy-mode objects)
// registers extra interactions at runtime, so what a Sim can do is decided by
// what is actually placed in the world.
// ---------------------------------------------------------------------------
let extraInteractions: InteractionDef[] = [];
let registry: InteractionDef[] = [];

function rebuild(): void {
  registry = [...INTERACTIONS, ...extraInteractions];
}
rebuild();

/** Every interaction currently available in the world. */
export function allInteractions(): InteractionDef[] {
  return registry;
}

/** Replace the object-driven interactions (used by buy mode). */
export function registerObjectInteractions(defs: InteractionDef[]): void {
  extraInteractions = defs;
  rebuild();
}

export function getInteraction(id: string): InteractionDef | undefined {
  return registry.find((i) => i.id === id);
}

/** Small helper so UI code doesn't rebuild lookup tables. */
export function interactionById(): Record<string, InteractionDef> {
  return Object.fromEntries(registry.map((i) => [i.id, i]));
}

export function interactionsInRoom(room: string): InteractionDef[] {
  return registry.filter((i) => i.room === room);
}

/** Player-facing list filtered by unlocked requirements. */
export function availableInteractions(
  room: string,
  isUnlocked: (def: InteractionDef) => boolean,
): InteractionDef[] {
  return interactionsInRoom(room).filter(isUnlocked);
}
