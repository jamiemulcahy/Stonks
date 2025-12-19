import { useState, useEffect, useRef, useCallback } from 'react';
import { usePortfolioStore } from '../../stores/portfolio';
import { useProvider } from '../../hooks/useProvider';
import type { SearchResult } from '../../lib/providers/types';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0] ?? '';
}

export default function AddHoldingModal({ isOpen, onClose }: AddHoldingModalProps) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getTodayString());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { addHolding } = usePortfolioStore();
  const provider = useProvider();

  useEffect(() => {
    if (isOpen) {
      setSymbol('');
      setShares('');
      setAvgCost('');
      setPurchaseDate(getTodayString());
      setSearchResults([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const search = useCallback(
    async (query: string) => {
      if (!provider || query.length < 1) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await provider.searchSymbols(query);
        setSearchResults(results.slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [provider]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (symbol.length >= 1) {
      debounceRef.current = setTimeout(() => {
        search(symbol);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [symbol, search]);

  const handleSelectSymbol = (result: SearchResult) => {
    setSymbol(result.symbol);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sharesNum = parseFloat(shares);
    const costNum = parseFloat(avgCost);

    if (!symbol.trim()) {
      setError('Please enter a symbol');
      return;
    }

    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    if (isNaN(costNum) || costNum <= 0) {
      setError('Please enter a valid average cost');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const addedAt = new Date(purchaseDate).getTime();
      await addHolding(symbol.toUpperCase(), sharesNum, costNum, addedAt);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background-secondary border border-border rounded-xl shadow-2xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add Holding</h2>

          <form onSubmit={handleSubmit}>
            {/* Symbol Input */}
            <div className="mb-4 relative">
              <label htmlFor="symbol" className="block text-sm text-gray-400 mb-2">
                Symbol
              </label>
              <input
                ref={inputRef}
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                className="input"
                disabled={isSubmitting}
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      type="button"
                      onClick={() => handleSelectSymbol(result)}
                      className="w-full px-4 py-2 text-left hover:bg-surface-hover"
                    >
                      <span className="font-medium text-white">{result.symbol}</span>
                      <span className="text-sm text-gray-400 ml-2 truncate">
                        {result.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <div className="absolute right-3 top-9">
                  <Spinner />
                </div>
              )}
            </div>

            {/* Shares Input */}
            <div className="mb-4">
              <label htmlFor="shares" className="block text-sm text-gray-400 mb-2">
                Number of Shares
              </label>
              <input
                id="shares"
                type="number"
                step="any"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="e.g., 10"
                className="input"
                disabled={isSubmitting}
              />
            </div>

            {/* Average Cost Input */}
            <div className="mb-4">
              <label htmlFor="avgCost" className="block text-sm text-gray-400 mb-2">
                Average Cost per Share ($)
              </label>
              <input
                id="avgCost"
                type="number"
                step="any"
                min="0"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="e.g., 150.00"
                className="input"
                disabled={isSubmitting}
              />
            </div>

            {/* Purchase Date Input */}
            <div className="mb-4">
              <label htmlFor="purchaseDate" className="block text-sm text-gray-400 mb-2">
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                max={getTodayString()}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="input"
                disabled={isSubmitting}
              />
            </div>

            {/* Cost Basis Preview */}
            {shares && avgCost && (
              <div className="mb-4 p-3 bg-surface rounded-lg">
                <p className="text-sm text-gray-400">
                  Total Cost Basis:{' '}
                  <span className="text-white font-medium">
                    ${(parseFloat(shares) * parseFloat(avgCost)).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {error && (
              <p className="text-loss text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Holding'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-5 h-5 text-gray-400 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
