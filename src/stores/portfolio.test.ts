import { describe, it, expect, beforeEach } from 'vitest';
import { usePortfolioStore } from './portfolio';
import { db } from '../lib/db';

describe('Portfolio Store', () => {
  beforeEach(async () => {
    // Clear database
    await db.portfolios.clear();
    await db.holdings.clear();

    // Reset store state
    usePortfolioStore.setState({
      portfolios: [],
      activePortfolioId: null,
      holdings: [],
      isLoading: false,
      error: null,
    });
  });

  describe('loadPortfolios', () => {
    it('should load empty portfolios initially', async () => {
      await usePortfolioStore.getState().loadPortfolios();

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(0);
      expect(state.activePortfolioId).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should load portfolios and set first as active', async () => {
      // Create portfolios directly in DB
      await db.portfolios.add({ name: 'First', createdAt: Date.now() - 1000 });
      await db.portfolios.add({ name: 'Second', createdAt: Date.now() });

      await usePortfolioStore.getState().loadPortfolios();

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(2);
      expect(state.activePortfolioId).toBeDefined();
      expect(state.portfolios[0]?.name).toBe('Second'); // Most recent first
    });
  });

  describe('createPortfolio', () => {
    it('should create a portfolio and set it as active', async () => {
      const id = await usePortfolioStore.getState().createPortfolio('My Portfolio');

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0]?.name).toBe('My Portfolio');
      expect(state.activePortfolioId).toBe(id);
    });

    it('should switch to newly created portfolio', async () => {
      await usePortfolioStore.getState().createPortfolio('First');
      const secondId = await usePortfolioStore.getState().createPortfolio('Second');

      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBe(secondId);
    });
  });

  describe('setActivePortfolio', () => {
    it('should switch active portfolio and load its holdings', async () => {
      // Create two portfolios with holdings
      const id1 = await usePortfolioStore.getState().createPortfolio('First');
      await usePortfolioStore.getState().addHolding('AAPL', 10, 150);

      // Create second portfolio (becomes active)
      await usePortfolioStore.getState().createPortfolio('Second');
      await usePortfolioStore.getState().addHolding('MSFT', 5, 300);

      // Switch back to first
      await usePortfolioStore.getState().setActivePortfolio(id1);

      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBe(id1);
      expect(state.holdings).toHaveLength(1);
      expect(state.holdings[0]?.symbol).toBe('AAPL');
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and switch to another', async () => {
      const id1 = await usePortfolioStore.getState().createPortfolio('First');
      const secondId = await usePortfolioStore.getState().createPortfolio('Second');

      // Delete second (currently active)
      await usePortfolioStore.getState().deletePortfolio(secondId);

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.activePortfolioId).toBe(id1);
    });

    it('should set activePortfolioId to null when last portfolio deleted', async () => {
      const id = await usePortfolioStore.getState().createPortfolio('Only One');
      await usePortfolioStore.getState().deletePortfolio(id);

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(0);
      expect(state.activePortfolioId).toBeNull();
    });
  });

  describe('Holdings Management', () => {
    beforeEach(async () => {
      await usePortfolioStore.getState().createPortfolio('Test Portfolio');
    });

    it('should add a holding', async () => {
      await usePortfolioStore.getState().addHolding('AAPL', 10, 150);

      const state = usePortfolioStore.getState();
      expect(state.holdings).toHaveLength(1);
      expect(state.holdings[0]?.symbol).toBe('AAPL');
      expect(state.holdings[0]?.shares).toBe(10);
      expect(state.holdings[0]?.avgCost).toBe(150);
    });

    it('should update a holding', async () => {
      await usePortfolioStore.getState().addHolding('AAPL', 10, 150);

      const holdingId = usePortfolioStore.getState().holdings[0]?.id;
      await usePortfolioStore.getState().updateHolding(holdingId!, 20, 175);

      const state = usePortfolioStore.getState();
      expect(state.holdings[0]?.shares).toBe(20);
      expect(state.holdings[0]?.avgCost).toBe(175);
    });

    it('should delete a holding', async () => {
      await usePortfolioStore.getState().addHolding('AAPL', 10, 150);
      await usePortfolioStore.getState().addHolding('MSFT', 5, 300);

      const appleId = usePortfolioStore.getState().holdings.find(h => h.symbol === 'AAPL')?.id;
      await usePortfolioStore.getState().deleteHolding(appleId!);

      const state = usePortfolioStore.getState();
      expect(state.holdings).toHaveLength(1);
      expect(state.holdings[0]?.symbol).toBe('MSFT');
    });

    it('should set error when adding holding without active portfolio', async () => {
      usePortfolioStore.setState({ activePortfolioId: null });

      await usePortfolioStore.getState().addHolding('AAPL', 10, 150);

      const state = usePortfolioStore.getState();
      expect(state.error).toBe('No active portfolio');
    });
  });

  describe('getActivePortfolio', () => {
    it('should return the active portfolio', async () => {
      await usePortfolioStore.getState().createPortfolio('My Portfolio');

      const portfolio = usePortfolioStore.getState().getActivePortfolio();
      expect(portfolio?.name).toBe('My Portfolio');
    });

    it('should return undefined when no active portfolio', () => {
      const portfolio = usePortfolioStore.getState().getActivePortfolio();
      expect(portfolio).toBeUndefined();
    });
  });
});
