import { useEffect, useState, useCallback } from 'react';
import { useProvider } from '../../hooks/useProvider';
import PriceChart from '../charts/PriceChart';
import type { Quote, OHLC, DateRange, CompanyProfile } from '../../lib/providers/types';

interface StockDetailModalProps {
  symbol: string | null;
  onClose: () => void;
}

export default function StockDetailModal({ symbol, onClose }: StockDetailModalProps) {
  const provider = useProvider();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [chartData, setChartData] = useState<OHLC[]>([]);
  const [range, setRange] = useState<DateRange>('1M');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!provider || !symbol) return;

    setIsLoadingQuote(true);
    setError(null);

    try {
      const [q, p] = await Promise.all([
        provider.getQuote(symbol),
        provider.getCompanyProfile?.(symbol) ?? Promise.resolve(null),
      ]);
      setQuote(q);
      setProfile(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [provider, symbol]);

  const fetchChartData = useCallback(async () => {
    if (!provider || !symbol) return;

    setIsLoadingChart(true);

    try {
      const data = await provider.getHistoricalData(symbol, range);
      setChartData(data);
    } catch (e) {
      console.error('Failed to fetch chart data:', e);
      setChartData([]);
    } finally {
      setIsLoadingChart(false);
    }
  }, [provider, symbol, range]);

  useEffect(() => {
    if (symbol) {
      fetchQuote();
    }
  }, [symbol, fetchQuote]);

  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
  }, [symbol, range, fetchChartData]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (symbol) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [symbol, onClose]);

  if (!symbol) return null;

  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt={symbol}
                className="w-12 h-12 rounded-lg bg-white p-1"
              />
            ) : (
              <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">{symbol.slice(0, 2)}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{symbol}</h2>
              {profile?.name && (
                <p className="text-gray-400">{profile.name}</p>
              )}
              {profile?.exchange && (
                <p className="text-xs text-gray-500">{profile.exchange}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error ? (
            <div className="text-center text-loss py-8">{error}</div>
          ) : (
            <>
              {/* Quote Stats */}
              {isLoadingQuote ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-4 bg-surface rounded w-16 mb-2" />
                      <div className="h-6 bg-surface rounded w-24" />
                    </div>
                  ))}
                </div>
              ) : quote ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Price" value={`$${quote.price.toFixed(2)}`} />
                  <StatCard
                    label="Change"
                    value={`${isPositive ? '+' : ''}$${quote.change.toFixed(2)}`}
                    valueClass={isPositive ? 'text-gain' : 'text-loss'}
                  />
                  <StatCard
                    label="Change %"
                    value={`${isPositive ? '+' : ''}${quote.changePercent.toFixed(2)}%`}
                    valueClass={isPositive ? 'text-gain' : 'text-loss'}
                  />
                  <StatCard label="Prev Close" value={`$${quote.previousClose.toFixed(2)}`} />
                  <StatCard label="Open" value={`$${quote.open.toFixed(2)}`} />
                  <StatCard label="High" value={`$${quote.high.toFixed(2)}`} />
                  <StatCard label="Low" value={`$${quote.low.toFixed(2)}`} />
                  {profile?.marketCap && (
                    <StatCard
                      label="Market Cap"
                      value={formatMarketCap(profile.marketCap)}
                    />
                  )}
                </div>
              ) : null}

              {/* Chart */}
              <PriceChart
                data={chartData}
                isLoading={isLoadingChart}
                symbol={symbol}
                range={range}
                onRangeChange={setRange}
              />

              {/* Company Info */}
              {profile && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-3">Company Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {profile.industry && (
                      <div>
                        <span className="text-gray-400">Industry:</span>{' '}
                        <span className="text-white">{profile.industry}</span>
                      </div>
                    )}
                    {profile.sector && (
                      <div>
                        <span className="text-gray-400">Sector:</span>{' '}
                        <span className="text-white">{profile.sector}</span>
                      </div>
                    )}
                    {profile.weburl && (
                      <div>
                        <span className="text-gray-400">Website:</span>{' '}
                        <a
                          href={profile.weburl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-hover"
                        >
                          {new URL(profile.weburl).hostname}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  valueClass?: string;
}

function StatCard({ label, value, valueClass = 'text-white' }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(0)}`;
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
