import { create } from 'zustand';

export type CameraMode = 'human' | 'overhead';

interface CameraState {
  mode: CameraMode;
  toggleMode: () => void;
  setMode: (mode: CameraMode) => void;
}

export const useCamera = create<CameraState>((set) => ({
  // Default to the human-scale eye-level camera
  mode: 'human',
  toggleMode: () =>
    set((s) => ({ mode: s.mode === 'human' ? 'overhead' : 'human' })),
  setMode: (mode) => set({ mode }),
}));
