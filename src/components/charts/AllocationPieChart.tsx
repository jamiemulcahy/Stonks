import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { HoldingWithValue } from '../../stores/portfolio';
import { computeAllocation, formatCurrency, formatPercentage, type AllocationData } from '../../utils/portfolioCalculations';

interface AllocationPieChartProps {
  holdings: HoldingWithValue[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AllocationData;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const firstPayload = payload[0];
  if (!firstPayload) return null;
  const data = firstPayload.payload;

  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
      <p className="text-white font-semibold">{data.symbol}</p>
      <p className="text-gray-400 text-sm">{formatCurrency(data.value)}</p>
      <p className="text-gray-400 text-sm">{formatPercentage(data.percentage)}</p>
    </div>
  );
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AllocationPieChart({ holdings, isLoading }: AllocationPieChartProps) {
  const allocationData = computeAllocation(holdings);

  const hasData = allocationData.length > 0;

  // Convert to plain objects for Recharts compatibility
  const chartData = allocationData.map((d) => ({
    symbol: d.symbol,
    value: d.value,
    percentage: d.percentage,
    color: d.color,
  }));

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Portfolio Allocation</h3>
        <p className="text-sm text-gray-400">
          {hasData ? `${allocationData.length} holdings` : 'No holdings'}
        </p>
      </div>

      <div className="relative h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}

        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="symbol"
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Add holdings to see allocation</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
