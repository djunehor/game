import { useEffect } from 'react';
import { useTour, TOUR_STOPS } from '../three/tourStore';
import { useGame } from '../store';
import { sound } from '../engine/sound';
import { resetInput } from '../three/input';

export function GuidedTourModal({
  onClose,
  isStandalone = false,
}: {
  onClose?: () => void;
  isStandalone?: boolean;
}) {
  const isTourActive = useTour((s) => s.isActive) || useTour.getState().isActive;
  const tourIndex = useTour((s) => s.currentStopIndex);
  const currentStopIndex = typeof tourIndex === 'number' ? tourIndex : useTour.getState().currentStopIndex;
  const nextStop = useTour((s) => s.nextStop);
  const prevStop = useTour((s) => s.prevStop);
  const endTour = useTour((s) => s.endTour);
  const completeOnboarding = useGame((s) => s.completeOnboarding);

  const stop = TOUR_STOPS[currentStopIndex] ?? TOUR_STOPS[0];
  const isFirst = currentStopIndex === 0;
  const isLast = currentStopIndex === TOUR_STOPS.length - 1;

  useEffect(() => {
    resetInput();
  }, []);

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      sound.playTalkBlip();
      nextStop();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      sound.playTalkBlip();
      prevStop();
    }
  };

  const handleFinish = () => {
    sound.playRewardChime();
    endTour();
    if (!isStandalone) {
      completeOnboarding();
    }
    if (onClose) {
      onClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStopIndex, isLast]);

  // If tour is not active, don't render anything
  if (!isTourActive) return null;

  return (
    /* Pure 3D Game Broadcast Subtitles: Zero modal dialogs, zero cards. Unobtrusive cinematic cutscene subtitles */
    <aside aria-label="House tour narration" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center px-4 text-center select-none">
      {/* Broadcast Location Tag */}
      <div
        className="inline-flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md"
        style={{ borderBottom: `2px solid ${stop.color}` }}
      >
        <span className="flex items-center gap-1.5 text-red-400">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE 3D TOUR
        </span>
        <span className="text-white/40">·</span>
        <span>{stop.emoji} {stop.name}</span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80 font-mono">
          {`ROOM ${currentStopIndex + 1}/${TOUR_STOPS.length}`}
        </span>
      </div>

      {/* Subtitle Dialogue Bar */}
      <div className="mt-2.5 max-w-2xl rounded-2xl bg-black/70 px-5 py-2.5 text-sm sm:text-base leading-relaxed text-white shadow-2xl backdrop-blur-md">
        <span className="font-bold text-amber-400">Big Brother: </span>
        <span className="text-white/95">“{stop.narration}”</span>
      </div>

      {/* Minimalist Controls */}
      <div className="mt-2.5 flex items-center gap-3 text-xs">
        <button
          onClick={handlePrev}
          disabled={isFirst}
          className={`pointer-events-auto rounded-lg bg-black/60 px-3 py-1.5 font-bold text-white/80 hover:text-white hover:bg-black/80 transition cursor-pointer backdrop-blur-sm ${
            isFirst ? 'opacity-25 cursor-not-allowed pointer-events-none' : ''
          }`}
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1.5 font-bold text-black transition cursor-pointer shadow-lg backdrop-blur-sm"
        >
          {isLast ? 'Enter the House 🚀' : 'Next Room →'} <kbd className="ml-1 text-[10px] opacity-75 font-mono">[SPACE]</kbd>
        </button>
        <button
          onClick={handleFinish}
          className="pointer-events-auto rounded-lg bg-black/60 px-2.5 py-1.5 font-semibold text-white/60 hover:text-white hover:bg-black/80 transition cursor-pointer backdrop-blur-sm"
        >
          Skip Tour <kbd className="ml-0.5 text-[9px] opacity-75 font-mono">[ESC]</kbd>
        </button>
      </div>
    </aside>
  );
}

export const TourBroadcastOverlay = GuidedTourModal;
