import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, ColorType, type Time } from 'lightweight-charts';
import type { OHLC, DateRange } from '../../lib/providers/types';

interface PriceChartProps {
  data: OHLC[];
  isLoading?: boolean;
  symbol?: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: '5Y', label: '5Y' },
];

export default function PriceChart({ data, isLoading, symbol, range, onRangeChange }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#2e2e3e' },
        horzLines: { color: '#2e2e3e' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#2e2e3e',
      },
      timeScale: {
        borderColor: '#2e2e3e',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    const chartData = data.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          {symbol && <h3 className="text-lg font-semibold text-white">{symbol}</h3>}
          {data.length > 0 && (
            <p className="text-sm text-gray-400">
              {data.length} data points
            </p>
          )}
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

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-gray-400">Loading chart data...</div>
          </div>
        )}
        <div ref={chartContainerRef} className="h-[400px]" />
        {data.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No data available for this range</p>
          </div>
        )}
      </div>
    </div>
  );
}
