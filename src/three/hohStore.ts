import { create } from 'zustand';

// Progress of the 3D Head-of-House arena challenge, shared between the 3D
// scene (which updates it frame-by-frame) and the DOM overlay (which renders it).
export interface HohChallengeState {
  active: boolean;
  timeLeft: number;
  collected: number;
  total: number;
  finished: boolean;
}

export const useHohChallenge = create<HohChallengeState>(() => ({
  active: false,
  timeLeft: 0,
  collected: 0,
  total: 6,
  finished: false,
}));
