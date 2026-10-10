// Brand sponsor tasks — the classic BBNaija way to earn BB Coins.
export interface SponsorTask {
  id: string;
  brand: string;
  description: string;
  rewardCoins: number;
  rewardClout: number;
  costEnergy: number;
}

export const SPONSOR_TASKS: SponsorTask[] = [
  {
    id: 'sp-betnaija',
    brand: 'BetNaija',
    description: 'Deliver a 60-second pitch selling the brand like your life depends on it.',
    rewardCoins: 1200,
    rewardClout: 900,
    costEnergy: 12,
  },
  {
    id: 'sp-heritage',
    brand: 'Heritage Bank',
    description: 'Write and perform a jingle about saving money for the future.',
    rewardCoins: 1500,
    rewardClout: 1100,
    costEnergy: 14,
  },
  {
    id: 'sp-piggyvest',
    brand: 'PiggyVest',
    description: 'Explain compound interest to the housemates without putting them to sleep.',
    rewardCoins: 1400,
    rewardClout: 1000,
    costEnergy: 13,
  },
  {
    id: 'sp-payporte',
    brand: 'PayPorte',
    description: 'Model a full outfit and give the camera your best strut.',
    rewardCoins: 1300,
    rewardClout: 1600,
    costEnergy: 10,
  },
  {
    id: 'sp-trophy',
    brand: 'Trophy Lager',
    description: 'Toast with the housemates and lead a chant about friendship and vibes.',
    rewardCoins: 1100,
    rewardClout: 1200,
    costEnergy: 11,
  },
  {
    id: 'sp-indomie',
    brand: 'Indomie',
    description: 'Cook a midnight pack of Indomie and feed the entire house like a hero.',
    rewardCoins: 1000,
    rewardClout: 1400,
    costEnergy: 12,
  },
  {
    id: 'sp-mtn',
    brand: 'MTN',
    description: 'Stage a 30-second skit showing how fast data transforms your life.',
    rewardCoins: 1600,
    rewardClout: 1300,
    costEnergy: 13,
  },
  {
    id: 'sp-oraimo',
    brand: 'oraimo',
    description: 'Unbox a gadget with maximum drama and fake tears of joy.',
    rewardCoins: 1200,
    rewardClout: 1500,
    costEnergy: 9,
  },
];
