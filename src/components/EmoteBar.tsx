import { useState } from 'react';
import { useEmote, EmoteType } from '../three/emoteStore';
import { sound } from '../engine/sound';
import { useGame } from '../store';

const EMOTES: { type: EmoteType; emoji: string; label: string }[] = [
  { type: 'wave', emoji: '👋', label: 'Wave' },
  { type: 'hype', emoji: '👏', label: 'Hype' },
  { type: 'dance', emoji: '💃', label: 'Dance' },
  { type: 'clapback', emoji: '🤬', label: 'Clapback' },
  { type: 'hug', emoji: '🤗', label: 'Hug' },
];

export function EmoteBar({ defaultOpen = true }: { defaultOpen?: boolean } = {}) {
  const triggerEmote = useEmote((s) => s.triggerEmote);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleEmote = (type: EmoteType, emoji: string, label: string) => {
    sound.playEmoteSound(type);
    triggerEmote(type);
    setFeedback(`${emoji} ${label}!`);
    setTimeout(() => setFeedback(null), 2000);

    // Apply minor player effect
    const state = useGame.getState().state;
    if (state && !state.gameOver) {
      if (type === 'dance') {
        const nextSanity = Math.min(100, state.player.sanity + 2);
        useGame.setState({
          state: { ...state, player: { ...state.player, sanity: nextSanity } },
        });
      }
    }
  };

  return (
    <div className="absolute bottom-20 left-4 z-20 flex flex-col items-start gap-1 sm:bottom-24 select-none">
      {feedback && (
        <div className="rounded-full bg-gold px-3 py-1 text-xs font-black text-ink shadow-lg animate-pop-in">
          {feedback}
        </div>
      )}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/80 hover:bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-white/10"
          title="Open Avatar Reactions / Emotes"
        >
          <span>🎭</span>
          <span>Emotes</span>
        </button>
      ) : (
        <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-slate-950/90 p-1.5 shadow-2xl backdrop-blur-md animate-pop-in">
          {EMOTES.map((e) => (
            <button
              key={e.type}
              type="button"
              onClick={() => handleEmote(e.type, e.emoji, e.label)}
              className="flex flex-col items-center justify-center rounded-xl px-2 py-1 transition hover:bg-white/15 active:scale-90 cursor-pointer"
              title={e.label}
            >
              <span className="text-lg leading-none">{e.emoji}</span>
              <span className="text-[9px] font-extrabold text-white/70">{e.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-1 grid size-6 place-items-center rounded-lg text-xs font-bold text-white/50 hover:bg-white/15 hover:text-white cursor-pointer"
            title="Minimize Emotes"
            aria-label="Close Emotes"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
