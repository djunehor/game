import type { GameState } from '../types';
import { STORE_ITEMS } from '../data/storeItems';
import { useGame } from '../store';
import { Modal, ModalHeader } from './Modal';

export function StoreModal({ state, onClose }: { state: GameState; onClose: () => void }) {
  const buyItem = useGame((s) => s.buyItem);
  const { player } = state;

  return (
    <Modal onClose={onClose}>
      <ModalHeader emoji="🛒" title="Biggie's Store" subtitle="Spend your Naira on luxuries and advantages." />

      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-gold/10 px-4 py-3">
          <span className="text-sm font-bold text-ink">Your balance</span>
          <span className="font-display text-xl font-bold tabular-nums text-gold-deep">
            ₦{player.bbCoins.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2.5">
          {STORE_ITEMS.map((item) => {
            const canAfford = player.bbCoins >= item.cost;
            const alreadyImmune = item.id === 'immunity-token' && player.isImmune;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-black/5 bg-white p-3.5"
              >
                <span className="text-3xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold">{item.name}</span>
                    {alreadyImmune && <span className="rounded-full bg-lawn/10 px-2 py-0.5 text-[9px] font-black text-lawn uppercase">Active</span>}
                  </div>
                  <div className="text-xs text-ink-soft">{item.description}</div>
                </div>
                <button
                  onClick={() => buyItem(item.id)}
                  disabled={!canAfford || alreadyImmune}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    canAfford && !alreadyImmune
                      ? 'bg-ink text-white hover:bg-black'
                      : 'cursor-not-allowed bg-black/5 text-ink-soft'
                  }`}
                >
                  ₦{item.cost.toLocaleString()}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-black/10 py-3 text-sm font-bold text-ink-soft transition hover:bg-mist"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
