import { useEconomyStore } from '../world/economyStore';

export function WalletHUD() {
  const walletBalance = useEconomyStore((s) => s.walletBalance);
  const inventory = useEconomyStore((s) => s.inventory);
  const openShop = useEconomyStore((s) => s.openShop);
  const openTransferModal = useEconomyStore((s) => s.openTransferModal);

  const totalInventoryCount = Object.values(inventory).reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="fixed top-3 left-44 z-20 flex items-center gap-1.5 select-none font-sans">
      {/* Wallet Balance Pill */}
      <button
        type="button"
        onClick={() => openShop('supermarket')}
        className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-slate-950/85 hover:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-amber-400/20"
        title="Open Town Commerce Shops"
        aria-label={`Wallet Balance: ₦${walletBalance.toLocaleString()}`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400">
          ₦
        </span>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase font-semibold text-amber-400/80">Wallet</span>
          <span className="text-sm font-extrabold text-amber-300">
            ₦{walletBalance.toLocaleString()}
          </span>
        </div>
      </button>

      {/* Quick P2P Transfer / Spray Money Button */}
      <button
        type="button"
        onClick={openTransferModal}
        className="flex h-9 items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/70 hover:bg-emerald-900/80 px-2.5 text-xs font-bold text-emerald-200 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Send Money or Tip Other Housemates"
        aria-label="Send Money to Player"
      >
        <span>💸</span>
        <span className="hidden sm:inline">Send ₦</span>
      </button>

      {/* Inventory Count Badge */}
      {totalInventoryCount > 0 && (
        <button
          type="button"
          onClick={() => openShop('supermarket')}
          className="flex h-9 items-center gap-1 rounded-2xl border border-white/15 bg-slate-900/80 hover:bg-slate-800 px-2.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title="My Inventory"
          aria-label={`Inventory: ${totalInventoryCount} items`}
        >
          <span>🎒</span>
          <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-black">
            {totalInventoryCount}
          </span>
        </button>
      )}
    </div>
  );
}
