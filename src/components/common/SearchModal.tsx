import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProvider } from '../../hooks/useProvider';
import { useWatchlistStore } from '../../stores/watchlist';
import type { SearchResult } from '../../lib/providers/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const provider = useProvider();
  const { addSymbol, isInWatchlist } = useWatchlistStore();

  const search = useCallback(
    async (searchQuery: string) => {
      if (!provider || searchQuery.length < 1) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await provider.searchSymbols(searchQuery);
        setResults(searchResults);
      } catch (e) {
        setError((e as Error).message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [provider]
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 1) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddToWatchlist = async (symbol: string) => {
    await addSymbol(symbol);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-background-secondary border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a stock symbol..."
            className="flex-1 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
          {isSearching && <Spinner />}
          <kbd className="px-2 py-1 bg-surface rounded text-xs text-gray-500">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!provider ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 mb-3">Configure an API key to search for stocks.</p>
              <Link
                to="/settings"
                onClick={onClose}
                className="text-accent hover:text-accent-hover"
              >
                Go to Settings
              </Link>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-loss">{error}</div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => {
                const inWatchlist = isInWatchlist(result.symbol);
                return (
                  <li
                    key={result.symbol}
                    className="px-4 py-3 hover:bg-surface flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{result.symbol}</p>
                      <p className="text-sm text-gray-400 truncate max-w-xs">
                        {result.name}
                      </p>
                      <p className="text-xs text-gray-500">{result.type}</p>
                    </div>
                    <button
                      onClick={() => handleAddToWatchlist(result.symbol)}
                      disabled={inWatchlist}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        inWatchlist
                          ? 'bg-surface text-gray-500 cursor-not-allowed'
                          : 'bg-accent hover:bg-accent-hover text-white'
                      }`}
                    >
                      {inWatchlist ? 'In Watchlist' : 'Add'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query.length > 0 && !isSearching ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Start typing to search for stocks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
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
