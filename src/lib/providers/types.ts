export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface OHLC {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime?: number;
}

export type DateRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

export interface StockProvider {
  id: string;
  name: string;

  // Core methods
  getQuote(symbol: string): Promise<Quote>;
  getHistoricalData(symbol: string, range: DateRange): Promise<OHLC[]>;
  searchSymbols(query: string): Promise<SearchResult[]>;

  // Optional features
  getCompanyProfile?(symbol: string): Promise<CompanyProfile | null>;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry?: string;
  sector?: string;
  marketCap?: number;
  logo?: string;
  weburl?: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMIT' | 'INVALID_KEY' | 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN',
    public provider: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
