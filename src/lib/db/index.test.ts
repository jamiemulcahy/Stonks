import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  createPortfolio,
  getPortfolios,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  getHoldings,
  updateHolding,
  deleteHolding,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
} from './index';

describe('Database Helpers', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.portfolios.clear();
    await db.holdings.clear();
    await db.watchlist.clear();
    await db.quotes.clear();
    await db.dailyCandles.clear();
    await db.cacheMeta.clear();
  });

  describe('Portfolio Operations', () => {
    it('should create a portfolio', async () => {
      const id = await createPortfolio('My Portfolio');
      expect(id).toBeGreaterThan(0);

      const portfolio = await getPortfolio(id);
      expect(portfolio).toBeDefined();
      expect(portfolio?.name).toBe('My Portfolio');
      expect(portfolio?.createdAt).toBeGreaterThan(0);
    });

    it('should get all portfolios ordered by createdAt desc', async () => {
      await createPortfolio('First');
      await createPortfolio('Second');
      await createPortfolio('Third');

      const portfolios = await getPortfolios();
      expect(portfolios).toHaveLength(3);
      expect(portfolios[0]?.name).toBe('Third');
      expect(portfolios[2]?.name).toBe('First');
    });

    it('should update a portfolio name', async () => {
      const id = await createPortfolio('Original Name');
      await updatePortfolio(id, 'Updated Name');

      const portfolio = await getPortfolio(id);
      expect(portfolio?.name).toBe('Updated Name');
    });

    it('should delete a portfolio and its holdings', async () => {
      const portfolioId = await createPortfolio('To Delete');
      await addHolding(portfolioId, 'AAPL', 10, 150);
      await addHolding(portfolioId, 'MSFT', 5, 300);

      // Verify holdings exist
      let holdings = await getHoldings(portfolioId);
      expect(holdings).toHaveLength(2);

      // Delete portfolio
      await deletePortfolio(portfolioId);

      // Verify portfolio is gone
      const portfolio = await getPortfolio(portfolioId);
      expect(portfolio).toBeUndefined();

      // Verify holdings are also gone
      holdings = await getHoldings(portfolioId);
      expect(holdings).toHaveLength(0);
    });
  });

  describe('Holdings Operations', () => {
    let portfolioId: number;

    beforeEach(async () => {
      portfolioId = await createPortfolio('Test Portfolio');
    });

    it('should add a holding', async () => {
      await addHolding(portfolioId, 'AAPL', 10, 150.50);

      const holdings = await getHoldings(portfolioId);
      expect(holdings).toHaveLength(1);
      expect(holdings[0]?.symbol).toBe('AAPL');
      expect(holdings[0]?.shares).toBe(10);
      expect(holdings[0]?.avgCost).toBe(150.50);
    });

    it('should convert symbol to uppercase', async () => {
      await addHolding(portfolioId, 'aapl', 10, 150);

      const holdings = await getHoldings(portfolioId);
      expect(holdings[0]?.symbol).toBe('AAPL');
    });

    it('should merge holdings when adding same symbol', async () => {
      // Add 10 shares at $100
      await addHolding(portfolioId, 'AAPL', 10, 100);
      // Add 10 more shares at $200 (same symbol, should merge)
      await addHolding(portfolioId, 'AAPL', 10, 200);

      const holdings = await getHoldings(portfolioId);
      expect(holdings).toHaveLength(1);
      expect(holdings[0]?.shares).toBe(20);
      // Average cost should be (10*100 + 10*200) / 20 = 150
      expect(holdings[0]?.avgCost).toBe(150);
    });

    it('should update a holding', async () => {
      const holdingId = await addHolding(portfolioId, 'AAPL', 10, 150);
      await updateHolding(holdingId, 20, 175);

      const holdings = await getHoldings(portfolioId);
      expect(holdings[0]?.shares).toBe(20);
      expect(holdings[0]?.avgCost).toBe(175);
    });

    it('should delete a holding', async () => {
      const id = await addHolding(portfolioId, 'AAPL', 10, 150);
      await addHolding(portfolioId, 'MSFT', 5, 300);

      await deleteHolding(id);

      const holdings = await getHoldings(portfolioId);
      expect(holdings).toHaveLength(1);
      expect(holdings[0]?.symbol).toBe('MSFT');
    });

    it('should keep holdings separate between portfolios', async () => {
      const portfolio2Id = await createPortfolio('Second Portfolio');

      await addHolding(portfolioId, 'AAPL', 10, 150);
      await addHolding(portfolio2Id, 'AAPL', 20, 160);

      const holdings1 = await getHoldings(portfolioId);
      const holdings2 = await getHoldings(portfolio2Id);

      expect(holdings1).toHaveLength(1);
      expect(holdings1[0]?.shares).toBe(10);

      expect(holdings2).toHaveLength(1);
      expect(holdings2[0]?.shares).toBe(20);
    });
  });

  describe('Watchlist Operations', () => {
    it('should add a symbol to watchlist', async () => {
      const id = await addToWatchlist('AAPL');
      expect(id).toBeGreaterThan(0);

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
      expect(watchlist[0]?.symbol).toBe('AAPL');
    });

    it('should convert symbol to uppercase', async () => {
      await addToWatchlist('aapl');

      const watchlist = await getWatchlist();
      expect(watchlist[0]?.symbol).toBe('AAPL');
    });

    it('should not duplicate symbols', async () => {
      await addToWatchlist('AAPL');
      await addToWatchlist('AAPL');
      await addToWatchlist('aapl');

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
    });

    it('should check if symbol is in watchlist', async () => {
      await addToWatchlist('AAPL');

      expect(await isInWatchlist('AAPL')).toBe(true);
      expect(await isInWatchlist('aapl')).toBe(true);
      expect(await isInWatchlist('MSFT')).toBe(false);
    });

    it('should remove from watchlist', async () => {
      await addToWatchlist('AAPL');
      await addToWatchlist('MSFT');

      await removeFromWatchlist('AAPL');

      const watchlist = await getWatchlist();
      expect(watchlist).toHaveLength(1);
      expect(watchlist[0]?.symbol).toBe('MSFT');
    });

    it('should return watchlist ordered by addedAt desc', async () => {
      await addToWatchlist('AAPL');
      await addToWatchlist('MSFT');
      await addToWatchlist('GOOGL');

      const watchlist = await getWatchlist();
      expect(watchlist[0]?.symbol).toBe('GOOGL');
      expect(watchlist[2]?.symbol).toBe('AAPL');
    });
  });
});
