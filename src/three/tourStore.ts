import { create } from 'zustand';

export interface TourStop {
  id: string;
  name: string;
  room: string;
  emoji: string;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  title: string;
  subtitle: string;
  narration: string;
  tip: string;
  keyFeature: string;
  color: string;
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'lounge',
    name: 'Main Lounge',
    room: 'Lounge',
    emoji: '🛋️',
    cameraPos: [-16, 12, 15],
    lookAt: [-16, 1.0, 4],
    title: 'The Living Lounge',
    subtitle: 'Where Housemates Meet & Form Alliances',
    narration:
      'Welcome to Biggie’s House! This is the central hub. Gist with housemates, play Ludo at the table, or watch Biggie TV on the sofa.',
    tip: 'Walk close to any housemate and press F to conspire or pitch alliances.',
    keyFeature: 'Play Ludo & Spill Tea',
    color: '#eab308',
  },
  {
    id: 'kitchen',
    name: 'Studio Kitchen',
    room: 'Kitchen',
    emoji: '🍳',
    cameraPos: [-16, 12, -2],
    lookAt: [-16, 1.0, -12],
    title: 'The Chop Kitchen',
    subtitle: 'Cook Jollof & Midnight Chops',
    narration:
      'Food runs the house! Use the cooking stove to prepare legendary Nigerian Jollof rice, share meals to boost friendships, or grab midnight snacks.',
    tip: 'Sharing food with rivals turns tension into strategic friendship.',
    keyFeature: 'Cook Jollof at the Stove',
    color: '#f97316',
  },
  {
    id: 'diary',
    name: 'Biggie’s Diary Room',
    room: 'Diary Room',
    emoji: '🎙️',
    cameraPos: [2, 10, 13],
    lookAt: [2, 1.0, 4],
    title: 'The Confessional Room',
    subtitle: 'Direct Line to Big Brother',
    narration:
      'Sit on the golden velvet chair and confess directly to Big Brother. Reveal secrets, boast about strategy, or nominate your rivals on Friday.',
    tip: 'Sensational diary reveals create viral tweets and skyrocket fan clout!',
    keyFeature: 'Biggie Confessions & Nominations',
    color: '#ef4444',
  },
  {
    id: 'bedroom',
    name: 'Housemate Bedroom',
    room: 'Bedroom',
    emoji: '🛏️',
    cameraPos: [-16, 12, 30],
    lookAt: [-16, 1.0, 20],
    title: 'Communal Bedroom',
    subtitle: 'Rest, Recharge & Mirror Slay',
    narration:
      'Sleep to replenish your vital Energy. Practice your runway walks and mirror slay before eviction night.',
    tip: 'Keep Energy topped up so you never collapse during daily activities.',
    keyFeature: 'Power Naps & Mirror Slay',
    color: '#8b5cf6',
  },
  {
    id: 'hoh_suite',
    name: 'Head of House Suite',
    room: 'HoH Suite',
    emoji: '👑',
    cameraPos: [2, 12, -2],
    lookAt: [2, 1.0, -12],
    title: 'The Royal HoH Suite',
    subtitle: 'Luxury Living & Total Immunity',
    narration:
      'The weekly Head of House lives like royalty. Complete privacy, a king-sized bed, and total immunity from Sunday eviction.',
    tip: 'Winning Monday Arena challenges is your ticket to the HoH crown.',
    keyFeature: 'VIP King Bed & Immunity',
    color: '#eab308',
  },
  {
    id: 'garden',
    name: 'Garden Patio & Pool',
    room: 'Garden',
    emoji: '🌴',
    cameraPos: [24, 15, 20],
    lookAt: [24, 1.0, 4],
    title: 'Outdoor Garden & Pool',
    subtitle: 'Chill, Workout & Saturday Night Party',
    narration:
      'Chill by the swimming pool, train in the outdoor gym, and dance with the DJ during the famous Saturday Night Party!',
    tip: 'The Saturday Party boosts everyone’s Sanity before Sunday eviction.',
    keyFeature: 'Swimming Pool & Saturday Party',
    color: '#10b981',
  },
  {
    id: 'arena',
    name: 'Games Arena',
    room: 'Arena',
    emoji: '🏟️',
    cameraPos: [2, 12, 28],
    lookAt: [2, 1.0, 18],
    title: 'The Challenge Arena',
    subtitle: 'Battle for Head of House',
    narration:
      'Every Monday, housemates battle here in agility challenges to capture golden rings and claim the Head of House crown!',
    tip: 'Be fast and precise to secure your weekly survival.',
    keyFeature: 'Head of House Challenges',
    color: '#3b82f6',
  },
];

interface TourStore {
  isActive: boolean;
  currentStopIndex: number;
  startTour: () => void;
  nextStop: () => void;
  prevStop: () => void;
  jumpToStop: (index: number) => void;
  endTour: () => void;
}

export const useTour = create<TourStore>((set, get) => ({
  isActive: false,
  currentStopIndex: 0,
  startTour: () => set({ isActive: true, currentStopIndex: 0 }),
  nextStop: () => {
    const { currentStopIndex } = get();
    if (currentStopIndex >= TOUR_STOPS.length - 1) {
      set({ isActive: false, currentStopIndex: 0 });
    } else {
      set({ currentStopIndex: currentStopIndex + 1 });
    }
  },
  prevStop: () => {
    const { currentStopIndex } = get();
    if (currentStopIndex > 0) {
      set({ currentStopIndex: currentStopIndex - 1 });
    }
  },
  jumpToStop: (index: number) => {
    if (index >= 0 && index < TOUR_STOPS.length) {
      set({ currentStopIndex: index });
    }
  },
  endTour: () => set({ isActive: false, currentStopIndex: 0 }),
}));
