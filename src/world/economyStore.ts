import { create } from 'zustand';
import { type CommerceItem, type ShopId, COMMERCE_CATALOG } from '../data/commerceCatalog';
import { useGame } from '../store';
import { sound } from '../engine/sound';

export interface InventoryItem {
  item: CommerceItem;
  count: number;
}

export interface TransactionRecord {
  id: string;
  timestamp: number;
  type: 'purchase' | 'transfer_out' | 'transfer_in' | 'income';
  amount: number;
  description: string;
  recipientName?: string;
}

interface EconomyState {
  walletBalance: number;
  inventory: Record<string, InventoryItem>;
  transactions: TransactionRecord[];
  activeShopId: ShopId | null;
  isTransferModalOpen: boolean;

  // Actions
  spend: (amount: number, description: string, category?: string) => boolean;
  earn: (amount: number, reason: string) => void;
  buyItem: (item: CommerceItem) => { success: boolean; message: string };
  transferToHousemate: (
    recipientId: string,
    recipientName: string,
    amount: number,
    memo?: string
  ) => { success: boolean; message: string };
  useItem: (itemId: string) => { success: boolean; message: string };
  openShop: (shopId: ShopId) => void;
  closeShop: () => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  resetEconomy: () => void;
}

const INITIAL_WALLET_BALANCE = 50000; // ₦50,000 starting cash for town commerce

