import { useState } from 'react';
import type { GameState } from '../types';
import { WEEK_DAYS } from '../types';
import { sound } from '../engine/sound';

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex items-center justify-between text-[10px] font-bold tracking-wide text-white/60 uppercase">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

const phaseLabel: Record<GameState['phase'], string> = {
  creation: 'Character Creation',
  hoh: 'HoH Challenge',
  daily: 'Daily Life',
  nominations: 'Nominations',
  party: 'Saturday Party',
  eviction: 'Live Eviction',
  finale: 'The Finale',
  gameover: 'Game Over',
};

export function Hud({ state }: { state: GameState }) {
  const { player } = state;
  const dayName = WEEK_DAYS[state.day] ?? '?';
  const [muted, setMuted] = useState(sound.muted);

  const toggleSound = () => {
    sound.muted = !sound.muted;
    setMuted(sound.muted);
    if (!sound.muted) sound.playRewardChime();
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-ink/85 to-ink/0 px-4 pt-3 pb-6 text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        {/* Avatar */}
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl shadow-lg ring-2 ring-white/20"
          style={{ background: player.accentColor }}
        >
          {player.avatar}
        </div>

        {/* Identity + week */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display truncate text-lg leading-tight font-semibold">{player.nickname}</span>
            {player.isHoH && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-black tracking-wide text-ink uppercase">👑 HoH</span>
            )}
            {player.isNominated && (
              <span className="rounded-full bg-bbn px-2 py-0.5 text-[10px] font-black tracking-wide text-white uppercase">Nominated</span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-white/70">
            Week {state.week} · {dayName} · <span className="capitalize">{phaseLabel[state.phase]}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="hidden items-center gap-4 sm:flex">
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-wide text-white/60 uppercase">Clout</div>
            <div className="font-display text-lg leading-none font-semibold tabular-nums text-bbn">
              {player.fanbaseClout.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-wide text-white/60 uppercase">BB Coins</div>
            <div className="font-display text-lg leading-none font-semibold tabular-nums text-gold">
              {player.bbCoins.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-wide text-white/60 uppercase">Strikes</div>
            <div className="font-display text-lg leading-none font-semibold tabular-nums text-bbn">
              {player.strikes}/3
            </div>
          </div>
          <button
            onClick={toggleSound}
            className="pointer-events-auto ml-2 grid size-8 place-items-center rounded-xl border border-white/20 bg-white/10 text-sm font-bold text-white transition hover:bg-white/20"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Needs bars */}
      <div className="mx-auto mt-3 grid max-w-5xl grid-cols-3 gap-4">
        <StatBar label="Energy" value={player.energy} color={player.energy < 20 ? '#ef4444' : '#22b573'} />
        <StatBar label="Sanity" value={player.sanity} color={player.sanity < 20 ? '#ef4444' : '#3a86ff'} />
        <StatBar label="Hunger" value={player.hunger} color={player.hunger < 20 ? '#ef4444' : '#f5b841'} />
      </div>
    </header>
  );
}
