import { useState } from 'react';
import type { GameState } from '../types';
import { useGame } from '../store';
import { Modal, ModalHeader } from './Modal';

export function NominationsModal({ state }: { state: GameState }) {
  const submitNominations = useGame((s) => s.submitNominations);
  const [picks, setPicks] = useState<string[]>([]);

  const eligible = state.housemates.filter((h) => h.status === 'active' && !h.isHoH && !h.isImmune);
  const requiredCount = Math.min(2, eligible.length);

  const toggle = (id: string) => {
    setPicks((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= requiredCount) return prev;
      return [...prev, id];
    });
  };

  return (
    <Modal>
      <ModalHeader
        emoji="🎯"
        title="Nominations"
        subtitle="Pick two housemates you want to face eviction. Choose wisely — they'll remember."
      />
      <div className="px-6 py-5">
        <div className="mb-3 text-xs font-bold text-ink-soft uppercase">
          {picks.length}/{requiredCount} selected
        </div>
        <div className="space-y-2">
          {eligible.map((h) => {
            const selected = picks.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggle(h.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  selected ? 'border-bbn bg-bbn/5' : 'border-black/10 bg-white hover:border-black/25'
                }`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: h.accentColor }}>
                  {h.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{h.nickname}</div>
                  <div className="truncate text-[11px] text-ink-soft">{h.trait}</div>
                </div>
                {selected && <span className="text-lg">🎯</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => submitNominations(picks)}
          disabled={picks.length !== requiredCount}
          className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Lock in nominations
        </button>
      </div>
    </Modal>
  );
}
