import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchModal from '../common/SearchModal';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/portfolio': 'Portfolio',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const title = pageTitles[location.pathname] || 'Stonks';

  return (
    <>
      <header className="h-16 bg-background-secondary border-b border-border flex items-center justify-between px-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-gray-400 hover:text-gray-200 hover:border-border-light transition-colors"
          >
            <SearchIcon className="w-4 h-4" />
            <span>Search symbols...</span>
            <kbd className="ml-2 px-2 py-0.5 bg-background rounded text-xs text-gray-500">
              /
            </kbd>
          </button>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
