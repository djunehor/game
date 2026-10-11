import { useState } from 'react';
import { useEconomyStore } from '../world/economyStore';
import { useGame } from '../store';

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000];
const PRESET_MEMOS = [
  'Spraying you money at the Saturday Party 🎉',
  'Take this for Lunch & Suya 🍢',
  'Covering your Danfo / Okada transit fare 🚐',
  'Just a generous gift, you are a real one 💎',
];

export function TransferModal() {
  const isTransferModalOpen = useEconomyStore((s) => s.isTransferModalOpen) || useEconomyStore.getState().isTransferModalOpen;
  const closeTransferModal = useEconomyStore((s) => s.closeTransferModal);
  const walletBalance = useEconomyStore((s) => s.walletBalance) ?? useEconomyStore.getState().walletBalance;
  const transferToHousemate = useEconomyStore((s) => s.transferToHousemate);

  const gameState = useGame((s) => s.state) ?? useGame.getState().state;
  const player = gameState?.player;
  const housemates = (gameState?.housemates ?? []).filter(
    (h) => h.id !== player?.id && h.status === 'active'
  );

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(housemates[0]?.id ?? '');
  const [amount, setAmount] = useState<number>(2500);
  const [memo, setMemo] = useState<string>(PRESET_MEMOS[0]);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  if (!isTransferModalOpen) return null;

  const recipient = housemates.find((h) => h.id === selectedRecipientId) ?? housemates[0];
  const canAfford = walletBalance >= amount && amount > 0;
  const projectedAffinity = Math.min(40, Math.max(10, Math.floor(amount / 500)));

  const handleSend = () => {
    if (!recipient) return;
    const res = transferToHousemate(recipient.id, recipient.nickname || recipient.name, amount, memo);
    if (!res.success) {
      setFeedback({ message: res.message, isError: true });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ message: res.message, isError: false });
      setTimeout(() => {
        setFeedback(null);
        closeTransferModal();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative flex flex-col w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-950/95 text-white shadow-2xl p-6 ring-1 ring-emerald-500/20">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-emerald-500/10 text-emerald-400">💸</span>
            <div>
              <h2 className="text-lg font-black text-white">Send Money to Housemate</h2>
              <p className="text-xs text-slate-400">Spend cash on friends, tip for rides, or spray at parties</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTransferModal}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live Balance Banner */}
        <div className="flex items-center justify-between p-3 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <span className="text-xs font-semibold text-amber-300">Your Current Wallet Balance</span>
          <span className="text-sm font-extrabold text-amber-400">
            ₦{walletBalance.toLocaleString()}
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 mt-3 rounded-xl text-xs font-bold text-center ${
              feedback.isError ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* 1. Recipient Selection */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Select Recipient Housemate
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar">
            {housemates.map((h) => {
              const isSelected = h.id === recipient?.id;
              const affinity = player?.relationships[h.id] ?? 0;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedRecipientId(h.id)}
                  className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md ring-1 ring-emerald-400'
                      : 'border-white/10 bg-slate-900/50 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-2xl mb-1">{h.avatar}</span>
                  <span className="text-xs font-bold truncate max-w-full">{h.nickname}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{affinity} pts</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Amount Selection */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Transfer Amount (₦)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  amount === amt
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          <input
            type="number"
            min="100"
            max={walletBalance}
            step="100"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
            className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-slate-900 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter custom amount..."
          />
        </div>

        {/* 3. Memo Note */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-300 mb-2">Memo / Reason</label>
          <select
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/15 bg-slate-900 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {PRESET_MEMOS.map((m, idx) => (
              <option key={`memo-${idx}`} value={m} className="bg-slate-900 text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Affinity Gain Preview */}
        {recipient && (
          <div className="flex items-center justify-between p-3 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold">
            <span>✨ Relationship Affinity Boost:</span>
            <span className="font-extrabold">+{projectedAffinity} Points with {recipient.nickname}</span>
          </div>
        )}

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canAfford}
          className={`w-full py-3 mt-5 rounded-2xl text-sm font-extrabold transition-all shadow-xl cursor-pointer ${
            canAfford
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-98'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {canAfford
            ? `Send ₦${amount.toLocaleString()} to ${recipient?.nickname ?? 'Housemate'}`
            : 'Insufficient Wallet Funds'}
        </button>
      </div>
    </div>
  );
}
