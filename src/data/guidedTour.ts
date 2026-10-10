export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  tagline: string;
  emoji: string;
  badge: string;
  themeColor: string;
  description: string;
  features: {
    icon: string;
    label: string;
    detail: string;
  }[];
  tip: string;
}

export const GUIDED_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: "Welcome to Biggie's House",
    tagline: 'The ₦100,000,000 Grand Prize Reality Sim',
    emoji: '👑',
    badge: 'Overview',
    themeColor: '#eab308',
    description:
      "You have entered Nigeria's most famous house! Your mission is to survive weekly evictions, win the audience votes, and walk away with ₦100,000,000.",
    features: [
      {
        icon: '🏆',
        label: 'Grand Prize',
        detail: '₦100,000,000 cash prize plus fame and sponsor endorsements.',
      },
      {
        icon: '📊',
        label: 'Three Needs',
        detail: 'Maintain Energy, Sanity, and Hunger above critical thresholds.',
      },
      {
        icon: '📈',
        label: 'Fanbase Clout',
        detail: 'Every interaction and challenge win builds real audience votes.',
      },
    ],
    tip: 'If your energy or sanity hits zero, the house and the fans will turn on you!',
  },
  {
    id: 'controls',
    stepNumber: 2,
    title: 'Smooth Controls & Exploration',
    tagline: 'Navigate the 3D Studio House',
    emoji: '🕹️',
    badge: 'Controls',
    themeColor: '#3b82f6',
    description:
      'Freely explore the entire house with simple keyboard or touch controls designed for full immersion.',
    features: [
      {
        icon: '⌨️',
        label: 'Movement Keys',
        detail: 'Use W, A, S, D or Arrow keys to walk through all 7 studio rooms.',
      },
      {
        icon: '⚡',
        label: 'Sprint Mode',
        detail: 'Hold Shift to dash quickly across the house.',
      },
      {
        icon: '🔄',
        label: 'Camera Angle',
        detail: 'Press Q or E to rotate the camera and view hidden corners.',
      },
      {
        icon: '📱',
        label: 'Mobile Joystick',
        detail: 'On touch screens, drag the on-screen joystick on the left.',
      },
    ],
    tip: 'Built-in collision boundaries ensure you stay safely on the floor slabs without getting stuck in walls.',
  },
  {
    id: 'social',
    stepNumber: 3,
    title: 'Social Alliances & Housemates',
    tagline: 'Conspire, Gist & Build Strategic Bonds',
    emoji: '🤝',
    badge: 'Strategy',
    themeColor: '#a855f7',
    description:
      'Living with 8 autonomous AI housemates means drama, loyalty, and betrayal. Manage your relationships carefully.',
    features: [
      {
        icon: '💬',
        label: 'Direct Dialogue',
        detail: 'Approach any housemate and press F (or click them) to open talk options.',
      },
      {
        icon: '🤝',
        label: 'Secret Alliances',
        detail: 'Pitch pacts to protect each other during Friday nominations.',
      },
      {
        icon: '🍲',
        label: 'Share Food',
        detail: 'Cook Jollof and share meals to turn rivals into loyal friends.',
      },
      {
        icon: '🎭',
        label: 'Emote Bar',
        detail: 'Click Wave, Dance, Hype, or Hug to trigger live reactions nearby.',
      },
    ],
    tip: 'Housemates with affinity 40+ become trusted allies who will never nominate you.',
  },
  {
    id: 'stations',
    stepNumber: 4,
    title: '7 Rooms & 10 Interactive Stations',
    tagline: 'Live, Chill & Work in Biggie’s Mansion',
    emoji: '🏠',
    badge: 'World',
    themeColor: '#10b981',
    description:
      'The house features 7 unique rooms packed with interactive 3D stations for daily actions.',
    features: [
      {
        icon: '🍳',
        label: 'Kitchen',
        detail: 'Cook legendary Nigerian Jollof rice or grab midnight chops.',
      },
      {
        icon: '🛋️',
        label: 'Lounge',
        detail: 'Play competitive Ludo and watch the living room television.',
      },
      {
        icon: '🛏️',
        label: 'Bedroom',
        detail: 'Take a power nap to recharge energy and practice mirror slay.',
      },
      {
        icon: '🏊',
        label: 'Garden & Gym',
        detail: 'Chill at the pool patio and lift weights for fitness.',
      },
    ],
    tip: 'Head-of-House gains private access to the luxury HoH Suite on the top wing.',
  },
  {
    id: 'diary',
    stepNumber: 5,
    title: "Biggie's Diary Room",
    tagline: 'Confess Directly to Big Brother',
    emoji: '🎙️',
    badge: 'Confession',
    themeColor: '#ef4444',
    description:
      'The iconic Diary Room is where reality happens. Step inside and answer Biggie’s probing questions.',
    features: [
      {
        icon: '🪑',
        label: 'The Hot Seat',
        detail: 'Walk into the Diary Room and click the golden velvet chair.',
      },
      {
        icon: '🗣️',
        label: 'Deep Confessions',
        detail: 'Choose how to answer Biggie: boast, spill tea, or show vulnerability.',
      },
      {
        icon: '📣',
        label: 'Viewer Viral Clout',
        detail: 'Sensational diary sessions create viral tweets and skyrocket fan votes.',
      },
    ],
    tip: 'Big Brother hears everything. Be bold and genuine to captivate the voting public!',
  },
  {
    id: 'week_cycle',
    stepNumber: 6,
    title: 'The Weekly Eviction Loop',
    tagline: 'Survive Every Sunday to Reach the Finale',
    emoji: '📅',
    badge: 'Schedule',
    themeColor: '#f97316',
    description:
      'Every week follows the authentic Big Brother Naija calendar. Master each phase to survive.',
    features: [
      {
        icon: '👑',
        label: 'Monday (HoH)',
        detail: 'Compete in the Arena challenge for immunity and HoH powers.',
      },
      {
        icon: '📋',
        label: 'Tue–Thu (Daily)',
        detail: 'Spend daily action points to build clout and bond with housemates.',
      },
      {
        icon: '🗳️',
        label: 'Friday (Nominations)',
        detail: 'Enter the Diary Room to nominate two rivals for eviction.',
      },
      {
        icon: '🪩',
        label: 'Saturday (Party)',
        detail: 'Enjoy the Saturday night party with music and dancing.',
      },
      {
        icon: '🚪',
        label: 'Sunday (Live Eviction)',
        detail: 'The housemate with the lowest fan clout is evicted live!',
      },
    ],
    tip: 'Winning Head of House on Monday gives you 100% immunity from eviction for the week!',
  },
];
