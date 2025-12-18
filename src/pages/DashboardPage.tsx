import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';

export default function DashboardPage() {
  const { hasApiKey, activeProvider } = useSettingsStore();

  if (!hasApiKey()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-6">
          <KeyIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Welcome to Stonks</h2>
        <p className="text-gray-400 mb-6 max-w-md">
          To get started, you'll need to configure an API key for one of our supported stock data providers.
        </p>
        <Link to="/settings" className="btn-primary">
          Configure API Key
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Watchlist Items" value="0" />
        <StatCard label="Portfolio Value" value="$0.00" />
        <StatCard label="Today's Change" value="$0.00" change={0} />
        <StatCard label="API Provider" value={activeProvider || 'None'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Watchlist</h3>
          <p className="text-gray-500">Your watchlist is empty. Search for symbols to add stocks.</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>
          <p className="text-gray-500">No portfolio configured. Add holdings in the Portfolio tab.</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
}

function StatCard({ label, value, change }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {change !== undefined && (
        <p className={`text-sm ${change >= 0 ? 'text-gain' : 'text-loss'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      )}
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}
