import { useState, useEffect } from 'react';
import { DIARY_SESSIONS, DiaryOption } from '../data/diaryRoom';
import { useGame } from '../store';
import { sound } from '../engine/sound';
import { voice } from '../engine/voice';
import { Modal } from './Modal';
import { resetInput } from '../three/input';
import type { GameState, Housemate } from '../types';

export function DiaryRoomModal({
  onClose,
  player: propPlayer,
}: {
  onClose: () => void;
  player?: Housemate;
}) {
  useEffect(() => {
    resetInput();
    return () => {
      voice.stop();
    };
  }, []);

  const storePlayer = useGame((s) => s.state?.player);
  const player = propPlayer ?? storePlayer;

  const [sessionIndex, setSessionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<DiaryOption | null>(null);

  const currentSession = DIARY_SESSIONS[sessionIndex % DIARY_SESSIONS.length];

  useEffect(() => {
    if (currentSession?.question) {
      voice.speakBiggie(currentSession.question);
    }
  }, [sessionIndex, currentSession?.question]);

  if (!player) return null;

  const handleSelect = (option: DiaryOption) => {
    setSelectedOption(option);
    voice.speakBiggie(option.biggieReply);
    sound.playRewardChime();

    // Apply outcome to game state
    const current = useGame.getState().state;
    if (!current) return;

    const nextClout = player.fanbaseClout + option.effect.clout;
    const nextSanity = Math.max(0, Math.min(100, player.sanity + option.effect.sanity));
    const nextStanding = Math.max(0, Math.min(100, player.houseStanding + (option.effect.standing ?? 0)));

    const nextPlayer: Housemate = {
      ...player,
      fanbaseClout: nextClout,
      sanity: nextSanity,
      houseStanding: nextStanding,
    };

    const newLog = {
      id: Math.random().toString(36).slice(2, 9),
      week: current.week,
      day: current.day,
      text: `${player.nickname} had a deep Diary Room session with Biggie.`,
      kind: 'drama' as const,
    };

    const newTweet = option.tweet
      ? [
          {
            id: Math.random().toString(36).slice(2, 9),
            handle: option.tweet.handle,
            text: option.tweet.text(player),
            likes: Math.floor(Math.random() * 4500) + 1200,
            time: 'Just now',
            kind: 'fan' as const,
          },
        ]
      : [];

    const nextState: GameState = {
      ...current,
      player: nextPlayer,
      log: [...current.log, newLog].slice(-80),
      tweets: [...newTweet, ...current.tweets].slice(0, 40),
    };

    useGame.setState({ state: nextState });
  };

  const handleNextOrFinish = () => {
    if (sessionIndex + 1 < DIARY_SESSIONS.length) {
      setSessionIndex((i) => i + 1);
      setSelectedOption(null);
      sound.playBiggieTone();
    } else {
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-950 via-ink to-black p-6 text-white shadow-2xl ring-1 ring-purple-500/30">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-purple-900/60 text-2xl ring-2 ring-purple-400">
              🎙️
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold tracking-wide text-purple-200">
                Big Brother Diary Room
              </h2>
              <p className="text-xs text-purple-300/70">
                Confessional Session · {player.nickname}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Biggie Question */}
        <div className="mb-5 rounded-2xl border border-purple-500/30 bg-purple-900/30 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-400">
            <span>👁️</span>
            <span>Biggie Speaks:</span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-purple-100">
            "{currentSession.question}"
          </p>
        </div>

        {/* Selected Option Feedback or List of Options */}
        {selectedOption ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
              <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-gold">
                Biggie's Reply:
              </div>
              <p className="text-sm italic font-medium leading-relaxed text-white">
                "{selectedOption.biggieReply}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
              <div className="rounded-xl bg-bbn/20 p-2.5 text-bbn ring-1 ring-bbn/40">
                +{selectedOption.effect.clout.toLocaleString()} Clout
              </div>
              <div className="rounded-xl bg-lawn/20 p-2.5 text-lawn ring-1 ring-lawn/40">
                +{selectedOption.effect.sanity} Sanity
              </div>
            </div>

            <button
              onClick={handleNextOrFinish}
              className="mt-2 w-full rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-purple-500 active:scale-95"
            >
              {sessionIndex + 1 < DIARY_SESSIONS.length ? 'Next Question →' : 'Leave Diary Room 🚪'}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              Select your confessional response:
            </div>
            {currentSession.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                className="group flex w-full flex-col items-start gap-1 rounded-2xl border border-purple-500/20 bg-white/5 p-3.5 text-left transition hover:border-purple-400 hover:bg-purple-900/40 active:scale-[0.99]"
              >
                <div className="flex w-full items-center justify-between text-sm font-bold text-white group-hover:text-gold">
                  <span>{option.label}</span>
                  <span className="text-xs text-purple-300">+{option.effect.clout} Clout</span>
                </div>
                <div className="text-xs text-white/60 leading-relaxed">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
