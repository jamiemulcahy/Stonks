import type { StockProvider, Quote, OHLC, SearchResult, DateRange, CompanyProfile } from './types';
import { ProviderError } from './types';

const BASE_URL = 'https://finnhub.io/api/v1';

export function createFinnhubProvider(apiKey: string): StockProvider {
  async function request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('token', apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (response.status === 401) {
      throw new ProviderError('Invalid API key', 'INVALID_KEY', 'finnhub');
    }

    if (response.status === 429) {
      throw new ProviderError('Rate limit exceeded', 'RATE_LIMIT', 'finnhub');
    }

    if (!response.ok) {
      throw new ProviderError(`HTTP ${response.status}`, 'UNKNOWN', 'finnhub');
    }

    return response.json();
  }

  return {
    id: 'finnhub',
    name: 'Finnhub',

    async getQuote(symbol: string): Promise<Quote> {
      interface FinnhubQuote {
        c: number; // Current price
        d: number; // Change
        dp: number; // Percent change
        h: number; // High price of the day
        l: number; // Low price of the day
        o: number; // Open price of the day
        pc: number; // Previous close price
        t: number; // Timestamp
      }

      const data = await request<FinnhubQuote>('/quote', { symbol: symbol.toUpperCase() });

      if (data.c === 0 && data.pc === 0) {
        throw new ProviderError(`Symbol not found: ${symbol}`, 'NOT_FOUND', 'finnhub');
      }

      return {
        symbol: symbol.toUpperCase(),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: data.t * 1000,
      };
    },

    async getHistoricalData(symbol: string, range: DateRange): Promise<OHLC[]> {
      const now = Math.floor(Date.now() / 1000);
      const rangeSeconds: Record<DateRange, number> = {
        '1D': 86400,
        '1W': 86400 * 7,
        '1M': 86400 * 30,
        '3M': 86400 * 90,
        '6M': 86400 * 180,
        '1Y': 86400 * 365,
        '5Y': 86400 * 365 * 5,
        MAX: 86400 * 365 * 20,
      };

      const from = now - rangeSeconds[range];
      const resolution = range === '1D' ? '5' : range === '1W' ? '15' : 'D';

      interface FinnhubCandles {
        c: number[];
        h: number[];
        l: number[];
        o: number[];
        t: number[];
        v: number[];
        s: string;
      }

      const data = await request<FinnhubCandles>('/stock/candle', {
        symbol: symbol.toUpperCase(),
        resolution,
        from: from.toString(),
        to: now.toString(),
      });

      if (data.s === 'no_data' || !data.t?.length) {
        return [];
      }

      return data.t.map((time, i) => ({
        time,
        open: data.o[i]!,
        high: data.h[i]!,
        low: data.l[i]!,
        close: data.c[i]!,
        volume: data.v[i],
      }));
    },

    async searchSymbols(query: string): Promise<SearchResult[]> {
      interface FinnhubSearchResult {
        count: number;
        result: Array<{
          description: string;
          displaySymbol: string;
          symbol: string;
          type: string;
        }>;
      }

      const data = await request<FinnhubSearchResult>('/search', { q: query });

      return data.result.slice(0, 10).map((item) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
      }));
    },

    async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
      interface FinnhubProfile {
        country: string;
        currency: string;
        exchange: string;
        finnhubIndustry: string;
        ipo: string;
        logo: string;
        marketCapitalization: number;
        name: string;
        phone: string;
        shareOutstanding: number;
        ticker: string;
        weburl: string;
      }

      const data = await request<FinnhubProfile>('/stock/profile2', {
        symbol: symbol.toUpperCase(),
      });

      if (!data.name) {
        return null;
      }

      return {
        symbol: data.ticker,
        name: data.name,
        exchange: data.exchange,
        industry: data.finnhubIndustry,
        marketCap: data.marketCapitalization * 1_000_000, // Convert from millions
        logo: data.logo,
        weburl: data.weburl,
      };
    },
  };
}
