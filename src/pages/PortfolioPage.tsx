import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';
import { usePortfolioStore, type HoldingWithValue } from '../stores/portfolio';
import { useProvider } from '../hooks/useProvider';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory';
import type { Quote } from '../lib/providers/types';
import type { Holding } from '../lib/db';
import { formatCurrency, type DateRange } from '../utils/portfolioCalculations';
import AddHoldingModal from '../components/common/AddHoldingModal';
import CreatePortfolioModal from '../components/common/CreatePortfolioModal';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import PortfolioValueChart from '../components/charts/PortfolioValueChart';

interface HoldingWithQuote extends Holding {
  quote?: Quote;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioPage() {
  const { hasApiKey } = useSettingsStore();
  const {
    portfolios,
    activePortfolioId,
    holdings,
    loadPortfolios,
    setActivePortfolio,
    deletePortfolio,
    deleteHolding,
    getActivePortfolio,
  } = usePortfolioStore();

  const provider = useProvider();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [historyRange, setHistoryRange] = useState<DateRange>('3M');

  const activePortfolio = getActivePortfolio();

  // Portfolio history for value chart
  const {
    data: historyData,
    isLoading: historyLoading,
    failedSymbols,
  } = usePortfolioHistory(holdings, historyRange);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const fetchQuotes = useCallback(async () => {
    if (!provider || holdings.length === 0) return;

    setLoadingQuotes(true);
    const newQuotes: Record<string, Quote> = {};

    for (const holding of holdings) {
      try {
        const quote = await provider.getQuote(holding.symbol);
        newQuotes[holding.symbol] = quote;
      } catch (e) {
        console.error(`Failed to fetch quote for ${holding.symbol}:`, e);
      }
    }

    setQuotes(newQuotes);
    setLoadingQuotes(false);
  }, [provider, holdings]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

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

  // Calculate holdings with current values
  const holdingsWithQuotes: HoldingWithQuote[] = holdings.map((holding) => {
    const quote = quotes[holding.symbol];
    const currentPrice = quote?.price ?? 0;
    const currentValue = currentPrice * holding.shares;
    const costBasis = holding.avgCost * holding.shares;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      ...holding,
      quote,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent,
    };
  });

  // Map to HoldingWithValue for charts
  const holdingsWithValues: HoldingWithValue[] = holdingsWithQuotes.map((h) => ({
    ...h,
    currentPrice: h.quote?.price,
    currentValue: h.currentValue || undefined,
    gainLoss: h.gainLoss || undefined,
    gainLossPercent: h.gainLossPercent || undefined,
  }));

  // Calculate portfolio totals
  const totals = holdingsWithQuotes.reduce(
    (acc, h) => ({
      value: acc.value + h.currentValue,
      costBasis: acc.costBasis + h.costBasis,
      dayChange: acc.dayChange + (h.quote ? h.quote.change * h.shares : 0),
    }),
    { value: 0, costBasis: 0, dayChange: 0 }
  );

  const totalGainLoss = totals.value - totals.costBasis;
  const totalGainLossPercent = totals.costBasis > 0 ? (totalGainLoss / totals.costBasis) * 100 : 0;
  const dayChangePercent = totals.value > 0 ? (totals.dayChange / (totals.value - totals.dayChange)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {portfolios.length > 0 ? (
            <select
              value={activePortfolioId ?? ''}
              onChange={(e) => setActivePortfolio(Number(e.target.value))}
              className="input w-64"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-400">No portfolios yet</p>
          )}
          <button
            onClick={() => setIsCreatePortfolioOpen(true)}
            className="btn-secondary"
          >
            {portfolios.length > 0 ? 'New Portfolio' : 'Create Portfolio'}
          </button>
          {activePortfolio?.id !== undefined && (
            <button
              onClick={() => {
                const portfolioId = activePortfolio.id;
                if (portfolioId !== undefined && confirm(`Delete "${activePortfolio.name}"? This will remove all holdings.`)) {
                  deletePortfolio(portfolioId);
                }
              }}
              className="text-gray-400 hover:text-loss transition-colors"
              title="Delete portfolio"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {activePortfolio && (
          <button
            onClick={() => setIsAddHoldingOpen(true)}
            className="btn-primary"
          >
            Add Holding
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {activePortfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Value"
            value={formatCurrency(totals.value)}
            loading={loadingQuotes && holdings.length > 0}
          />
          <StatCard
            label="Total Gain/Loss"
            value={formatCurrency(totalGainLoss)}
            subValue={`${totalGainLoss >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%`}
            valueClass={totalGainLoss >= 0 ? 'text-gain' : 'text-loss'}
            loading={loadingQuotes && holdings.length > 0}
          />
          <StatCard
            label="Day Change"
            value={formatCurrency(totals.dayChange)}
            subValue={`${totals.dayChange >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`}
            valueClass={totals.dayChange >= 0 ? 'text-gain' : 'text-loss'}
            loading={loadingQuotes && holdings.length > 0}
          />
          <StatCard
            label="Holdings"
            value={holdings.length.toString()}
          />
        </div>
      )}

      {/* Failed Symbols Warning */}
      {failedSymbols.length > 0 && (
        <div className="bg-surface border border-loss/30 text-loss rounded-lg p-3 text-sm">
          Failed to load historical data for: {failedSymbols.join(', ')}.
          Chart may be incomplete.
        </div>
      )}

      {/* Charts Section */}
      {activePortfolio && holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AllocationPieChart
            holdings={holdingsWithValues}
            isLoading={loadingQuotes}
          />
          <PortfolioValueChart
            data={historyData}
            isLoading={historyLoading || loadingQuotes}
            range={historyRange}
            onRangeChange={setHistoryRange}
          />
        </div>
      )}

      {/* Holdings Table */}
      {activePortfolio && (
        <div className="card overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-4">Holdings</h3>

          {holdings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No holdings yet. Add your first holding to start tracking.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-border">
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium text-right">Shares</th>
                    <th className="pb-3 font-medium text-right">Avg Cost</th>
                    <th className="pb-3 font-medium text-right">Current Price</th>
                    <th className="pb-3 font-medium text-right">Market Value</th>
                    <th className="pb-3 font-medium text-right">Gain/Loss</th>
                    <th className="pb-3 font-medium text-right">% Return</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsWithQuotes.map((holding) => {
                    const holdingId = holding.id;
                    if (!holdingId) return null;
                    return (
                      <HoldingRow
                        key={holdingId}
                        holding={holding}
                        onDelete={() => deleteHolding(holdingId)}
                      />
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="text-sm font-medium border-t border-border">
                    <td className="pt-4 text-white">Total</td>
                    <td className="pt-4"></td>
                    <td className="pt-4"></td>
                    <td className="pt-4"></td>
                    <td className="pt-4 text-right text-white">{formatCurrency(totals.value)}</td>
                    <td className={`pt-4 text-right ${totalGainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {formatCurrency(totalGainLoss)}
                    </td>
                    <td className={`pt-4 text-right ${totalGainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
                    </td>
                    <td className="pt-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddHoldingModal
        isOpen={isAddHoldingOpen}
        onClose={() => setIsAddHoldingOpen(false)}
      />
      <CreatePortfolioModal
        isOpen={isCreatePortfolioOpen}
        onClose={() => setIsCreatePortfolioOpen(false)}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  valueClass?: string;
  loading?: boolean;
}

function StatCard({ label, value, subValue, valueClass = 'text-white', loading }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 bg-surface rounded animate-pulse" />
      ) : (
        <>
          <p className={`text-2xl font-semibold ${valueClass}`}>{value}</p>
          {subValue && <p className={`text-sm ${valueClass}`}>{subValue}</p>}
        </>
      )}
    </div>
  );
}

interface HoldingRowProps {
  holding: HoldingWithQuote;
  onDelete: () => void;
}

function HoldingRow({ holding, onDelete }: HoldingRowProps) {
  const isPositive = holding.gainLoss >= 0;
  const hasQuote = !!holding.quote;

  return (
    <tr className="border-b border-border/50 hover:bg-surface/50">
      <td className="py-4">
        <span className="font-medium text-white">{holding.symbol}</span>
      </td>
      <td className="py-4 text-right text-gray-300">{holding.shares.toLocaleString()}</td>
      <td className="py-4 text-right text-gray-300">{formatCurrency(holding.avgCost)}</td>
      <td className="py-4 text-right text-gray-300">
        {holding.quote ? formatCurrency(holding.quote.price) : '—'}
      </td>
      <td className="py-4 text-right text-white font-medium">
        {hasQuote ? formatCurrency(holding.currentValue) : '—'}
      </td>
      <td className={`py-4 text-right ${isPositive ? 'text-gain' : 'text-loss'}`}>
        {hasQuote ? formatCurrency(holding.gainLoss) : '—'}
      </td>
      <td className={`py-4 text-right ${isPositive ? 'text-gain' : 'text-loss'}`}>
        {hasQuote ? `${isPositive ? '+' : ''}${holding.gainLossPercent.toFixed(2)}%` : '—'}
      </td>
      <td className="py-4 text-right">
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-loss transition-colors"
          title="Remove holding"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
