// ---------------------------------------------------------------------------
// Core domain types for Biggie's House (a Big Brother Naija life sim).
// ---------------------------------------------------------------------------

export type Gender = 'M' | 'F';

export type Profession =
  | 'Tech Sis / Tech Bro'
  | 'Instagram Influencer'
  | 'Musician & Vibe Machine'
  | 'Fashion Designer'
  | 'Fitness Coach'
  | 'Corporate Lawyer'
  | 'Culinary Chef'
  | 'Real Estate Hustler'
  | 'Nurse'
  | 'Event Planner';

export type Trait =
  | 'Pepper Dem' // high drama, claps back, viral moments
  | 'Strategic Schemer' // reads the house, builds voting blocs
  | 'Kitchen General' // controls food and rations
  | 'Lover Boy / Girl' // romance magnet, ships with everyone
  | 'Peace Maker' // diffuses fights, liked but low clout
  | 'Clout Chaser' // does anything for camera time
  | 'Gentle Giant' // strong in arena games, cool head
  | 'Crying Specialist' // diary-room tears, fan sympathy;

export type Room =
  | 'Lounge'
  | 'Kitchen'
  | 'Garden'
  | 'Bedroom'
  | 'HoH Suite'
  | 'Diary Room'
  | 'Arena';

export type HousemateStatus = 'active' | 'nominated' | 'evicted' | 'disqualified';

export type Hairstyle = 'afro' | 'lowcut' | 'curls' | 'braids' | 'locs' | 'bald';

export interface Housemate {
  id: string;
  name: string;
  nickname: string;
  gender: Gender;
  age: number;
  stateOfOrigin: string;
  profession: Profession;
  trait: Trait;
  avatar: string; // emoji
  accentColor: string; // outfit colour (hex)
  skinTone?: string; // hex skin tone
  hairstyle?: Hairstyle;
  bio: string;

  // Dynamic stats (0–100)
  energy: number;
  sanity: number;
  hunger: number;
  houseStanding: number; // how much the house respects you

  // Show metrics
  fanbaseClout: number; // votes / buzz points
  bbCoins: number; // luxury currency
  strikes: number; // 3 = disqualified

  // Status
  status: HousemateStatus;
  isHoH: boolean;
  isImmune: boolean;
  isNominated: boolean;
  isHuman?: boolean;
  currentRoom: Room;

  // Relationships (id -> affinity -100..100)
  relationships: Record<string, number>;
}

export interface Tweet {
  id: string;
  handle: string;
  text: string;
  likes: number;
  time: string;
  kind: 'fan' | 'hater' | 'neutral';
}

export type LogKind = 'general' | 'drama' | 'romance' | 'game' | 'eviction' | 'system';

export interface LogEntry {
  id: string;
  week: number;
  day: number;
  text: string;
  kind: LogKind;
}

export type Phase =
  | 'creation' // character creation
  | 'hoh' // Monday HoH challenge
  | 'daily' // Tuesday–Thursday free actions
  | 'nominations' // Friday nominations
  | 'party' // Saturday night party
  | 'eviction' // Sunday live eviction
  | 'finale' // final 2 vote
  | 'gameover';

export interface GameOver {
  won: boolean;
  reason: string;
}

export interface GameState {
  week: number;
  day: number; // 1..7
  phase: Phase;
  player: Housemate;
  housemates: Housemate[]; // AI housemates only (player kept separate)
  tweets: Tweet[];
  log: LogEntry[];
  actionsLeft: number; // actions remaining today
  nominees: string[]; // ids facing eviction this week
  evictedId: string | null; // last evicted housemate id
  gameOver: GameOver | null;
  phaseDone: boolean; // whether the current phase's required action is complete
  onboardingDone?: boolean; // false until the player dismisses the welcome screen
}

export const MAX_ACTIONS_PER_DAY = 3;
export const WEEK_DAYS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const GRAND_PRIZE = 100_000_000; // ₦100M

export interface CreationConfig {
  name: string;
  nickname: string;
  gender: Gender;
  age: number;
  stateOfOrigin: string;
  profession: Profession;
  trait: Trait;
  avatar: string;
  accentColor: string;
  skinTone: string;
  hairstyle: Hairstyle;
}

export interface SavedPlayerState {
  fanbaseClout: number;
  bbCoins: number;
  strikes: number;
  energy: number;
  sanity: number;
  hunger: number;
  houseStanding: number;
  relationships: Record<string, number>;
}
