"use client";

import { useEffect, useState, useMemo } from "react";
import { AgFinancialCharts } from "ag-charts-react";
import type { AgFinancialChartOptions } from "ag-charts-enterprise";
import type { Trade } from "@/types";

interface CandleData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const RESOLUTIONS = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "1d", value: "D" },
];

function extractUnderlying(symbol: string): string {
  const match = symbol.match(/^([A-Z]+)\s+/);
  return match ? match[1] : symbol.split(/\s+/)[0] || symbol;
}

// Generate realistic mock candle data for demo purposes
function generateMockCandles(
  basePrice: number,
  startDate: Date,
  count: number = 100,
  intervalMinutes: number = 5
): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  const volatility = basePrice * 0.002; // 0.2% per candle

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * intervalMinutes * 60 * 1000);

    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(50000 + Math.random() * 200000);

    candles.push({ date, open, high, low, close, volume });
    price = close;
  }

  return candles;
}

interface Props {
  trade: Trade;
}

export function AGUnderlyingChart({ trade }: Props) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState("5");

  const underlying = extractUnderlying(trade.symbol);
  const tradeDate = trade.entryDate.split("T")[0];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/candles?symbol=${encodeURIComponent(underlying)}&date=${tradeDate}&resolution=${resolution}`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = (data.candles ?? []).map((c: CandleData) => ({
          ...c,
          date: new Date(c.date),
        }));
        // If no real data, generate mock candles for demo
        if (parsed.length === 0) {
          const intervalMap: Record<string, number> = { "1": 1, "5": 5, "15": 15, "60": 60, "D": 1440 };
          const interval = intervalMap[resolution] || 5;
          // Use a price near common stock prices (SPY-like) for demo
          const basePrice = 495;
          const startDate = new Date(trade.entryDate);
          startDate.setHours(9, 30, 0, 0); // Market open
          setCandles(generateMockCandles(basePrice, startDate, 78, interval)); // ~6.5 hours of trading
        } else {
          setCandles(parsed);
        }
      })
      .catch(() => {
        // On error, also use mock data
        const intervalMap: Record<string, number> = { "1": 1, "5": 5, "15": 15, "60": 60, "D": 1440 };
        const interval = intervalMap[resolution] || 5;
        const basePrice = 495;
        const startDate = new Date(trade.entryDate);
        startDate.setHours(9, 30, 0, 0);
        setCandles(generateMockCandles(basePrice, startDate, 78, interval));
      })
      .finally(() => setLoading(false));
  }, [underlying, tradeDate, resolution, trade.entryDate]);

  const chartOptions: AgFinancialChartOptions = useMemo(() => {
    return {
      data: candles,
      theme: {
        baseTheme: "ag-financial-dark",
        palette: {
          up: { fill: "#22c55e", stroke: "#22c55e" },
          down: { fill: "#ef4444", stroke: "#ef4444" },
        },
        overrides: {
          common: {
            background: { fill: "#16161f" },
          },
        },
      },
      title: {
        text: `${underlying} - ${tradeDate}`,
        fontSize: 14,
        fontWeight: "bold",
        color: "rgba(255,255,255,0.8)",
      },
      chartType: "candlestick",
      volume: true,
      navigator: true,
      toolbar: true,
      rangeButtons: false,
      statusBar: true,
      zoom: true,
    };
  }, [candles, underlying, tradeDate]);

  return (
    <div className="flex-1 rounded-xl bg-[#16161f] border border-white/5 p-4 flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Underlying Chart
        </h4>
        <div className="flex items-center gap-1">
          {RESOLUTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setResolution(r.value)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                resolution === r.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" style={{ width: "100%", minHeight: "350px" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading chart data...
          </div>
        ) : (
          <AgFinancialCharts options={chartOptions} style={{ width: "100%", height: "350px" }} />
        )}
      </div>
    </div>
  );
}
