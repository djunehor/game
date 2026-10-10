import type { Housemate, Room, Trait } from '../types';

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export interface RoomActionEffect {
  energy?: number;
  sanity?: number;
  hunger?: number;
  houseStanding?: number;
  fanbaseClout?: number;
  bbCoins?: number;
  strikes?: number;
}

export interface RoomAction {
  key: string;
  room: Room;
  label: string;
  emoji: string;
  hint: string;
  effect: RoomActionEffect;
  log: (p: Housemate) => string;
  tweet?: { handle: string; text: (p: Housemate) => string };
  requiresHoH?: boolean;
  requiresRoomOwner?: boolean;
}

// Trait-specific multipliers applied on top of base effects.
function traitMult(p: Housemate, trait: Trait, magnitude: number): number {
  return p.trait === trait ? Math.round(magnitude * 1.5) : magnitude;
}

export const ROOM_ACTIONS: RoomAction[] = [
  // --------------------------- LOUNGE ---------------------------
  {
    key: 'hold_court',
    room: 'Lounge',
    label: 'Hold Court',
    emoji: '🎤',
    hint: 'Deliver a fiery speech to the house.',
    effect: { energy: -15, fanbaseClout: 2500, houseStanding: 4 },
    log: (p) => `${p.nickname} stood in the lounge and delivered a speech that silenced the house.`,
    tweet: { handle: '@BBNaijaSpeech', text: (p) => `${p.nickname} is speaking with full chest today! Leadership vibes 🎤🔥` },
  },
  {
    key: 'play_ludo',
    room: 'Lounge',
    label: 'Play Ludo',
    emoji: '🎲',
    hint: 'Competitive Ludo with the housemates.',
    effect: { sanity: 20, energy: -5 },
    log: (p) => `${p.nickname} played a rowdy game of Ludo and slammed the dice.`,
    tweet: { handle: '@LudoNaija', text: (p) => `${p.nickname} cheating at Ludo again? We saw that dice slam 😂` },
  },
  {
    key: 'watch_tv',
    room: 'Lounge',
    label: 'Watch TV',
    emoji: '📺',
    hint: 'Chill out and recharge in front of the screen.',
    effect: { sanity: 10, energy: 10 },
    log: (p) => `${p.nickname} zoned out watching TV. Much needed rest.`,
  },

  // --------------------------- KITCHEN ---------------------------
  {
    key: 'cook_jollof',
    room: 'Kitchen',
    label: 'Cook Jollof',
    emoji: '🍲',
    hint: 'A smoky pot of firewood jollof for the house.',
    effect: { hunger: 30, fanbaseClout: 1000, energy: -10 },
    log: (p) => `${p.nickname} cooked a massive pot of smoky firewood Jollof Rice. The house rejoiced.`,
    tweet: { handle: '@BBNaijaKitchen', text: (p) => `The aroma of ${p.nickname}'s jollof is making the whole house salivate 🍲🔥` },
  },
  {
    key: 'ration_meat',
    room: 'Kitchen',
    label: 'Ration Meat',
    emoji: '🍗',
    hint: 'Count the chicken. Risk the drama.',
    effect: { energy: -10 },
    log: (p) => `${p.nickname} took charge of the freezer and rationed the meat.`,
    tweet: { handle: '@JusticeForChicken', text: (p) => `${p.nickname} is now the Minister of Meat. May God help the house 😭🍗` },
  },
  {
    key: 'midnight_chop',
    room: 'Kitchen',
    label: 'Midnight Chop',
    emoji: '🌙',
    hint: 'Sneak a late-night meal. Nobody saw anything.',
    effect: { hunger: 20, sanity: -5, fanbaseClout: 600 },
    log: (p) => `${p.nickname} tiptoed to the kitchen for a secret midnight feast.`,
    tweet: { handle: '@LateNightEats', text: (p) => `${p.nickname} eating at 2am like the cameras can't see 😂🌙` },
  },

  // --------------------------- GARDEN ---------------------------
  {
    key: 'pool_chill',
    room: 'Garden',
    label: 'Pool Chill',
    emoji: '🏖️',
    hint: 'Soak in the pool and glow.',
    effect: { sanity: 25, fanbaseClout: 1500 },
    log: (p) => `${p.nickname} floated in the pool looking like royalty.`,
    tweet: { handle: '@BBNaijaGarden', text: (p) => `See skin work! ${p.nickname} in the pool under the moonlight ✨🛁` },
  },
  {
    key: 'gist',
    room: 'Garden',
    label: 'Gist With the House',
    emoji: '🗣️',
    hint: 'Build bonds and raise your standing.',
    effect: { sanity: 15, houseStanding: 6 },
    log: (p) => `${p.nickname} shared deep gist with the housemates and grew closer to them.`,
  },
  {
    key: 'exercise',
    room: 'Garden',
    label: 'Work Out',
    emoji: '💪',
    hint: 'Train your body for arena games.',
    effect: { energy: -15, houseStanding: 4, fanbaseClout: 1000 },
    log: (p) => `${p.nickname} put in a serious garden workout.`,
    tweet: { handle: '@FitNaija', text: (p) => `${p.nickname}'s workout routine is giving gym-tok goals 💪🔥` },
  },

  // --------------------------- BEDROOM ---------------------------
  {
    key: 'power_nap',
    room: 'Bedroom',
    label: 'Power Nap',
    emoji: '😴',
    hint: 'Recharge your energy.',
    effect: { energy: 35, sanity: 15 },
    log: (p) => `${p.nickname} took a well-earned power nap.`,
  },
  {
    key: 'gossip',
    room: 'Bedroom',
    label: 'Whisper Gossip',
    emoji: '🤫',
    hint: 'Trade secrets behind closed doors.',
    effect: { sanity: 10, houseStanding: -4, fanbaseClout: 1200 },
    log: (p) => `${p.nickname} whispered some hot gossip in the bedroom.`,
    tweet: { handle: '@TeaSpillNaija', text: (p) => `${p.nickname} in the bedroom spilling tea like it's a national duty ☕🤫` },
  },
  {
    key: 'mirror_slay',
    room: 'Bedroom',
    label: 'Mirror Slay',
    emoji: '💅🏾',
    hint: 'Serve looks to the 360 cameras.',
    effect: { fanbaseClout: 2000, sanity: 10 },
    log: (p) => `${p.nickname} stepped in front of the mirror and served a look.`,
    tweet: { handle: '@RunwayNaija', text: (p) => `${p.nickname} is giving look-of-the-season in the bedroom mirror 💅🏾🔥` },
  },

  // --------------------------- HOH SUITE ---------------------------
  {
    key: 'luxuriate',
    room: 'HoH Suite',
    label: 'Luxuriate',
    emoji: '👑',
    hint: 'Enjoy HoH luxury. It is good to be king.',
    effect: { energy: 20, sanity: 20, fanbaseClout: 1500 },
    requiresHoH: true,
    log: (p) => `${p.nickname} relaxed in the HoH suite like the crown was made for them.`,
    tweet: { handle: '@HoHWatch', text: (p) => `${p.nickname} enjoying HoH luxury? Deserved 👑✨` },
  },

  // --------------------------- DIARY ROOM ---------------------------
  {
    key: 'confess',
    room: 'Diary Room',
    label: 'Diary Confession',
    emoji: '🎙️',
    hint: 'Pour your heart out to Biggie.',
    effect: { sanity: 20, fanbaseClout: 1200 },
    log: (p) => `${p.nickname} opened up in the diary room. Raw and real.`,
    tweet: { handle: '@DiaryRoomTea', text: (p) => `${p.nickname}'s diary session just broke the internet 🎙️😭` },
  },

  // --------------------------- ARENA ---------------------------
  {
    key: 'train',
    room: 'Arena',
    label: 'Arena Training',
    emoji: '🏆',
    hint: 'Sharpen your skills for the next challenge.',
    effect: { energy: -20, fanbaseClout: 1500, houseStanding: 5 },
    log: (p) => `${p.nickname} trained hard in the arena.`,
    tweet: { handle: '@ArenaUpdate', text: (p) => `${p.nickname} in the arena training like a finalist 🏆🔥` },
  },
];

