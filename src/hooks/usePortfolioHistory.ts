import { useState, useEffect, useCallback } from 'react';
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
  refetch: () => void;
}

export function usePortfolioHistory(
  holdings: Holding[],
  range: DateRange
): UsePortfolioHistoryResult {
  const [data, setData] = useState<PortfolioHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useProvider();
  const { activeProvider } = useSettingsStore();

  const fetchHistoricalData = useCallback(async () => {
    if (!provider || !activeProvider || holdings.length === 0) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

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

      for (const symbol of symbols) {
        // First try to get from cache
        let candles = await getCandlesInRange(symbol, activeProvider, fromDate, toDate);

        // If no cached data or incomplete, fetch from provider
        if (candles.length === 0) {
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
            // Continue with other symbols
          }
        }

        if (candles.length > 0) {
          candlesBySymbol.set(symbol, candles);
        }
      }

      // Compute portfolio history
      const history = computePortfolioHistory(holdings, candlesBySymbol, range);
      setData(history);
    } catch (e) {
      setError((e as Error).message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [holdings, range, provider, activeProvider]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistoricalData,
  };
}
