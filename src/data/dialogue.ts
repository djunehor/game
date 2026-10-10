import type { Housemate } from '../types';

export interface DialogueOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
  costEnergy?: number;
  effect: (
    player: Housemate,
    target: Housemate
  ) => {
    playerReply: string;
    targetReply: string;
    affinityChange: number;
    cloutGain: number;
    standingChange: number;
    strikeGain?: number;
    tweet?: { handle: string; text: string };
  };
}

export const DIALOGUE_OPTIONS: DialogueOption[] = [
  {
    id: 'gist',
    label: 'Gist & Spill Tea',
    emoji: '☕',
    description: 'Bond over house gossip and chill out.',
    costEnergy: 8,
    effect: (player, target) => {
      const positive = target.trait === 'Peace Maker' || target.trait === 'Lover Boy / Girl' || Math.random() > 0.3;
      if (positive) {
        return {
          playerReply: `You and ${target.nickname} whispered deep gist about who is faking their accent in the house.`,
          targetReply: `"No be lie! I dey notice am too. Me and you dey on the same frequency 💯"`,
          affinityChange: 12,
          cloutGain: 800,
          standingChange: 4,
          tweet: {
            handle: '@BBNaijaGist',
            text: `Seeing ${player.nickname} and ${target.nickname} laughing in the corner... love this duo! 😍`,
          },
        };
      } else {
        return {
          playerReply: `You tried to start gist with ${target.nickname}, but they gave you cold, calculated energy.`,
          targetReply: `"I don't really do fake conversations. Keep my name out of your gist, please."`,
          affinityChange: -5,
          cloutGain: 500,
          standingChange: -2,
        };
      }
    },
  },
  {
    id: 'alliance',
    label: 'Pitch Secret Alliance',
    emoji: '🤝',
    description: 'Propose a voting pact to protect each other on Friday.',
    costEnergy: 12,
    effect: (player, target) => {
      const currentAffinity = player.relationships[target.id] ?? 0;
      const willAccept = currentAffinity > 10 || target.trait === 'Strategic Schemer';
      if (willAccept) {
        return {
          playerReply: `You looked ${target.nickname} in the eyes and whispered: "Let's watch each other's backs on Friday. No nominations."`,
          targetReply: `"Deal. You don't mention my name to Biggie, I won't mention yours. Let's make the finale."`,
          affinityChange: 20,
          cloutGain: 1200,
          standingChange: 5,
          tweet: {
            handle: '@TacticalBBN',
            text: `The cameras caught ${player.nickname} and ${target.nickname} shaking hands secretly. ALLIANCE FORMED?! 🧠🔥`,
          },
        };
      } else {
        return {
          playerReply: `You pitched a nomination safety pact to ${target.nickname}.`,
          targetReply: `"Look, I play my own game. I'm not making promises I can't keep."`,
          affinityChange: -8,
          cloutGain: 600,
          standingChange: -4,
        };
      }
    },
  },
  {
    id: 'flirt',
    label: 'Flirt & Spark a Ship',
    emoji: '💘',
    description: 'Turn on the charm. The fans outside are dying for romance.',
    costEnergy: 10,
    effect: (player, target) => {
      const currentAffinity = player.relationships[target.id] ?? 0;
      const shipSuccess = currentAffinity >= 0 && (target.trait === 'Lover Boy / Girl' || Math.random() > 0.4);
      if (shipSuccess) {
        return {
          playerReply: `You leaned in close to ${target.nickname} and gave them a playful wink and a sweet compliment.`,
          targetReply: `"Stop looking at me like that before I start catching serious feelings... 🥰"`,
          affinityChange: 25,
          cloutGain: 3500,
          standingChange: 2,
          tweet: {
            handle: '@ShipHQ',
            text: `WE HAVE A SHIP! Look at ${player.nickname} and ${target.nickname} blushing! Official fandom name loading... 🚢❤️🔥`,
          },
        };
      } else {
        return {
          playerReply: `You tried to shoot your shot with ${target.nickname}.`,
          targetReply: `"Ehya. Save that sweet mouth for your fans. I came here for the 100M, not romance."`,
          affinityChange: -6,
          cloutGain: 1400,
          standingChange: -1,
          tweet: {
            handle: '@FriendzoneBBN',
            text: `Omo ${target.nickname} just gave ${player.nickname} VIP friendzone package live on TV 😂😭`,
          },
        };
      }
    },
  },
  {
    id: 'confront',
    label: 'Pepper Dem / Confront',
    emoji: '🌶️',
    description: 'Pick a fight for camera time. Pure Naija reality TV drama.',
    costEnergy: 15,
    effect: (player, target) => {
      return {
        playerReply: `You called out ${target.nickname} with full chest right in front of everyone! "Say it to my face, not behind my back!"`,
        targetReply: `"Who do you think you are talking to?! Don't test my home training in this house!"`,
        affinityChange: -35,
        cloutGain: 4800,
        standingChange: -10,
        tweet: {
          handle: '@WahalaEverywhere',
          text: `BLOODBATH IN THE HOUSE! ${player.nickname} vs ${target.nickname} shouting match!! Clout through the ROOF! 🍿🔥`,
        },
      };
    },
  },
  {
    id: 'scheme',
    label: 'Conspire on Nominations',
    emoji: '🤫',
    description: 'Whisper about who to nominate for eviction on Friday.',
    costEnergy: 10,
    effect: (player, target) => {
      const currentAffinity = player.relationships[target.id] ?? 0;
      const receptive = currentAffinity > 10 || target.trait === 'Strategic Schemer';
      if (receptive) {
        return {
          playerReply: `You whispered to ${target.nickname}: "Friday is coming. We need to align our votes against the biggest threats."`,
          targetReply: `"Smart move. I have my eyes on two people already. Let us compare notes before Biggie calls us."`,
          affinityChange: 15,
          cloutGain: 1400,
          standingChange: 3,
          tweet: {
            handle: '@BBNStrategy',
            text: `Cameras caught ${player.nickname} and ${target.nickname} whispering game strategy in low voices! The game is ON! ♟️🔥`,
          },
        };
      } else {
        return {
          playerReply: `You tried to discuss nomination plans with ${target.nickname}.`,
          targetReply: `"Do not bring that bad energy to me. I nominate based on my spirit, not your plot."`,
          affinityChange: -8,
          cloutGain: 500,
          standingChange: -3,
          tweet: {
            handle: '@BBNUpdates',
            text: `${target.nickname} shut down ${player.nickname}'s attempt to influence nominations. Tension rising! 🍿`,
          },
        };
      }
    },
  },
  {
    id: 'share_food',
    label: 'Cook & Share Food',
    emoji: '🍲',
    description: 'Offer delicious food to win their heart and build goodwill.',
    costEnergy: 12,
    effect: (player, target) => {
      const isChef = target.trait === 'Kitchen General';
      if (isChef) {
        return {
          playerReply: `You served ${target.nickname} a plate of fresh hot food.`,
          targetReply: `"Hmm! The seasoning actually makes sense! You tried well, my friend."`,
          affinityChange: 22,
          cloutGain: 900,
          standingChange: 6,
          tweet: {
            handle: '@FoodieBBN',
            text: `Even the Kitchen General ${target.nickname} approved ${player.nickname}'s cooking! Wholesome vibes in the house! 😋✨`,
          },
        };
      } else {
        return {
          playerReply: `You shared a hot portion of peppered meat and plantain with ${target.nickname}.`,
          targetReply: `"Bless you! You saved my life today. I will not forget this kindness!"`,
          affinityChange: 18,
          cloutGain: 750,
          standingChange: 5,
          tweet: {
            handle: '@BBNMoments',
            text: `${player.nickname} feeding ${target.nickname} late night... friendship goals! ❤️🍲`,
          },
        };
      }
    },
  },
];

// Random ambient chatter lines for housemates
export const AMBIENT_CHATTER = [
  'Who finish the plantain?! 🍌',
  'This Saturday party go loud die! 🪩',
  'Ebuka go shake table on Sunday o... 🚪',
  'Biggie please open the diary room! 🎙️',
  'I need to hit the gym before evening task 💪',
  'Some people here are purely fake. 🙄',
  'Make nobody touch my chicken for fridge! 🍗',
  'The air conditioning is freezing me! 🥶',
  'I wonder who is trending outside right now? 📱',
  '100 Million Naira is entering my account! 🏆',
];
