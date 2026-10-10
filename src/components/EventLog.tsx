import type { GameState, LogKind } from '../types';

const KIND_STYLE: Record<LogKind, { dot: string; label: string }> = {
  general: { dot: 'bg-slate-400', label: 'Life' },
  drama: { dot: 'bg-bbn', label: 'Drama' },
  romance: { dot: 'bg-pink-500', label: 'Romance' },
  game: { dot: 'bg-lawn', label: 'Game' },
  eviction: { dot: 'bg-ink', label: 'Eviction' },
  system: { dot: 'bg-gold', label: 'Biggie' },
};

export function EventLog({ state }: { state: GameState }) {
  const entries = [...state.log].reverse();
  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const style = KIND_STYLE[e.kind] ?? KIND_STYLE.general;
        return (
          <div key={e.id} className="flex gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">
                {style.label} · W{e.week} D{e.day}
              </div>
              <p className="mt-0.5 text-sm leading-snug">{e.text}</p>
            </div>
          </div>
        );
      })}
      {entries.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-ink-soft ring-1 ring-black/5">Nothing yet.</p>
      )}
    </div>
  );
}
