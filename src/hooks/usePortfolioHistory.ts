import { useState, useEffect, useCallback, useRef } from 'react';
import { useProvider } from './useProvider';
import { useSettingsStore } from '../stores/settings';
import {
  getCandlesInRange,
  cacheCandles,
  type Holding,
  type DailyCandle,
} from '../lib/db';
import {
  computePortfolioHistory,
  formatDateString,
  type PortfolioHistoryPoint,
  type DateRange,
} from '../utils/portfolioCalculations';

interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[];
  isLoading: boolean;
  error: string | null;
  failedSymbols: string[];
  refetch: () => void;
}

/**
 * Hook to compute historical portfolio value from candle data.
 * Fetches and caches historical candles for each holding, then computes
 * daily portfolio values based on shares * close price.
 */
export function usePortfolioHistory(
  holdings: Holding[],
  range: DateRange
): UsePortfolioHistoryResult {
  const [data, setData] = useState<PortfolioHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);

  const provider = useProvider();
  const { activeProvider } = useSettingsStore();

  // Track current fetch to prevent race conditions
  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistoricalData = useCallback(async () => {
    if (!provider || !activeProvider || holdings.length === 0) {
      setData([]);
      setError(null);
      setFailedSymbols([]);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Track this fetch to detect stale responses
    const currentFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);
    setFailedSymbols([]);

    try {
      // Get unique symbols from holdings
      const symbols = [...new Set(holdings.map((h) => h.symbol))];

      // Find the earliest holding date
      const earliestDate = new Date(Math.min(...holdings.map((h) => h.addedAt)));
      const today = new Date();
      const fromDate = formatDateString(earliestDate);
      const toDate = formatDateString(today);

      // Fetch candles for each symbol
      const candlesBySymbol = new Map<string, DailyCandle[]>();
      const failed: string[] = [];

      for (const symbol of symbols) {
        // Check if this fetch was superseded
        if (currentFetchId !== fetchIdRef.current) {
          return; // Abort - a newer fetch is in progress
        }

        // First try to get from cache
        let candles = await getCandlesInRange(symbol, activeProvider, fromDate, toDate);

        // Validate cache coverage - check if we have data for the required date range
        const needsFetch = candles.length === 0 || !validateCacheCoverage(candles, fromDate, toDate);

        if (needsFetch) {
          try {
            const ohlcData = await provider.getHistoricalData(symbol, 'MAX');

            // Convert OHLC to DailyCandle format
            const dailyCandles: DailyCandle[] = ohlcData.map((ohlc) => ({
              symbol: symbol.toUpperCase(),
              date: formatDateString(new Date(ohlc.time * 1000)),
              provider: activeProvider,
              open: ohlc.open,
              high: ohlc.high,
              low: ohlc.low,
              close: ohlc.close,
              volume: ohlc.volume,
            }));

            // Cache the candles
            if (dailyCandles.length > 0) {
              await cacheCandles(symbol, activeProvider, dailyCandles);
            }

            candles = dailyCandles;
          } catch (fetchError) {
            console.warn(`Failed to fetch historical data for ${symbol}:`, fetchError);
            failed.push(symbol);
            // Continue with other symbols
          }
        }

        if (candles.length > 0) {
          candlesBySymbol.set(symbol, candles);
        }
      }

      // Check again if this fetch is still current
      if (currentFetchId !== fetchIdRef.current) {
        return;
      }

      // Update failed symbols state
      if (failed.length > 0) {
        setFailedSymbols(failed);
      }

      // Compute portfolio history
      const history = computePortfolioHistory(holdings, candlesBySymbol, range);
      setData(history);
      setError(null);
    } catch (e) {
      // Only update state if this is still the current fetch
      if (currentFetchId === fetchIdRef.current) {
        setError((e as Error).message);
        setData([]);
      }
    } finally {
      // Only update loading state if this is still the current fetch
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [holdings, range, provider, activeProvider]);

  useEffect(() => {
    fetchHistoricalData();

    // Cleanup: abort any in-flight request when dependencies change or unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHistoricalData]);

  return {
    data,
    isLoading,
    error,
    failedSymbols,
    refetch: fetchHistoricalData,
  };
}

/**
 * Validates that cached candles cover the required date range.
 * Returns false if the cache is missing data for the start of the range.
 */
function validateCacheCoverage(
  candles: DailyCandle[],
  fromDate: string,
  toDate: string
): boolean {
  if (candles.length === 0) return false;

  // Sort by date to find earliest and latest
  const sorted = [...candles].sort((a, b) => a.date.localeCompare(b.date));
  const earliestCached = sorted[0]?.date;
  const latestCached = sorted[sorted.length - 1]?.date;

  if (!earliestCached || !latestCached) return false;

  // Check if cache covers the required range (with some tolerance for weekends)
  // We allow up to 5 days tolerance for the start date to account for weekends/holidays
  const fromDateObj = new Date(fromDate);
  const earliestCachedObj = new Date(earliestCached);
  const daysDiff = (earliestCachedObj.getTime() - fromDateObj.getTime()) / (1000 * 60 * 60 * 24);

  // If cached data starts more than 5 days after required start, refetch
  if (daysDiff > 5) return false;

  // Check if cache is reasonably up to date (within 2 days of today)
  const toDateObj = new Date(toDate);
  const latestCachedObj = new Date(latestCached);
  const endDaysDiff = (toDateObj.getTime() - latestCachedObj.getTime()) / (1000 * 60 * 60 * 24);

  if (endDaysDiff > 2) return false;

  return true;
}
