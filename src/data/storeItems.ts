export interface StoreItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
}

// Biggie's Store — spend your hard-earned BB Coins on luxuries and advantages.
export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'luxury-treat',
    name: 'Luxury Treat',
    emoji: '🍽️',
    description: 'A five-star meal delivered to the house. +30 energy, +30 hunger.',
    cost: 1500,
  },
  {
    id: 'spa-day',
    name: 'Spa & Massage',
    emoji: '💆🏾',
    description: 'Full spa treatment. +40 sanity, +15 energy.',
    cost: 2000,
  },
  {
    id: 'fan-boost',
    name: 'Fan Vote Boost',
    emoji: '📈',
    description: 'A little social media push. +2,500 fanbase clout.',
    cost: 2500,
  },
  {
    id: 'immunity-token',
    name: 'Immunity Token',
    emoji: '🛡️',
    description: 'Safe from eviction this week. Use before nominations.',
    cost: 9000,
  },
];
