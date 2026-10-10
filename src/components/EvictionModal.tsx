import { useEffect, useState } from 'react';
import type { GameState } from '../types';
import { useGame } from '../store';
import { Modal, ModalHeader } from './Modal';

type RevealStep = 'idle' | 'counting' | 'revealed';

export function EvictionModal({ state }: { state: GameState }) {
  const revealEviction = useGame((s) => s.revealEviction);
  const nextDay = useGame((s) => s.nextDay);

  const [step, setStep] = useState<RevealStep>('idle');

  const evictedHousemate = state.housemates.find((h) => h.id === state.evictedId);
  const playerEvicted = state.gameOver && state.player.status === 'evicted';

  const nominees = [
    ...(state.player.isNominated && state.player.status === 'active'
      ? [{ id: state.player.id, nickname: state.player.nickname, avatar: state.player.avatar, accentColor: state.player.accentColor, isPlayer: true }]
      : []),
    ...state.housemates
      .filter((h) => h.isNominated && h.status === 'active')
      .map((h) => ({ id: h.id, nickname: h.nickname, avatar: h.avatar, accentColor: h.accentColor, isPlayer: false })),
  ];

  const handleReveal = () => {
    setStep('counting');
    revealEviction();
  };

  // Suspense pause before showing the result
  useEffect(() => {
    if (step === 'counting') {
      const t = setTimeout(() => setStep('revealed'), 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <Modal>
      <ModalHeader emoji="🚪" title="Live Eviction" subtitle="Ebuka is about to shake the table." />

      <div className="px-6 py-5">
        {step === 'idle' && (
          <>
            <p className="mb-3 text-sm text-ink-soft">The housemates facing possible eviction:</p>
            <div className="mb-5 space-y-2">
              {nominees.map((n) => (
                <div key={n.id} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl text-xl" style={{ background: n.accentColor }}>
                    {n.avatar}
                  </span>
                  <span className="text-sm font-bold">{n.nickname}</span>
                  {n.isPlayer && (
                    <span className="ml-auto rounded-full bg-bbn px-2 py-0.5 text-[10px] font-black text-white">YOU</span>
                  )}
                </div>
              ))}
              {nominees.length === 0 && (
                <p className="rounded-2xl bg-mist p-3 text-sm text-ink-soft">You survived nominations this week. 🙌</p>
              )}
            </div>
            <button
              onClick={handleReveal}
              className="w-full rounded-2xl bg-bbn py-3.5 text-sm font-bold text-white transition hover:bg-bbn-deep"
            >
              Reveal who goes home 😱
            </button>
          </>
        )}

        {step === 'counting' && (
          <div className="flex flex-col items-center py-10">
            <div className="animate-shake text-6xl">🗳️</div>
            <p className="mt-4 font-display text-xl font-semibold">Counting the votes…</p>
            <p className="mt-1 text-sm text-ink-soft">Ebuka is staring into the camera. Silence in the house.</p>
            <div className="mt-5 flex gap-1.5">
              <span className="size-2 animate-pulse-dot rounded-full bg-bbn" style={{ animationDelay: '0ms' }} />
              <span className="size-2 animate-pulse-dot rounded-full bg-bbn" style={{ animationDelay: '200ms' }} />
              <span className="size-2 animate-pulse-dot rounded-full bg-bbn" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}

        {step === 'revealed' && (
          <div className="text-center">
            <div className="rounded-3xl bg-mist p-6">
              <div className="text-6xl">{playerEvicted ? '😭' : evictedHousemate?.avatar ?? '🚪'}</div>
              <p className="mt-3 font-display text-2xl font-semibold">
                {playerEvicted
                  ? `${state.player.nickname}, you have been evicted.`
                  : `${evictedHousemate?.nickname ?? 'A housemate'} has been evicted.`}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {playerEvicted
                  ? 'Biggie thanks you for your time in the house.'
                  : 'The house breathes again… until next week.'}
              </p>
            </div>

            {!playerEvicted && (
              <button
                onClick={nextDay}
                className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black"
              >
                Continue to next week →
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
