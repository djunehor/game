import { useHohChallenge } from '../three/hohStore';

export function HohChallengeOverlay() {
  const { active, timeLeft, collected, total, finished } = useHohChallenge();

  if (!active) return null;

  const pct = Math.round((collected / total) * 100);
  const urgent = timeLeft <= 10 && !finished;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-ink/85 p-4 text-center text-white shadow-2xl backdrop-blur">
        <div className="font-display text-xl font-semibold">🏆 Head of House Challenge</div>
        {finished ? (
          <div className="mt-1 text-sm font-bold text-gold">
            {collected >= total ? 'All rings collected! Amazing!' : "Time's up!"}
          </div>
        ) : (
          <p className="mt-1 text-xs text-white/70">
            Run to the Arena and collect the golden rings before time runs out!
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          {/* Progress bar */}
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums">
            {collected}/{total}
          </span>
        </div>

        <div
          className={`mt-2 font-display text-2xl font-bold tabular-nums ${
            urgent ? 'animate-pulse text-bbn' : 'text-white'
          }`}
        >
          ⏱ {timeLeft}s
        </div>
      </div>
    </div>
  );
}
