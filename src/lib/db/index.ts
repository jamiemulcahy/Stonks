import Dexie, { type EntityTable } from 'dexie';

export interface CachedQuote {
  symbol: string;
  provider: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: number;
}

export interface DailyCandle {
  id?: number;
  symbol: string;
  date: string; // YYYY-MM-DD
  provider: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface WatchlistItem {
  id?: number;
  symbol: string;
  addedAt: number;
  notes?: string;
}

export interface Portfolio {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Holding {
  id?: number;
  portfolioId: number;
  symbol: string;
  shares: number;
  avgCost: number;
  addedAt: number;
}

export interface CacheMeta {
  symbol: string;
  provider: string;
  lastSync: number;
  candleCount: number;
}

class StocksDatabase extends Dexie {
  quotes!: EntityTable<CachedQuote, 'symbol'>;
  dailyCandles!: EntityTable<DailyCandle, 'id'>;
  watchlist!: EntityTable<WatchlistItem, 'id'>;
  portfolios!: EntityTable<Portfolio, 'id'>;
  holdings!: EntityTable<Holding, 'id'>;
  cacheMeta!: EntityTable<CacheMeta, 'symbol'>;

  constructor() {
    super('StonksDB');

    this.version(1).stores({
      quotes: 'symbol, provider, lastUpdated',
      dailyCandles: '++id, [symbol+date], symbol, date, provider',
      watchlist: '++id, symbol, addedAt',
      portfolios: '++id, name, createdAt',
      holdings: '++id, portfolioId, symbol',
      cacheMeta: 'symbol, provider',
    });
  }
}

export const db = new StocksDatabase();

// Cache helpers
const QUOTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CANDLE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedQuote(symbol: string): Promise<CachedQuote | undefined> {
  const cached = await db.quotes.get(symbol.toUpperCase());
  if (cached && Date.now() - cached.lastUpdated < QUOTE_CACHE_TTL) {
    return cached;
  }
  return undefined;
}

export async function cacheQuote(quote: CachedQuote): Promise<void> {
  await db.quotes.put({ ...quote, symbol: quote.symbol.toUpperCase() });
}

export async function getCachedCandles(
  symbol: string,
  provider: string
): Promise<DailyCandle[]> {
  const meta = await db.cacheMeta.get(symbol.toUpperCase());
  if (!meta || Date.now() - meta.lastSync > CANDLE_CACHE_TTL) {
    return [];
  }

  return db.dailyCandles
    .where('symbol')
    .equals(symbol.toUpperCase())
    .and((c) => c.provider === provider)
    .sortBy('date');
}

export async function cacheCandles(
  symbol: string,
  provider: string,
  candles: DailyCandle[]
): Promise<void> {
  const upperSymbol = symbol.toUpperCase();

  // Clear existing candles for this symbol/provider
  await db.dailyCandles
    .where('symbol')
    .equals(upperSymbol)
    .and((c) => c.provider === provider)
    .delete();

  // Add new candles
  await db.dailyCandles.bulkPut(
    candles.map((c) => ({ ...c, symbol: upperSymbol }))
  );

  // Update cache metadata
  await db.cacheMeta.put({
    symbol: upperSymbol,
    provider,
    lastSync: Date.now(),
    candleCount: candles.length,
  });
}

// Watchlist helpers
export async function addToWatchlist(symbol: string): Promise<number> {
  const existing = await db.watchlist.where('symbol').equals(symbol.toUpperCase()).first();
  if (existing?.id) {
    return existing.id;
  }

  const id = await db.watchlist.add({
    symbol: symbol.toUpperCase(),
    addedAt: Date.now(),
  });
  return id as number;
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  await db.watchlist.where('symbol').equals(symbol.toUpperCase()).delete();
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return db.watchlist.orderBy('addedAt').reverse().toArray();
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  const count = await db.watchlist.where('symbol').equals(symbol.toUpperCase()).count();
  return count > 0;
}

// Storage utilities
export async function getStorageStatus() {
  if (!navigator.storage?.estimate) {
    return null;
  }

  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const persisted = (await navigator.storage.persisted?.()) ?? false;

  return {
    persisted,
    usedMB: (usage / 1024 / 1024).toFixed(2),
    quotaMB: (quota / 1024 / 1024).toFixed(2),
    percentUsed: ((usage / quota) * 100).toFixed(1),
  };
}

export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    return false;
  }
  return navigator.storage.persist();
}

// Cache integrity check
export async function verifyCacheIntegrity(): Promise<string[]> {
  const meta = await db.cacheMeta.toArray();
  const corrupted: string[] = [];

  for (const entry of meta) {
    const actualCount = await db.dailyCandles
      .where('symbol')
      .equals(entry.symbol)
      .count();

    if (actualCount !== (entry.candleCount ?? 0)) {
      corrupted.push(entry.symbol);
    }
  }

  return corrupted;
}
