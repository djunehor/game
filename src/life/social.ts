import type { InteractionDef } from '../sim/types';

// ---------------------------------------------------------------------------
// Social interactions: one Sim doing something *to* another.
//
// These are what actually move relationships. Every entry declares what it does
// to the relationship (applied to both Sims) and how it makes the other person
// feel, plus what it takes to unlock.
//
// `room: 'social'` is a display tag — social actions are not tied to an object.
// ---------------------------------------------------------------------------

export const SOCIAL_INTERACTIONS: InteractionDef[] = [
  {
    id: 'social_chat',
    label: 'Chat',
    emoji: '💬',
    room: 'social',
    object: 'sim',
    minutes: 25,
    motiveDeltas: { social: 34, fun: 8 },
    skillXp: { charisma: 35 },
    autonomy: { social: 3.2, fun: 0.6 },
    social: {
      relationship: { friendship: 8 },
      targetMotiveDeltas: { social: 30, fun: 6 },
      targetMoodlet: { id: 'great_chat', minutes: 120 },
    },
  },
  {
    id: 'social_joke',
    label: 'Tell a Joke',
    emoji: '😂',
    room: 'social',
    object: 'sim',
    minutes: 20,
    motiveDeltas: { social: 26, fun: 20 },
    skillXp: { charisma: 45, creativity: 20 },
    autonomy: { social: 2.4, fun: 1.4 },
    social: {
      relationship: { friendship: 12 },
      targetMotiveDeltas: { fun: 26, social: 18 },
      targetMoodlet: { id: 'great_chat', minutes: 150 },
    },
  },
  {
    id: 'social_compliment',
    label: 'Compliment',
    emoji: '🥰',
    room: 'social',
    object: 'sim',
    minutes: 15,
    motiveDeltas: { social: 22 },
    skillXp: { charisma: 40 },
    autonomy: { social: 2.2 },
    social: {
      relationship: { friendship: 14, romance: 6 },
      targetMotiveDeltas: { social: 22, comfort: 12 },
      targetMoodlet: { id: 'flirted_with', minutes: 150 },
    },
  },
  {
    id: 'social_deep_talk',
    label: 'Deep Conversation',
    emoji: '🌙',
    room: 'social',
    object: 'sim',
    minutes: 45,
    motiveDeltas: { social: 46, fun: 12, comfort: 10 },
    skillXp: { charisma: 70, logic: 25 },
    autonomy: { social: 2.6, comfort: 0.8 },
    requiresSkill: { id: 'charisma', level: 2 },
    social: {
      relationship: { friendship: 22 },
      targetMotiveDeltas: { social: 42, comfort: 14 },
      targetMoodlet: { id: 'great_chat', minutes: 240 },
    },
  },
  {
    id: 'social_gossip',
    label: 'Gossip',
    emoji: '🤫',
    room: 'social',
    object: 'sim',
    minutes: 25,
    motiveDeltas: { social: 32, fun: 22 },
    skillXp: { charisma: 45 },
    autonomy: { social: 2.4, fun: 1.2 },
    social: {
      relationship: { friendship: 10 },
      targetMotiveDeltas: { fun: 24, social: 26 },
      targetMoodlet: { id: 'great_chat', minutes: 150 },
    },
  },
  {
    id: 'social_hug',
    label: 'Hug',
    emoji: '🤗',
    room: 'social',
    object: 'sim',
    minutes: 10,
    motiveDeltas: { social: 26, comfort: 18 },
    autonomy: { social: 2, comfort: 1.2 },
    social: {
      relationship: { friendship: 16 },
      targetMotiveDeltas: { comfort: 26, social: 20 },
      targetMoodlet: { id: 'pampered', minutes: 150 },
      requiresRelationship: { friendship: 25 },
    },
  },
  {
    id: 'social_flirt',
    label: 'Flirt',
    emoji: '😘',
    room: 'social',
    object: 'sim',
    minutes: 25,
    motiveDeltas: { social: 34, fun: 22 },
    skillXp: { charisma: 55 },
    autonomy: { social: 2.2, fun: 1.2 },
    requiresSkill: { id: 'charisma', level: 2 },
    social: {
      relationship: { friendship: 6, romance: 16 },
      targetMotiveDeltas: { social: 30, fun: 18 },
      targetMoodlet: { id: 'flirted_with', minutes: 240 },
      requiresRelationship: { friendship: 20 },
      targetStages: ['teen', 'youngAdult', 'adult', 'elder'],
    },
  },
  {
    id: 'social_kiss',
    label: 'Kiss',
    emoji: '💋',
    room: 'social',
    object: 'sim',
    minutes: 15,
    motiveDeltas: { social: 40, fun: 30, comfort: 16 },
    autonomy: { social: 2.4, fun: 1.4 },
    social: {
      relationship: { friendship: 10, romance: 24 },
      targetMotiveDeltas: { social: 36, fun: 26, comfort: 18 },
      targetMoodlet: { id: 'flirted_with', minutes: 300 },
      requiresRelationship: { romance: 45 },
      targetStages: ['teen', 'youngAdult', 'adult', 'elder'],
    },
  },
  {
    id: 'social_argue',
    label: 'Argue',
    emoji: '😤',
    room: 'social',
    object: 'sim',
    minutes: 20,
    motiveDeltas: { social: 20, fun: -6, comfort: -10 },
    autonomy: { comfort: 1.2, fun: 0.6 },
    social: {
      relationship: { friendship: -22 },
      targetMotiveDeltas: { comfort: -18, fun: -10 },
      targetMoodlet: { id: 'rude_encounter', minutes: 180 },
    },
  },
  {
    id: 'social_insult',
    label: 'Insult',
    emoji: '🗯️',
    room: 'social',
    object: 'sim',
    minutes: 15,
    motiveDeltas: { social: 16, fun: 10, comfort: -14 },
    autonomy: { fun: 1.2 },
    social: {
      relationship: { friendship: -34, romance: -20 },
      targetMotiveDeltas: { comfort: -26, fun: -16 },
      targetMoodlet: { id: 'rude_encounter', minutes: 240 },
    },
  },
  {
    id: 'social_apologise',
    label: 'Apologise',
    emoji: '🙏',
    room: 'social',
    object: 'sim',
    minutes: 20,
    motiveDeltas: { social: 20, comfort: -6 },
    skillXp: { charisma: 50 },
    autonomy: { social: 1.4 },
    social: {
      relationship: { friendship: 18 },
      targetMotiveDeltas: { comfort: 16, social: 18 },
      targetMoodlet: { id: 'great_chat', minutes: 180 },
      requiresRelationship: { friendship: -100 },
    },
  },
];

export const SOCIAL_IDS = new Set(SOCIAL_INTERACTIONS.map((i) => i.id));

export function isSocial(defId: string): boolean {
  return SOCIAL_IDS.has(defId);
}