export const useEconomyStore = create<EconomyState>((set, get) => ({
  walletBalance: INITIAL_WALLET_BALANCE,
  inventory: {},
  transactions: [
    {
      id: 'tx_init',
      timestamp: Date.now(),
      type: 'income',
      amount: INITIAL_WALLET_BALANCE,
      description: 'Starting Town Commerce Cash Deposit',
    },
  ],
  activeShopId: null,
  isTransferModalOpen: false,

  spend: (amount: number, description: string) => {
    const current = get().walletBalance;
    if (amount <= 0 || current < amount) {
      sound.playBiggieBuzzer();
      return false;
    }
    const next = current - amount;
    const tx: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'purchase',
      amount,
      description,
    };
    set((s) => ({
      walletBalance: next,
      transactions: [tx, ...s.transactions].slice(0, 50),
    }));

    // Sync with game store player bbCoins
    const gameState = useGame.getState().state;
    if (gameState?.player) {
      gameState.player.bbCoins = next;
    }
    sound.playRewardChime();
    return true;
  },

  earn: (amount: number, reason: string) => {
    if (amount <= 0) return;
    const next = get().walletBalance + amount;
    const tx: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'income',
      amount,
      description: reason,
    };
    set((s) => ({
      walletBalance: next,
      transactions: [tx, ...s.transactions].slice(0, 50),
    }));
    const gameState = useGame.getState().state;
    if (gameState?.player) {
      gameState.player.bbCoins = next;
    }
    sound.playRewardChime();
  },

  buyItem: (item: CommerceItem) => {
    const success = get().spend(item.cost, `Bought ${item.name}`);
    if (!success) {
      return {
        success: false,
        message: `Insufficient funds! You need ₦${item.cost.toLocaleString()} to purchase ${item.name}.`,
      };
    }

    // Add to inventory
    set((s) => {
      const existing = s.inventory[item.id];
      const count = existing ? existing.count + 1 : 1;
      return {
        inventory: {
          ...s.inventory,
          [item.id]: { item, count },
        },
      };
    });

    // Apply immediate stat boosts if item has effects
    if (item.effect) {
      const gameState = useGame.getState().state;
      if (gameState?.player) {
        const p = gameState.player;
        if (item.effect.energy) p.energy = Math.min(100, p.energy + item.effect.energy);
        if (item.effect.hunger) p.hunger = Math.max(0, p.hunger + item.effect.hunger);
        if (item.effect.sanity) p.sanity = Math.min(100, p.sanity + item.effect.sanity);
        if (item.effect.clout) p.fanbaseClout += item.effect.clout;
      }
    }

    return {
      success: true,
      message: `Purchased ${item.emoji} ${item.name} for ₦${item.cost.toLocaleString()}!`,
    };
  },

  transferToHousemate: (
    recipientId: string,
    recipientName: string,
    amount: number,
    memo = 'Gift / Tipping'
  ) => {
    if (amount <= 0) {
      return { success: false, message: 'Invalid transfer amount.' };
    }
    const current = get().walletBalance;
    if (current < amount) {
      sound.playBiggieBuzzer();
      return {
        success: false,
        message: `Insufficient funds! You have ₦${current.toLocaleString()}, but attempted to transfer ₦${amount.toLocaleString()}.`,
      };
    }

    const next = current - amount;
    const tx: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'transfer_out',
      amount,
      description: `${memo} to ${recipientName}`,
      recipientName,
    };

    set((s) => ({
      walletBalance: next,
      transactions: [tx, ...s.transactions].slice(0, 50),
      isTransferModalOpen: false,
    }));

    // Boost relationship affinity with the recipient
    const gameState = useGame.getState().state;
    if (gameState?.player) {
      gameState.player.bbCoins = next;
      const currentAffinity = gameState.player.relationships[recipientId] ?? 0;
      const boost = Math.min(40, Math.max(10, Math.floor(amount / 500)));
      gameState.player.relationships[recipientId] = Math.min(100, currentAffinity + boost);

      // Recipient reciprocates in relationship map if found in housemates
      const recipient = gameState.housemates.find((h) => h.id === recipientId);
      if (recipient) {
        recipient.relationships[gameState.player.id] = Math.min(
          100,
          (recipient.relationships[gameState.player.id] ?? 0) + boost
        );
      }
    }

    sound.playRewardChime();
    return {
      success: true,
      message: `Successfully sent ₦${amount.toLocaleString()} to ${recipientName}! Affinity increased by +${Math.min(40, Math.max(10, Math.floor(amount / 500)))} points.`,
    };
  },

  useItem: (itemId: string) => {
    const inv = get().inventory[itemId];
    if (!inv || inv.count <= 0) {
      return { success: false, message: 'Item not in inventory.' };
    }

    // Decrement inventory
    set((s) => {
      const newInv = { ...s.inventory };
      if (inv.count > 1) {
        newInv[itemId] = { ...inv, count: inv.count - 1 };
      } else {
        delete newInv[itemId];
      }
      return { inventory: newInv };
    });

    // Apply item effects to player
    const item = inv.item;
    if (item.effect) {
      const gameState = useGame.getState().state;
      if (gameState?.player) {
        const p = gameState.player;
        if (item.effect.energy) p.energy = Math.min(100, p.energy + item.effect.energy);
        if (item.effect.hunger) p.hunger = Math.max(0, p.hunger + item.effect.hunger);
        if (item.effect.sanity) p.sanity = Math.min(100, p.sanity + item.effect.sanity);
        if (item.effect.clout) p.fanbaseClout += item.effect.clout;
      }
    }

    sound.playRewardChime();
    return {
      success: true,
      message: `Used ${item.emoji} ${item.name}! ${item.effectDescription}`,
    };
  },

  openShop: (shopId: ShopId) => set({ activeShopId: shopId }),
  closeShop: () => set({ activeShopId: null }),
  openTransferModal: () => set({ isTransferModalOpen: true }),
  closeTransferModal: () => set({ isTransferModalOpen: false }),
  resetEconomy: () =>
    set({
      walletBalance: INITIAL_WALLET_BALANCE,
      inventory: {},
      transactions: [
        {
          id: 'tx_init',
          timestamp: Date.now(),
          type: 'income',
          amount: INITIAL_WALLET_BALANCE,
          description: 'Starting Town Commerce Cash Deposit',
        },
      ],
      activeShopId: null,
      isTransferModalOpen: false,
    }),
}));

// Helper to look up an item by ID
export function getCommerceItem(id: string): CommerceItem | undefined {
  return COMMERCE_CATALOG.find((it) => it.id === id);
}
