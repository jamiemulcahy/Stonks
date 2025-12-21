import type { DailyCandle, Holding } from '../lib/db';
import type { HoldingWithValue } from '../stores/portfolio';

/**
 * Represents a single point in portfolio value history.
 */
export interface PortfolioHistoryPoint {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total portfolio value in USD */
  value: number;
}

/**
 * Data for a single slice of the allocation pie chart.
 */
export interface AllocationData {
  /** Stock symbol */
  symbol: string;
  /** Current market value in USD */
  value: number;
  /** Percentage of total portfolio (0-100) */
  percentage: number;
  /** Hex color for the chart segment */
  color: string;
}

/**
 * Available date ranges for portfolio history chart.
 * Note: Weekend days are skipped, market holidays are not currently handled.
 */
export type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// Chart colors for pie chart segments
const CHART_COLORS = [
  '#6366f1', // accent/indigo
  '#22c55e', // gain/green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
];

export function generateChartColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    if (color) colors.push(color);
  }
  return colors;
}

export function computeAllocation(holdings: HoldingWithValue[]): AllocationData[] {
  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);

  if (totalValue === 0) return [];

  const colors = generateChartColors(holdings.length);

  const result: AllocationData[] = [];

  const filtered = holdings.filter((h) => h.currentValue && h.currentValue > 0);

  for (let index = 0; index < filtered.length; index++) {
    const holding = filtered[index];
    if (!holding) continue;

    const color = colors[index] ?? '#6366f1';
    result.push({
      symbol: holding.symbol,
      value: holding.currentValue ?? 0,
      percentage: ((holding.currentValue ?? 0) / totalValue) * 100,
      color,
    });
  }

  return result.sort((a, b) => b.value - a.value);
}

export function getDateRangeStart(range: DateRange, earliestDate: Date): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (range) {
    case '1W':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'ALL':
      return earliestDate;
  }
}

export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function generateTradingDays(startDate: Date, endDate: Date): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(formatDateString(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function computePortfolioHistory(
  holdings: Holding[],
  candlesBySymbol: Map<string, DailyCandle[]>,
  range: DateRange
): PortfolioHistoryPoint[] {
  if (holdings.length === 0) return [];

  // Find earliest holding date
  const earliestDate = new Date(Math.min(...holdings.map((h) => h.addedAt)));
  earliestDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine date range
  const rangeStart = getDateRangeStart(range, earliestDate);
  const startDate = rangeStart > earliestDate ? rangeStart : earliestDate;

  // Generate trading days
  const tradingDays = generateTradingDays(startDate, today);

  if (tradingDays.length === 0) return [];

  // Build price lookup maps for each symbol
  const priceMaps = new Map<string, Map<string, number>>();
  for (const [symbol, candles] of candlesBySymbol) {
    const priceMap = new Map<string, number>();
    for (const candle of candles) {
      priceMap.set(candle.date, candle.close);
    }
    priceMaps.set(symbol, priceMap);
  }

  // Compute portfolio value for each trading day
  const history: PortfolioHistoryPoint[] = [];
  const lastKnownPrices = new Map<string, number>();

  for (const dateStr of tradingDays) {
    const dateTs = new Date(dateStr).getTime();
    let dayValue = 0;

    for (const holding of holdings) {
      // Only include holdings that existed on this date
      if (holding.addedAt > dateTs) continue;

      const priceMap = priceMaps.get(holding.symbol);
      let price = priceMap?.get(dateStr);

      // If no price for this date, use last known price (forward-fill)
      if (price === undefined) {
        price = lastKnownPrices.get(holding.symbol);
      } else {
        lastKnownPrices.set(holding.symbol, price);
      }

      if (price !== undefined) {
        dayValue += holding.shares * price;
      }
    }

    // Only add days where we have some value
    if (dayValue > 0) {
      history.push({ date: dateStr, value: dayValue });
    }
  }

  return history;
}

/**
 * Formats a number as USD currency.
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2 for values < 1000, 0 for larger)
 */
export function formatCurrency(value: number, decimals?: number): string {
  const fractionDigits = decimals ?? (Math.abs(value) < 1000 ? 2 : 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Formats a number as a percentage string.
 * @param value - The percentage value (e.g., 12.5 for 12.5%)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
