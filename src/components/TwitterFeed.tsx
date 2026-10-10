import type { GameState } from '../types';

export function TwitterFeed({ state }: { state: GameState }) {
  return (
    <div className="space-y-2">
      {state.tweets.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-ink-soft ring-1 ring-black/5">
          The timeline is quiet. Make some noise and the fans will react.
        </p>
      )}
      {state.tweets.map((t) => (
        <div key={t.id} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-white">
              {t.kind === 'hater' ? '😤' : t.kind === 'neutral' ? '🫥' : '🔥'}
            </span>
            <span className="text-xs font-bold">{t.handle}</span>
            <span className="ml-auto text-[10px] text-ink-soft">{t.time}</span>
          </div>
          <p className="mt-1.5 text-sm leading-snug">{t.text}</p>
          <div className="mt-1.5 text-[10px] font-semibold text-ink-soft">♥ {t.likes.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
