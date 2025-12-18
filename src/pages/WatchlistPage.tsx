import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';
import { useWatchlistStore } from '../stores/watchlist';
import { useProvider } from '../hooks/useProvider';
import StockDetailModal from '../components/common/StockDetailModal';
import type { Quote } from '../lib/providers/types';

export default function WatchlistPage() {
  const { hasApiKey } = useSettingsStore();
  const { items, loadWatchlist, removeSymbol } = useWatchlistStore();
  const provider = useProvider();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    if (!provider || items.length === 0) return;

    const fetchQuotes = async () => {
      for (const item of items) {
        if (quotes[item.symbol]) continue;

        setLoading((prev) => ({ ...prev, [item.symbol]: true }));
        try {
          const quote = await provider.getQuote(item.symbol);
          setQuotes((prev) => ({ ...prev, [item.symbol]: quote }));
        } catch (e) {
          console.error(`Failed to fetch quote for ${item.symbol}:`, e);
        } finally {
          setLoading((prev) => ({ ...prev, [item.symbol]: false }));
        }
      }
    };

    fetchQuotes();
  }, [provider, items, quotes]);

  if (!hasApiKey()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-gray-400 mb-4">Configure an API key to use the watchlist.</p>
        <Link to="/settings" className="btn-primary">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Watchlist</h3>
          <p className="text-sm text-gray-400">{items.length} symbols tracked</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-center py-8">
            Your watchlist is empty. Use the search (press /) to find and add symbols.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const quote = quotes[item.symbol];
            const isLoading = loading[item.symbol];

            return (
              <WatchlistCard
                key={item.symbol}
                symbol={item.symbol}
                quote={quote}
                isLoading={isLoading}
                onRemove={() => removeSymbol(item.symbol)}
                onClick={() => setSelectedSymbol(item.symbol)}
              />
            );
          })}
        </div>
      )}

      <StockDetailModal
        symbol={selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
      />
    </div>
  );
}

interface WatchlistCardProps {
  symbol: string;
  quote?: Quote;
  isLoading?: boolean;
  onRemove: () => void;
  onClick: () => void;
}

function WatchlistCard({ symbol, quote, isLoading, onRemove, onClick }: WatchlistCardProps) {
  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <div className="card flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center">
          <span className="text-lg font-bold text-white">{symbol.slice(0, 2)}</span>
        </div>
        <div>
          <p className="font-semibold text-white">{symbol}</p>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : quote ? (
            <p className="text-sm text-gray-400">
              Open: ${quote.open.toFixed(2)} · High: ${quote.high.toFixed(2)} · Low: ${quote.low.toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Unable to fetch quote</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {quote && (
          <div className="text-right">
            <p className="text-xl font-semibold text-white">${quote.price.toFixed(2)}</p>
            <p className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </p>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-2 text-gray-400 hover:text-loss transition-colors"
          title="Remove from watchlist"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
