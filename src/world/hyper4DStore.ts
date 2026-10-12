import { create } from 'zustand';
import { sound } from '../engine/sound';
import { useEconomyStore } from './economyStore';

export type PolytopeType = 'tesseract' | '16cell' | '24cell' | 'clifford_torus';
export type HyperColorTheme = 'neon_cyan' | 'imperial_gold' | 'dark_matter' | 'matrix_emerald';

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  vertex: string;
  bgGradient: string;
}

export const HYPER_THEMES: Record<HyperColorTheme, ThemeColors> = {
  neon_cyan: {
    primary: '#06b6d4',
    secondary: '#3b82f6',
    glow: '#0891b2',
    vertex: '#67e8f9',
    bgGradient: 'from-cyan-950 via-slate-950 to-blue-950',
  },
  imperial_gold: {
    primary: '#eab308',
    secondary: '#f59e0b',
    glow: '#d97706',
    vertex: '#fef08a',
    bgGradient: 'from-amber-950 via-slate-950 to-yellow-950',
  },
  dark_matter: {
    primary: '#a855f7',
    secondary: '#ec4899',
    glow: '#9333ea',
    vertex: '#f472b6',
    bgGradient: 'from-purple-950 via-slate-950 to-pink-950',
  },
  matrix_emerald: {
    primary: '#10b981',
    secondary: '#059669',
    glow: '#047857',
    vertex: '#6ee7b7',
    bgGradient: 'from-emerald-950 via-slate-950 to-teal-950',
  },
};

interface Hyper4DState {
  isOpen: boolean;
  activePolytope: PolytopeType;
  speedXW: number;
  speedYW: number;
  speedZW: number;
  cameraDistance4D: number;
  colorTheme: HyperColorTheme;
  isEquippedOnPlayer: boolean;
  sliceW: number;
  isCashCannonActive: boolean;

  // Actions
  open4D: () => void;
  close4D: () => void;
  setPolytope: (type: PolytopeType) => void;
  setSpeedXW: (val: number) => void;
  setSpeedYW: (val: number) => void;
  setSpeedZW: (val: number) => void;
  setCameraDistance4D: (val: number) => void;
  setColorTheme: (theme: HyperColorTheme) => void;
  setSliceW: (val: number) => void;
  toggleEquipAura: () => void;
  triggerCashCannon: () => void;
  reset4D: () => void;
}

export const useHyper4DStore = create<Hyper4DState>((set, get) => ({
  isOpen: false,
  activePolytope: 'tesseract',
  speedXW: 0.8,
  speedYW: 0.6,
  speedZW: 0.4,
  cameraDistance4D: 2.6,
  colorTheme: 'neon_cyan',
  isEquippedOnPlayer: true, // Default equipped for instant visual wow factor!
  sliceW: 0.0,
  isCashCannonActive: false,

  open4D: () => {
    set({ isOpen: true });
    sound.playRewardChime();
  },

  close4D: () => set({ isOpen: false }),

  setPolytope: (type: PolytopeType) => {
    set({ activePolytope: type });
    sound.playRewardChime();
  },

  setSpeedXW: (speedXW: number) => set({ speedXW }),
  setSpeedYW: (speedYW: number) => set({ speedYW }),
  setSpeedZW: (speedZW: number) => set({ speedZW }),
  setCameraDistance4D: (cameraDistance4D: number) => set({ cameraDistance4D }),
  setColorTheme: (colorTheme: HyperColorTheme) => set({ colorTheme }),
  setSliceW: (sliceW: number) => set({ sliceW }),

  toggleEquipAura: () => {
    const next = !get().isEquippedOnPlayer;
    set({ isEquippedOnPlayer: next });
    sound.playRewardChime();
  },

  triggerCashCannon: () => {
    // Spends small token cash to spray physical Naira banknotes with physics
    const econ = useEconomyStore.getState();
    const sprayCost = 1000;
    if (econ.walletBalance >= sprayCost) {
      econ.spend(sprayCost, 'Saturday Night Cash Cannon Spray 💸');
    }
    set({ isCashCannonActive: true });
    sound.playRewardChime();
    setTimeout(() => {
      set({ isCashCannonActive: false });
    }, 4000);
  },

  reset4D: () => {
    set({
      isOpen: false,
      activePolytope: 'tesseract',
      speedXW: 0.8,
      speedYW: 0.6,
      speedZW: 0.4,
      cameraDistance4D: 2.6,
      colorTheme: 'neon_cyan',
      isEquippedOnPlayer: true,
      sliceW: 0.0,
      isCashCannonActive: false,
    });
  },
}));
