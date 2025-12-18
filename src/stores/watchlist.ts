import { create } from 'zustand';
import {
  db,
  getWatchlist,
  addToWatchlist as dbAddToWatchlist,
  removeFromWatchlist as dbRemoveFromWatchlist,
  type WatchlistItem,
} from '../lib/db';

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWatchlist: () => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getWatchlist();
      set({ items, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  addSymbol: async (symbol: string) => {
    try {
      await dbAddToWatchlist(symbol);
      const items = await getWatchlist();
      set({ items });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeSymbol: async (symbol: string) => {
    try {
      await dbRemoveFromWatchlist(symbol);
      const items = await getWatchlist();
      set({ items });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  isInWatchlist: (symbol: string) => {
    return get().items.some((item) => item.symbol === symbol.toUpperCase());
  },
}));

// Initialize on app start
db.on('ready', () => {
  useWatchlistStore.getState().loadWatchlist();
});
