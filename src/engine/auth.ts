import { create } from 'zustand';
import type { CreationConfig, SavedPlayerState } from '../types';
import { multiplayer } from './multiplayer';

const AUTH_KEY = 'biggie-house-auth';

interface Persisted {
  token: string | null;
  playerId: string | null;
  username: string | null;
  profile: CreationConfig | null;
  playerState: SavedPlayerState | null;
}

interface AuthState extends Persisted {
  busy: boolean;
  error: string | null;
  signup: (username: string, password: string, email?: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  setProfile: (profile: CreationConfig) => void;
  logout: () => void;
  clearError: () => void;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { token: null, playerId: null, username: null, profile: null, playerState: null };
}

function persist(s: Persisted) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  ...load(),
  busy: false,
  error: null,

  signup: async (username, password, email) => {
    set({ busy: true, error: null });
    try {
      const res = await multiplayer.signup(username, password, email);
      const next = { token: res.token, playerId: res.playerId, username: res.username, profile: res.profile ?? null, playerState: res.playerState ?? null };
      persist(next);
      set({ ...next, busy: false });
      return true;
    } catch (e: any) {
      set({ busy: false, error: e.message || 'Signup failed.' });
      return false;
    }
  },

  login: async (username, password) => {
    set({ busy: true, error: null });
    try {
      const res = await multiplayer.login(username, password);
      const next = { token: res.token, playerId: res.playerId, username: res.username, profile: res.profile ?? null, playerState: res.playerState ?? null };
      persist(next);
      set({ ...next, busy: false });
      return true;
    } catch (e: any) {
      set({ busy: false, error: e.message || 'Login failed.' });
      return false;
    }
  },

  setProfile: (profile) => {
    const next = { ...get(), profile };
    persist(next);
    set({ profile });
  },

  logout: () => {
    const cleared = { token: null, playerId: null, username: null, profile: null, playerState: null };
    persist(cleared);
    set({ ...cleared, busy: false, error: null });
    try {
      localStorage.removeItem('biggie-house-token');
    } catch {
      /* ignore */
    }
  },

  clearError: () => set({ error: null }),
}));
