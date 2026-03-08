"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

interface Props {
  trade: Trade;
}

export function TradeChartPanel({ trade }: Props) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState("5");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);

  const underlying = extractUnderlying(trade.symbol);
  const tradeDate = trade.entryDate.split("T")[0];

  // Fetch candle data
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

  // Build chart
  const buildChart = useCallback(async () => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Dynamically import lightweight-charts (client-only)
    const { createChart, ColorType, CrosshairMode } = await import("lightweight-charts");

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#16161f" },
        textColor: "rgba(255,255,255,0.4)",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: resolution !== "D",
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Candlestick series (v5 API)
    const { CandlestickSeries, HistogramSeries } = await import("lightweight-charts");

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const candleSeriesData = candles.map((c) => ({
      time: Math.floor(c.date.getTime() / 1000) as import("lightweight-charts").UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(candleSeriesData);

    // Volume series (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map((c) => ({
        time: Math.floor(c.date.getTime() / 1000) as import("lightweight-charts").UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
      }))
    );

    // Entry/exit markers (v5 API: createSeriesMarkers)
    if (trade.entryPrice > 0 && candleSeriesData.length > 0) {
      const { createSeriesMarkers } = await import("lightweight-charts");

      const markers: import("lightweight-charts").SeriesMarker<import("lightweight-charts").Time>[] = [];

      if (trade.entryPrice > 0) {
        let entryIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < candleSeriesData.length; i++) {
          const diff = Math.abs(candleSeriesData[i].low - trade.entryPrice);
          if (diff < minDiff) { minDiff = diff; entryIdx = i; }
        }
        markers.push({
          time: candleSeriesData[entryIdx].time,
          position: "belowBar",
          color: "#22c55e",
          shape: "arrowUp",
          text: `Entry $${trade.entryPrice.toFixed(2)}`,
        });
      }

      if (trade.exitPrice > 0) {
        let exitIdx = candleSeriesData.length - 1;
        let minD = Infinity;
        for (let i = 0; i < candleSeriesData.length; i++) {
          const diff = Math.abs(candleSeriesData[i].high - trade.exitPrice);
          if (diff < minD) { minD = diff; exitIdx = i; }
        }
        markers.push({
          time: candleSeriesData[exitIdx].time,
          position: "aboveBar",
          color: "#ef4444",
          shape: "arrowDown",
          text: `Exit $${trade.exitPrice.toFixed(2)}`,
        });
      }

      markers.sort((a, b) => (a.time as number) - (b.time as number));
      createSeriesMarkers(candleSeries, markers);
    }

    // Entry/exit price lines
    if (trade.entryPrice > 0) {
      candleSeries.createPriceLine({
        price: trade.entryPrice,
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "Entry",
      });
    }
    if (trade.exitPrice > 0) {
      candleSeries.createPriceLine({
        price: trade.exitPrice,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "Exit",
      });
    }

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, trade.entryPrice, trade.exitPrice, resolution]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    buildChart().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cleanup?.();
    };
  }, [buildChart]);

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
          <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
