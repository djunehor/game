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
  x: -16,
  z: 4,
};

const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyQ', 'KeyE', 'KeyF',
  'ShiftLeft', 'ShiftRight',
]);

let attached = false;

export function attachInput() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  window.addEventListener('keydown', (e) => {
    if (TRACKED.has(e.code)) {
      input.keys[e.code] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault();
      input.target = null; // keyboard takes over from click-to-move
    }
  });

  window.addEventListener('keyup', (e) => {
    if (TRACKED.has(e.code)) input.keys[e.code] = false;
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
