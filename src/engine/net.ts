import { create } from 'zustand';

// Real-time multiplayer presence shared between the WebSocket client (which
// updates it) and the React/3D UI (which renders it).

export interface RemotePlayer {
  id: string;
  nickname: string;
  avatar: string;
  accentColor: string;
  skinTone: string;
  hairstyle: string;
  profession: string;
  trait: string;
  x: number;
  z: number;
  room: string;
}

export interface NetChat {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
}

export interface HouseSharedState {
  week: number;
  day: number;
  phase: string;
  phaseDone: boolean;
  hohId: string | null;
  nominees: string[];
  evictedId: string | null;
  finaleWinnerId: string | null;
  gameOver: boolean;
}

interface NetState {
  connected: boolean;
  houseId: string | null;
  houseName: string | null;
  selfId: string | null;
  liveCount: number;
  aiCount: number;
  remotePlayers: Record<string, RemotePlayer>;
  chat: NetChat[];
  houseState: HouseSharedState | null;
}

export const useNet = create<NetState>(() => ({
  connected: false,
  houseId: null,
  houseName: null,
  selfId: null,
  liveCount: 0,
  aiCount: 0,
  remotePlayers: {},
  chat: [],
  houseState: null,
}));
