import type { GameState } from '../types';
import { WEEK_DAYS } from '../types';
import { ROOM_ACTIONS } from '../engine/actions';
import { useGame } from '../store';

import { useCamera } from '../three/cameraStore';

export function GameOverlay({ state }: { state: GameState }) {
  const doAction = useGame((s) => s.doAction);
  const doSponsorTask = useGame((s) => s.doSponsorTask);
  const nextDay = useGame((s) => s.nextDay);
  const cameraMode = useCamera((s) => s.mode);
  const toggleCamera = useCamera((s) => s.toggleMode);

  const { phase, phaseDone, player } = state;
  const dayName = WEEK_DAYS[state.day] ?? '?';
  const canAct = !state.gameOver && (phase === 'daily' || phase === 'party') && state.actionsLeft > 0;

  const actions = ROOM_ACTIONS.filter((a) => a.room === player.currentRoom && (!a.requiresHoH || player.isHoH));

  const barLabel =
    phase === 'daily'
      ? 'End the day →'
      : phase === 'party'
        ? 'End the party →'
        : phase === 'hoh'
          ? 'Begin the week →'
          : phase === 'nominations'
            ? 'To the party →'
            : phase === 'eviction'
              ? 'New week →'
              : 'Continue →';

  const showBar = phase === 'daily' || phase === 'party' || phaseDone;

  return (
    <>
      {/* Camera View Mode Toggle Button */}
      <div className="absolute top-18 right-4 z-20">
        <button
          onClick={toggleCamera}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/80 px-3 py-1.5 text-xs font-black text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-ink active:scale-95"
          title="Toggle between Human Eye-Level View and Overhead View (Key: V)"
        >
          <span>{cameraMode === 'human' ? '🚶 Human View' : '🗺️ Bird’s Eye'}</span>
          <span className="rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold text-gold">V</span>
        </button>
      </div>

      {/* Controls hint */}
      <div className="pointer-events-none absolute right-3 bottom-3 z-10 hidden text-right text-[10px] font-semibold text-white/70 drop-shadow sm:block">
        <div>WASD / arrows — move</div>
        <div>Q / E — rotate camera</div>
        <div>V — toggle camera ({cameraMode === 'human' ? 'Human' : 'Overview'})</div>
        <div>F / click — talk & interact</div>
        <div>Shift — sprint</div>
      </div>

      {/* Bottom action panel */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-ink/90 to-ink/0 px-3 pt-6 pb-3">
        <div className="mx-auto flex w-full max-w-5xl items-end gap-2">
          {/* Room chip + actions */}
          <div className="min-w-0 flex-1">
            {(phase === 'daily' || phase === 'party') && (
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold text-white/80">
                <span>
                  {dayName} · <span className="text-white">{player.currentRoom}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 ${state.actionsLeft > 0 ? 'bg-lawn/20 text-lawn' : 'bg-white/10 text-white/60'}`}>
                  {state.actionsLeft} action{state.actionsLeft === 1 ? '' : 's'} left
                </span>
              </div>
            )}

            {canAct && (
              <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={doSponsorTask}
                  disabled={state.player.energy < 15}
                  className="flex shrink-0 items-center gap-2 rounded-2xl border border-gold/40 bg-gold/15 px-3 py-2 text-sm font-bold text-gold shadow-lg backdrop-blur transition hover:bg-gold/25"
                >
                  <span className="text-xl">🎯</span>
                  <span>Sponsor Task</span>
                </button>
                {actions.map((a) => {
                  const exhausted = state.player.energy < 15 && a.key !== 'power_nap';
                  return (
                    <button
                      key={a.key}
                      onClick={() => doAction(a.key)}
                      disabled={exhausted}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-ink/80 px-3 py-2 text-sm font-bold text-white shadow-lg backdrop-blur transition hover:bg-ink ${
                        exhausted ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                    >
                      <span className="text-xl">{a.emoji}</span>
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!canAct && (phase === 'daily' || phase === 'party') && (
              <div className="rounded-2xl border border-white/10 bg-ink/60 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur">
                {state.player.energy < 15
                  ? '😮‍💨 Too exhausted — find a bed and take a power nap first.'
                  : "You've used today's actions. Time to end the day."}
              </div>
            )}
          </div>

          {/* Advance button */}
          {showBar && !state.gameOver && (
            <button
              onClick={nextDay}
              className="shrink-0 rounded-2xl bg-bbn px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-bbn/30 transition hover:bg-bbn-deep"
            >
              {barLabel}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
