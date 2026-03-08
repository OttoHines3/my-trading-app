"use client";

import { useEffect, useState, useMemo } from "react";
import { AgCharts } from "ag-charts-react";
import "ag-charts-enterprise";
import type { AgChartOptions } from "ag-charts-enterprise";
import type { Trade } from "@/types";

interface Props {
  trade: Trade;
}

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

export function TradeChartPanel({ trade }: Props) {
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
        setCandles(parsed);
      })
      .catch(() => setCandles([]))
      .finally(() => setLoading(false));
  }, [underlying, tradeDate, resolution]);

  const chartOptions = useMemo((): AgChartOptions => {
    if (candles.length === 0) {
      return {
        data: [],
        series: [],
        background: { fill: "#16161f" },
      };
    }

    // Add entry/exit price lines as extra data points on a line series
    const entryLine = candles.map((c) => ({ ...c, entryPrice: trade.entryPrice }));
    const exitLine = candles.map((c) => ({ ...c, exitPrice: trade.exitPrice }));
    void exitLine;

    return {
      background: { fill: "#16161f" },
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      data: candles.map((c) => ({
        ...c,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
      })),
      series: [
        {
          type: "candlestick",
          xKey: "date",
          openKey: "open",
          highKey: "high",
          lowKey: "low",
          closeKey: "close",
          item: {
            up: { fill: "#22c55e", stroke: "#22c55e" },
            down: { fill: "#ef4444", stroke: "#ef4444" },
          },
        },
        {
          type: "line",
          xKey: "date",
          yKey: "entryPrice",
          stroke: "#22c55e",
          strokeWidth: 1,
          lineDash: [4, 4],
          marker: { enabled: false },
          tooltip: { enabled: false },
        },
        {
          type: "line",
          xKey: "date",
          yKey: "exitPrice",
          stroke: "#ef4444",
          strokeWidth: 1,
          lineDash: [4, 4],
          marker: { enabled: false },
          tooltip: { enabled: false },
        },
      ],
      axes: {
        x: {
          type: "ordinal-time",
          position: "bottom",
          label: {
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
          },
          gridLine: { style: [{ stroke: "rgba(255,255,255,0.06)" }] },
        },
        y: {
          type: "number",
          position: "right",
          label: {
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
          },
          gridLine: { style: [{ stroke: "rgba(255,255,255,0.06)" }] },
        },
      },
      legend: { enabled: false },
    } as AgChartOptions;
  }, [candles, trade.entryPrice, trade.exitPrice]);

  return (
    <div className="flex-1 rounded-xl bg-[#16161f] border border-white/5 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Price Chart — {underlying}
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

      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading chart data...
          </div>
        ) : candles.length === 0 ? (
          <div className="flex items-center justify-center h-full border border-dashed border-white/10 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">No candle data available</p>
              <p className="text-xs text-gray-600">
                Intraday data requires a Finnhub premium plan
              </p>
              <div className="mt-3 flex justify-center gap-4 text-xs text-gray-600">
                <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
                <span>Exit: ${trade.exitPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <AgCharts options={chartOptions} />
        )}
      </div>
    </div>
  );
}
