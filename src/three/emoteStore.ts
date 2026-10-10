import { create } from 'zustand';

export type EmoteType = 'wave' | 'hype' | 'dance' | 'clapback' | 'hug';

interface EmoteStore {
  activeEmote: { type: EmoteType; timestamp: number } | null;
  triggerEmote: (type: EmoteType) => void;
}

export const useEmote = create<EmoteStore>((set) => ({
  activeEmote: null,
  triggerEmote: (type) => {
    set({ activeEmote: { type, timestamp: Date.now() } });
  },
}));
