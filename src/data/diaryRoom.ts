import type { Housemate } from '../types';

export interface DiaryOption {
  label: string;
  description: string;
  biggieReply: string;
  effect: {
    clout: number;
    sanity: number;
    standing?: number;
  };
  tweet?: {
    handle: string;
    text: (player: Housemate) => string;
  };
}

export interface DiarySession {
  id: string;
  question: string;
  options: DiaryOption[];
}

export const DIARY_SESSIONS: DiarySession[] = [
  {
    id: 'fake_housemates',
    question: 'Welcome to the Diary Room. Tell Biggie: who in this house is playing the fakest game?',
    options: [
      {
        label: 'Expose the Schemers with Full Chest',
        description: 'Call out the secret plots and fake friendships without fear.',
        biggieReply: 'Biggie sees all things. Your honesty is recorded, but remember: the walls have ears.',
        effect: { clout: 3200, sanity: 15, standing: -2 },
        tweet: {
          handle: '@DiaryRoomLeaks',
          text: (p) => `${p.nickname} just spilled whole cups of hot tea inside the Diary Room! NO CHILL! 🔥☕`,
        },
      },
      {
        label: 'Pretend Everything Is Peaceful',
        description: 'Act innocent and claim everyone is family.',
        biggieReply: 'Biggie is amused. You are smiling to the camera, but Biggie knows your heart.',
        effect: { clout: 800, sanity: 10, standing: 4 },
        tweet: {
          handle: '@BBNaijaWatch',
          text: (p) => `${p.nickname} playing saint inside Diary Room... whom are you deceiving? 😂`,
        },
      },
      {
        label: 'Demand Biggie Shake The Table',
        description: 'Beg Ebuka and Biggie to expose everyone during Sunday live show.',
        biggieReply: 'Careful what you wish for. When Biggie shakes the table, nobody is safe.',
        effect: { clout: 4500, sanity: -5, standing: 0 },
        tweet: {
          handle: '@TableShakerHQ',
          text: (p) => `${p.nickname} begging Biggie to cause chaos on Sunday! We are READY! 🍿💣`,
        },
      },
    ],
  },
  {
    id: 'romance_ships',
    question: 'Biggie has noticed intense eye contact and late-night whispering. Is romance brewing in your corner?',
    options: [
      {
        label: 'Confirm the Ship: I Am Catching Feelings',
        description: 'Admit to Biggie that someone in the house has stolen your attention.',
        biggieReply: 'Love is a beautiful thing. But do not forget the 100 Million Naira grand prize.',
        effect: { clout: 4000, sanity: 25, standing: 2 },
        tweet: {
          handle: '@ShipNation',
          text: (p) => `CONFIRMED! ${p.nickname} just admitted feelings in the Diary Room! WE ARE SCREAMING! 🚢❤️🔥`,
        },
      },
      {
        label: 'Focus on the Money: No Distractions',
        description: 'Declare strictly business: you came for 100M, not wedding bells.',
        biggieReply: 'A focused mind is dangerous in this house. Let us see if your resolve holds.',
        effect: { clout: 2800, sanity: 10, standing: 5 },
        tweet: {
          handle: '@FocusBBN',
          text: (p) => `${p.nickname}: "I came for the 100M, not love." Pure business mindset! 💼💰`,
        },
      },
    ],
  },
  {
    id: 'nominations_fear',
    question: 'Eviction day approaches. How confident are you that your fanbase will save you?',
    options: [
      {
        label: 'My Fans Are Rugged: 100% Unbothered',
        description: 'Brag about your fan army and their voting power.',
        biggieReply: 'Confidence is good. Overconfidence has led many housemates out the front door.',
        effect: { clout: 3500, sanity: 15, standing: 2 },
        tweet: {
          handle: '@FanbaseWar',
          text: (p) => `${p.nickname}'s fanbase voting buttons are already on FIRE! Top tier energy! 💥📈`,
        },
      },
      {
        label: 'Cry for Sympathy & Plead With Africa',
        description: 'Tears in the diary room! Plead with voters to keep your dream alive.',
        biggieReply: 'Take a tissue. Africa hears your cries. Let your passion show.',
        effect: { clout: 3800, sanity: 20, standing: 3 },
        tweet: {
          handle: '@EmotionalBBN',
          text: (p) => `Seeing ${p.nickname} cry in the Diary Room broke my heart! Dropping all my votes today! 🥺🗳️`,
        },
      },
    ],
  },
];
