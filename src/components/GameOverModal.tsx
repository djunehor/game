import type { GameState } from '../types';
import { GRAND_PRIZE } from '../types';
import { useGame } from '../store';
import { Modal, ModalHeader } from './Modal';

export function GameOverModal({ state }: { state: GameState }) {
  const resetGame = useGame((s) => s.resetGame);
  const go = state.gameOver;
  if (!go) return null;

  const survivedWeeks = state.week;
  const finalClout = state.player.fanbaseClout;

  return (
    <Modal>
      <div className="px-6 py-8 text-center">
        <div className="mb-4 text-7xl">{go.won ? '🏆' : '🚪'}</div>
        <h2 className="font-display text-3xl font-semibold">
          {go.won ? 'You won the game!' : 'The journey ends'}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{go.reason}</p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Weeks survived</div>
            <div className="font-display text-2xl font-semibold tabular-nums">{survivedWeeks}</div>
          </div>
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Final clout</div>
            <div className="font-display text-2xl font-semibold tabular-nums">{finalClout.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Grand prize</div>
            <div className="font-display text-2xl font-semibold tabular-nums">
              {go.won ? '₦100M' : '₦0'}
            </div>
          </div>
        </div>

        {go.won && (
          <p className="mt-4 text-sm font-semibold text-gold-deep">
            ₦{GRAND_PRIZE.toLocaleString()} is yours. Biggie is proud. 👏
          </p>
        )}

        <button
          onClick={resetGame}
          className="mt-6 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black"
        >
          Play again
        </button>
      </div>
    </Modal>
  );
}
