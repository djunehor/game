import type { GameState, Housemate } from '../types';

export function HousemateList({
  state,
  onTalk,
}: {
  state: GameState;
  onTalk?: (h: Housemate) => void;
}) {
  const { player, housemates } = state;
  const sorted = [...housemates].sort((a, b) => {
    if (a.status !== b.status) {
      const order = { active: 0, nominated: 1, evicted: 2, disqualified: 3 } as const;
      return order[a.status] - order[b.status];
    }
    return b.fanbaseClout - a.fanbaseClout;
  });

  return (
    <div className="space-y-2">
      {sorted.map((h) => {
        const rel = player.relationships[h.id] ?? 0;
        const relLabel = rel > 25 ? 'Ally' : rel < -10 ? 'Rival' : 'Neutral';
        const relColor = rel > 25 ? 'text-lawn' : rel < -10 ? 'text-bbn' : 'text-ink-soft';
        const isActive = h.status === 'active';

        return (
          <div
            key={h.id}
            className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 ${
              !isActive ? 'opacity-50' : ''
            }`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: h.accentColor }}>
              {h.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold text-ink">{h.nickname}</span>
                {h.isHoH && <span title="Head of House">👑</span>}
                {h.isNominated && isActive && <span className="text-xs">🎯</span>}
              </div>
              <div className="truncate text-[11px] text-ink-soft">
                {h.trait} · {h.profession}
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-xs font-bold tabular-nums text-ink">{h.fanbaseClout.toLocaleString()}</div>
                <div className={`text-[10px] font-semibold ${relColor}`}>
                  {isActive ? relLabel : h.status === 'evicted' ? 'Evicted' : 'DQ'}
                </div>
              </div>
              {isActive && onTalk && (
                <button
                  type="button"
                  onClick={() => onTalk(h)}
                  className="rounded-xl bg-bbn px-2.5 py-1.5 text-xs font-bold text-white shadow transition hover:bg-black active:scale-95 cursor-pointer"
                  title={`Talk to ${h.nickname}`}
                >
                  💬 Talk
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
