import { useSettingsStore } from '../stores/settings';
import { Link } from 'react-router-dom';

export default function PortfolioPage() {
  const { hasApiKey } = useSettingsStore();

  if (!hasApiKey()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-gray-400 mb-4">Configure an API key to track your portfolio.</p>
        <Link to="/settings" className="btn-primary">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Portfolio</h3>
        <button className="btn-primary">Add Holding</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Total Value</p>
          <p className="text-2xl font-semibold text-white">$0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Total Gain/Loss</p>
          <p className="text-2xl font-semibold text-white">$0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-1">Holdings</p>
          <p className="text-2xl font-semibold text-white">0</p>
        </div>
      </div>

      <div className="card">
        <p className="text-gray-500 text-center py-8">
          No holdings yet. Add your first holding to start tracking your portfolio.
        </p>
      </div>
    </div>
  );
}