// Apply a room action to the player. Returns the updated player plus
// any extra log/tweet payloads to surface in the UI.
export function applyAction(
  player: Housemate,
  action: RoomAction,
): { player: Housemate; logText: string; tweetText?: string; tweetHandle?: string } {
  const e = action.effect;
  const next: Housemate = {
    ...player,
    energy: clamp(player.energy + (e.energy ?? 0)),
    sanity: clamp(player.sanity + (e.sanity ?? 0)),
    hunger: clamp(player.hunger + (e.hunger ?? 0)),
    houseStanding: clamp(player.houseStanding + (e.houseStanding ?? 0)),
    fanbaseClout: player.fanbaseClout + traitMult(player, 'Clout Chaser', e.fanbaseClout ?? 0),
    bbCoins: Math.max(0, player.bbCoins + (e.bbCoins ?? 0)),
    strikes: player.strikes + (e.strikes ?? 0),
  };

  // Trait-specific bonuses
  if (player.trait === 'Kitchen General' && action.room === 'Kitchen') {
    next.fanbaseClout += 800;
  }
  if (player.trait === 'Crying Specialist' && action.room === 'Diary Room') {
    next.fanbaseClout += 1500;
  }
  if (player.trait === 'Gentle Giant' && action.room === 'Arena') {
    next.fanbaseClout += 800;
  }
  if (player.trait === 'Peace Maker' && action.key === 'gist') {
    next.houseStanding = clamp(next.houseStanding + 4);
  }

  return {
    player: next,
    logText: action.log(player),
    tweetText: action.tweet ? action.tweet.text(player) : undefined,
    tweetHandle: action.tweet ? action.tweet.handle : undefined,
  };
}
