// Shared types for the server + Cloudflare Worker.

export interface GameMember {
  id: string;
  name?: string;
  nickname: string;
  avatar: string;
  accentColor: string;
  skinTone: string;
  hairstyle: string;
  profession: string;
  trait: string;
  gender: string;
  age: number;
  stateOfOrigin: string;
  fanbaseClout: number;
  bbCoins: number;
  strikes: number;
  status: string;
  isHoH: boolean;
  isImmune: boolean;
  isNominated: boolean;
  isHuman: boolean;
  currentRoom: string;
  x?: number;
  z?: number;
  energy?: number;
  sanity?: number;
  hunger?: number;
  houseStanding?: number;
  relationships?: Record<string, number>;
  bio?: string;
  __ws?: unknown;
}

export interface HouseState {
  week: number;
  day: number;
  phase: string;
  phaseDone: boolean;
  nominees: string[];
  evictedId: string | null;
  hohId: string | null;
  finaleWinnerId: string | null;
  gameOver: boolean;
  scores: Record<string, number>;
  votes: Record<string, string[]>;
  ready: Set<string>;
  log: unknown[];
  tweets: unknown[];
}

export interface House {
  id: string;
  name: string;
  seed: number;
  members: Map<string, GameMember>;
  aiMembers: GameMember[];
  state: HouseState;
}

export interface PlayerState {
  fanbaseClout: number;
  bbCoins: number;
  strikes: number;
  energy: number;
  sanity: number;
  hunger: number;
  houseStanding: number;
  relationships: Record<string, number>;
}

export interface Account {
  username: string;
  email: string | null;
  salt: string;
  hash: string;
  playerId: string;
  profile: unknown;
  playerState: PlayerState;
  token: string;
  createdAt: number;
}

export type Accounts = Record<string, Account>;
export type Tokens = Record<string, string>;
