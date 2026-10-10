import { useRef } from 'react';
import { input } from '../three/input';

// On-screen virtual joystick for touch devices. Rendered only when the device
// has touch input (see App.tsx).
export function VirtualJoystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  const radius = 52;

  const handleMove = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    if (knob.current) {
      knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    input.moveVector.x = dx / radius;
    input.moveVector.y = dy / radius;
    input.target = null;
  };

  const reset = () => {
    input.moveVector.x = 0;
    input.moveVector.y = 0;
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)';
  };

  return (
    <div
      className="absolute bottom-24 left-6 z-30 touch-none select-none"
      ref={base}
      onPointerDown={(e) => {
        activeId.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        handleMove(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current === e.pointerId) handleMove(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activeId.current === e.pointerId) {
          activeId.current = null;
          reset();
        }
      }}
      onPointerCancel={reset}
    >
      <div className="relative h-32 w-32 rounded-full border-2 border-white/40 bg-white/10 backdrop-blur">
        <div
          ref={knob}
          className="absolute top-1/2 left-1/2 -mt-7 -ml-7 h-14 w-14 rounded-full bg-white/80 shadow-xl"
          style={{ transform: 'translate(0px, 0px)' }}
        />
      </div>
    </div>
  );
}
