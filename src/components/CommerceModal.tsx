import { useState } from 'react';
import { useEconomyStore } from '../world/economyStore';
import { SHOPS, COMMERCE_CATALOG, type ShopId, type CommerceItem } from '../data/commerceCatalog';

export function CommerceModal() {
  const activeShopId = useEconomyStore((s) => s.activeShopId) ?? useEconomyStore.getState().activeShopId;
  const closeShop = useEconomyStore((s) => s.closeShop);
  const openTransferModal = useEconomyStore((s) => s.openTransferModal);
  const walletBalance = useEconomyStore((s) => s.walletBalance) ?? useEconomyStore.getState().walletBalance;
  const buyItem = useEconomyStore((s) => s.buyItem);
  const useItem = useEconomyStore((s) => s.useItem);
  const inventory = useEconomyStore((s) => s.inventory) ?? useEconomyStore.getState().inventory;
  const transactions = useEconomyStore((s) => s.transactions) ?? useEconomyStore.getState().transactions;

  const [activeTab, setActiveTab] = useState<ShopId | 'inventory' | 'history'>('supermarket');
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  if (!activeShopId) return null;

  // Sync tab with active shop if specified
  const currentTab = activeTab;
  const currentShopDef = SHOPS[currentTab as ShopId] ?? SHOPS.supermarket;

  const catalogItems = COMMERCE_CATALOG.filter((it) => it.shopId === currentTab);
  const inventoryList = Object.values(inventory);

  const handleBuy = (item: CommerceItem) => {
    const res = buyItem(item);
    setFeedback({ message: res.message, isError: !res.success });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleUse = (itemId: string) => {
    const res = useItem(itemId);
    setFeedback({ message: res.message, isError: !res.success });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] max-h-[820px] rounded-3xl border border-white/15 bg-slate-950/95 text-white shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentShopDef?.emoji ?? '🏪'}</span>
            <div>
              <h2 className="text-lg font-black text-white">
                {currentTab === 'inventory'
                  ? 'Housemate Backpack & Inventory'
                  : currentTab === 'history'
                  ? 'Banking & Transaction History'
                  : currentShopDef?.name}
              </h2>
              <p className="text-xs text-slate-400">
                {currentTab === 'inventory'
                  ? 'Manage and consume your purchased luxury items'
                  : currentTab === 'history'
                  ? 'Recent deposits, purchases, and peer-to-peer transfers'
                  : currentShopDef?.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Wallet Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10">
              <span className="text-xs text-amber-400 font-bold">₦</span>
              <span className="text-sm font-extrabold text-amber-300">
                {walletBalance.toLocaleString()}
              </span>
            </div>

            {/* Quick Transfer Button */}
            <button
              type="button"
              onClick={() => {
                closeShop();
                openTransferModal();
              }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
            >
              <span>💸</span>
              <span>Send Money</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeShop}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close Commerce Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`px-6 py-2 text-xs font-bold text-center transition-all ${
              feedback.isError ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Establishment Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-white/10 bg-slate-900/50 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('gas_station')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'gas_station'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⛽</span>
            <span>Gas Station</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supermarket')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'supermarket'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🛒</span>
            <span>Supermarket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'restaurant'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🍢</span>
            <span>Suya & Food</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'bar'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🍸</span>
            <span>Bar & Club</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎟️</span>
            <span>Activities</span>
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎒</span>
            <span>Inventory ({inventoryList.reduce((a, b) => a + b.count, 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📜</span>
            <span>History</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Shop Catalog View */}
          {activeTab !== 'inventory' && activeTab !== 'history' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogItems.map((item) => {
                const canAfford = walletBalance >= item.cost;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 hover:border-white/20 transition-all shadow-md group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-3xl p-2 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                          {item.emoji}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white/10 text-slate-300">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="p-2 rounded-xl bg-white/5 text-[11px] font-semibold text-emerald-400 mb-4">
                        ✨ {item.effectDescription}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-sm font-extrabold text-amber-300">
                        ₦{item.cost.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {canAfford ? 'Buy Now' : 'Need Funds'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Player Inventory View */}
          {activeTab === 'inventory' && (
            <div>
              {inventoryList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <span className="text-5xl mb-3">🎒</span>
                  <h3 className="text-base font-bold text-white mb-1">Your Inventory is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Visit any town establishment (supermarket, gas station, suya spot, or bar) to purchase consumable items.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('supermarket')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition cursor-pointer"
                  >
                    Go Shopping
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventoryList.map(({ item, count }) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 bg-slate-900/60 shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{item.emoji}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            x{count}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                        <div className="p-2 rounded-xl bg-white/5 text-[11px] font-semibold text-emerald-400 mb-3">
                          ✨ {item.effectDescription}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUse(item.id)}
                        className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black transition active:scale-95 cursor-pointer"
                      >
                        Use Item
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions / Receipts View */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-2">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No transactions recorded yet.</div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {tx.type === 'income' ? '💰' : tx.type === 'transfer_out' ? '💸' : '🛒'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{tx.description}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-extrabold ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
