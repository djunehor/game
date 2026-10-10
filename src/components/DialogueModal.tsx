import { useState } from 'react';
import type { Housemate } from '../types';
import { DIALOGUE_OPTIONS, DialogueOption } from '../data/dialogue';
import { useGame } from '../store';
import { Modal, ModalHeader } from './Modal';
import { sound } from '../engine/sound';

export function DialogueModal({
  housemate,
  onClose,
}: {
  housemate: Housemate;
  onClose: () => void;
}) {
  const player = useGame((s) => s.state?.player);
  const interact = useGame((s) => s.interactWithHousemate);

  const [result, setResult] = useState<{
    playerReply: string;
    targetReply: string;
    option: DialogueOption;
  } | null>(null);

  if (!player) return null;

  const currentAffinity = player.relationships[housemate.id] ?? 0;
  const affinityLabel =
    currentAffinity >= 40
      ? 'Allies / Shipped ❤️'
      : currentAffinity >= 15
        ? 'Friendly 🤝'
        : currentAffinity <= -25
          ? 'Mortal Enemies ⚔️'
          : currentAffinity <= -10
            ? 'Tense / Rivals 🌶️'
            : 'Neutral 😐';

  const handleSelect = (option: DialogueOption) => {
    if (player.energy < (option.costEnergy ?? 10)) {
      sound.playBiggieBuzzer();
      return;
    }
    sound.playTalkBlip();
    const outcome = interact(housemate.id, option.id);
    if (outcome) {
      setResult({
        playerReply: outcome.playerReply,
        targetReply: outcome.targetReply,
        option,
      });
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        emoji={housemate.avatar}
        title={`Talk with ${housemate.nickname}`}
        subtitle={`${housemate.profession} · ${housemate.trait}`}
      />

      <div className="px-6 py-5">
        {/* Relationship Status Bar */}
        <div className="mb-5 rounded-2xl bg-mist p-3 text-xs">
          <div className="mb-1 flex justify-between font-bold text-ink-soft">
            <span>Relationship Standing</span>
            <span className="font-extrabold text-ink">{affinityLabel}</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-black/10">
            {/* Center zero line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/20" />
            <div
              className={`h-full transition-all duration-300 ${currentAffinity >= 0 ? 'bg-lawn' : 'bg-bbn'}`}
              style={{
                width: `${Math.abs(currentAffinity) / 2}%`,
                marginLeft: currentAffinity >= 0 ? '50%' : `${50 - Math.abs(currentAffinity) / 2}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-ink-soft">
            <span>-100 Rival</span>
            <span>0 Neutral</span>
            <span>+100 Bestie</span>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-bold text-bbn uppercase tracking-wider mb-1">
                You:
              </div>
              <p className="text-sm font-semibold text-ink leading-relaxed">
                {result.playerReply}
              </p>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 shadow-sm">
              <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-1">
                {housemate.nickname}:
              </div>
              <p className="text-sm italic font-medium text-ink leading-relaxed">
                {result.targetReply}
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Back to House 🏠
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-xs font-bold tracking-wider text-ink-soft uppercase mb-1">
              Choose your move:
            </div>
            {DIALOGUE_OPTIONS.map((opt) => {
              const hasEnergy = player.energy >= (opt.costEnergy ?? 10);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  disabled={!hasEnergy}
                  className="flex w-full items-center gap-3.5 rounded-2xl border-2 border-black/5 bg-white p-3.5 text-left transition hover:border-black/20 hover:bg-mist/50 disabled:opacity-40 disabled:hover:border-black/5"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold">{opt.label}</span>
                      <span className="text-[11px] font-bold text-ink-soft">
                        ⚡ {opt.costEnergy} energy
                      </span>
                    </div>
                    <div className="text-xs text-ink-soft">{opt.description}</div>
                  </div>
                </button>
              );
            })}

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-2xl border border-black/10 py-3 text-xs font-bold text-ink-soft transition hover:bg-mist"
            >
              Never mind, walk away
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
