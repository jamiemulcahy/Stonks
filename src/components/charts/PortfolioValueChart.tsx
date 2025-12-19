import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { type PortfolioHistoryPoint, type DateRange, formatCurrency } from '../../utils/portfolioCalculations';

interface PortfolioValueChartProps {
  data: PortfolioHistoryPoint[];
  isLoading?: boolean;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: PortfolioHistoryPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const firstPayload = payload[0];
  if (!firstPayload) return null;
  const data = firstPayload.payload;

  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
      <p className="text-gray-400 text-sm">{formatDate(data.date)}</p>
      <p className="text-white font-semibold">{formatCurrency(data.value)}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatXAxisTick(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatYAxisTick(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export default function PortfolioValueChart({
  data,
  isLoading,
  range,
  onRangeChange,
}: PortfolioValueChartProps) {
  const hasData = data.length > 0;

  // Calculate if portfolio is up or down overall
  const startValue = data[0]?.value ?? 0;
  const endValue = data[data.length - 1]?.value ?? 0;
  const isPositive = endValue >= startValue;
  const gradientColor = isPositive ? '#22c55e' : '#ef4444';
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Portfolio Value</h3>
          <p className="text-sm text-gray-400">
            {hasData ? `${data.length} data points` : 'No data'}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                range === option.value
                  ? 'bg-accent text-white'
                  : 'bg-surface text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-gray-400">Loading chart data...</div>
          </div>
        )}

        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisTick}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#2e2e3e' }}
                tickLine={{ stroke: '#2e2e3e' }}
                minTickGap={50}
              />
              <YAxis
                tickFormatter={formatYAxisTick}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#2e2e3e' }}
                tickLine={{ stroke: '#2e2e3e' }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={startValue}
                stroke="#6366f1"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Add holdings to see portfolio history</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
