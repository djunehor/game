// Frame-by-frame input state. No React re-renders involved.

export const input = {
  keys: {} as Record<string, boolean>,
};

const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyQ', 'KeyE', 'KeyV',
  'ShiftLeft', 'ShiftRight',
]);

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el.isContentEditable);
}

let attached = false;

export function attachInput(): void {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  window.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    if (TRACKED.has(e.code)) {
      input.keys[e.code] = true;
      if (e.code.startsWith('Arrow')) e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (TRACKED.has(e.code)) input.keys[e.code] = false;
  });

  window.addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetInput();
  });
}

export function resetInput(): void {
  input.keys = {};
}
