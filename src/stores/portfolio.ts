import { create } from 'zustand';
import {
  db,
  getPortfolios,
  createPortfolio as dbCreatePortfolio,
  updatePortfolio as dbUpdatePortfolio,
  deletePortfolio as dbDeletePortfolio,
  getHoldings,
  addHolding as dbAddHolding,
  updateHolding as dbUpdateHolding,
  deleteHolding as dbDeleteHolding,
  type Portfolio,
  type Holding,
} from '../lib/db';

export interface HoldingWithValue extends Holding {
  currentPrice?: number;
  currentValue?: number;
  costBasis: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface PortfolioWithStats extends Portfolio {
  holdings: HoldingWithValue[];
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolioId: number | null;
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPortfolios: () => Promise<void>;
  setActivePortfolio: (id: number | null) => Promise<void>;
  createPortfolio: (name: string) => Promise<number>;
  updatePortfolio: (id: number, name: string) => Promise<void>;
  deletePortfolio: (id: number) => Promise<void>;
  addHolding: (symbol: string, shares: number, avgCost: number) => Promise<void>;
  updateHolding: (id: number, shares: number, avgCost: number) => Promise<void>;
  deleteHolding: (id: number) => Promise<void>;
  getActivePortfolio: () => Portfolio | undefined;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  holdings: [],
  isLoading: false,
  error: null,

  loadPortfolios: async () => {
    set({ isLoading: true, error: null });
    try {
      const portfolios = await getPortfolios();
      const activeId = get().activePortfolioId;

      // If we have portfolios but no active one, set the first as active
      let newActiveId = activeId;
      if (portfolios.length > 0 && !activeId) {
        newActiveId = portfolios[0]?.id ?? null;
      }

      // Load holdings for active portfolio
      let holdings: Holding[] = [];
      if (newActiveId) {
        holdings = await getHoldings(newActiveId);
      }

      set({
        portfolios,
        activePortfolioId: newActiveId,
        holdings,
        isLoading: false
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  setActivePortfolio: async (id: number | null) => {
    set({ activePortfolioId: id });
    if (id) {
      const holdings = await getHoldings(id);
      set({ holdings });
    } else {
      set({ holdings: [] });
    }
  },

  createPortfolio: async (name: string) => {
    try {
      const id = await dbCreatePortfolio(name);
      const portfolios = await getPortfolios();
      set({ portfolios, activePortfolioId: id, holdings: [] });
      return id;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  updatePortfolio: async (id: number, name: string) => {
    try {
      await dbUpdatePortfolio(id, name);
      const portfolios = await getPortfolios();
      set({ portfolios });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deletePortfolio: async (id: number) => {
    try {
      await dbDeletePortfolio(id);
      const portfolios = await getPortfolios();
      const state = get();

      // If we deleted the active portfolio, switch to another
      let newActiveId = state.activePortfolioId;
      if (state.activePortfolioId === id) {
        newActiveId = portfolios[0]?.id ?? null;
      }

      let holdings: Holding[] = [];
      if (newActiveId) {
        holdings = await getHoldings(newActiveId);
      }

      set({
        portfolios,
        activePortfolioId: newActiveId,
        holdings
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  addHolding: async (symbol: string, shares: number, avgCost: number) => {
    const { activePortfolioId } = get();
    if (!activePortfolioId) {
      set({ error: 'No active portfolio' });
      return;
    }

    try {
      await dbAddHolding(activePortfolioId, symbol, shares, avgCost);
      const holdings = await getHoldings(activePortfolioId);
      set({ holdings });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updateHolding: async (id: number, shares: number, avgCost: number) => {
    const { activePortfolioId } = get();
    try {
      await dbUpdateHolding(id, shares, avgCost);
      if (activePortfolioId) {
        const holdings = await getHoldings(activePortfolioId);
        set({ holdings });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  deleteHolding: async (id: number) => {
    const { activePortfolioId } = get();
    try {
      await dbDeleteHolding(id);
      if (activePortfolioId) {
        const holdings = await getHoldings(activePortfolioId);
        set({ holdings });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  getActivePortfolio: () => {
    const { portfolios, activePortfolioId } = get();
    return portfolios.find((p) => p.id === activePortfolioId);
  },
}));

// Initialize on app start
db.on('ready', () => {
  usePortfolioStore.getState().loadPortfolios();
});
