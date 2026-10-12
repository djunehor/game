import type { GameState } from '../types';
import { GRAND_PRIZE, TOP_5_PRIZES } from '../types';
import { useGame } from '../store';
import { Modal } from './Modal';

export function GameOverModal({ state }: { state: GameState }) {
  const resetGame = useGame((s) => s.resetGame);
  const go = state.gameOver;
  if (!go) return null;

  const survivedWeeks = state.week;
  const finalClout = state.player.fanbaseClout;
  const rank = go.rank ?? (go.won ? 1 : undefined);
  const prize = go.prize ?? (go.won ? GRAND_PRIZE : (rank ? (TOP_5_PRIZES[rank] ?? 0) : 0));

  const rankBadge =
    rank === 1
      ? '1st Place 🏆'
      : rank === 2
        ? '2nd Place 🥈'
        : rank === 3
          ? '3rd Place 🥉'
          : rank === 4
            ? '4th Place 🎖️'
            : rank === 5
              ? '5th Place ⭐'
              : 'Evicted 🚪';

  const emoji =
    rank === 1
      ? '🏆'
      : rank === 2
        ? '🥈'
        : rank === 3
          ? '🥉'
          : rank === 4
            ? '🎖️'
            : rank === 5
              ? '⭐'
              : '🚪';

  const heading =
    go.won || rank === 1
      ? 'You won Big Brother Naija!'
      : rank && rank <= 5
        ? `Top 5 Finalist (${rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} Place)`
        : 'The journey ends';

  const prizeDisplay = prize > 0 ? `₦${(prize / 1_000_000).toLocaleString()}M` : '₦0';

  return (
    <Modal>
      <div className="px-6 py-8 text-center">
        <div className="mb-4 text-7xl">{emoji}</div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{heading}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{go.reason}</p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Placement</div>
            <div className="font-display text-sm font-bold sm:text-base tabular-nums">{rankBadge}</div>
          </div>
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Final clout</div>
            <div className="font-display text-base font-bold sm:text-xl tabular-nums">{finalClout.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-mist p-3">
            <div className="text-[10px] font-bold text-ink-soft uppercase">Cash prize</div>
            <div className={`font-display text-base font-bold sm:text-xl tabular-nums ${prize > 0 ? 'text-gold-deep' : ''}`}>
              {prizeDisplay}
            </div>
          </div>
        </div>

        {prize > 0 ? (
          <p className="mt-4 text-sm font-semibold text-gold-deep">
            ₦{prize.toLocaleString()} prize money is yours! Biggie is proud. 👏
          </p>
        ) : (
          <p className="mt-4 text-xs text-ink-soft">
            Weeks survived: {survivedWeeks}. Better luck next season!
          </p>
        )}

        <button
          onClick={resetGame}
          className="mt-6 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black cursor-pointer"
        >
          Play again
        </button>
      </div>
    </Modal>
  );
}
