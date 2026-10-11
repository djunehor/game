// Mutable, frame-by-frame input state (no React re-renders involved).
export interface TargetPoint {
  x: number;
  z: number;
}

export const input = {
  keys: {} as Record<string, boolean>,
  target: null as TargetPoint | null,
  moveVector: { x: 0, y: 0 } as { x: number; y: number },
};

// Real-time world position of player for proximity detection
export const playerWorldPos = {
  x: -10,
  z: 8,
};

import { useCamera } from './cameraStore';
import { useEconomyStore } from '../world/economyStore';

const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyQ', 'KeyE', 'KeyF', 'KeyV',
  'ShiftLeft', 'ShiftRight',
]);

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el.isContentEditable);
}

let attached = false;

export function attachInput() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  window.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) {
      console.log('[input] Ignored keydown from typing element:', (e.target as HTMLElement).tagName, e.code);
      return;
    }
    if (e.code === 'KeyV') {
      useCamera.getState().toggleMode();
      return;
    }
    if (e.code === 'KeyB') {
      const econ = useEconomyStore.getState();
      if (econ.activeShopId) econ.closeShop();
      else econ.openShop('supermarket');
      return;
    }
    if (TRACKED.has(e.code)) {
      input.keys[e.code] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault();
      input.target = null; // keyboard takes over from click-to-move
    }
  });

  window.addEventListener('keyup', (e) => {
    if (isTypingTarget(e.target)) {
      console.log('[input] Ignored keyup from typing element:', (e.target as HTMLElement).tagName, e.code);
      if (TRACKED.has(e.code)) input.keys[e.code] = false;
      return;
    }
    if (TRACKED.has(e.code)) input.keys[e.code] = false;
  });

  window.addEventListener('focusin', (e) => {
    if (isTypingTarget(e.target)) {
      console.log('[input] focusin on input element - clearing movement keys');
      resetInput();
    }
  });

  window.addEventListener('blur', () => {
    resetInput();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetInput();
    }
  });
}

export function resetInput() {
  console.log('[input] resetInput called - clearing all keys and target');
  input.keys = {};
  input.target = null;
  input.moveVector.x = 0;
  input.moveVector.y = 0;
}

export function setTarget(x: number, z: number) {
  console.log('[input] setTarget called:', { x, z });
  input.target = { x, z };
}
