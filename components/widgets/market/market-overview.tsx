"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuoteData {
  price: string;
  change: string;
  pct: string;
  up: boolean;
  raw?: { c: number; d: number; dp: number };
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPY: QuoteData = { price: "524.18", change: "+1.24", pct: "+0.24%", up: true };

const MOCK_MINI_MARKETS: { symbol: string; quote: QuoteData }[] = [
  { symbol: "QQQ", quote: { price: "448.92", change: "+2.87", pct: "+0.64%", up: true } },
  { symbol: "DXY", quote: { price: "104.32", change: "-0.18", pct: "-0.17%", up: false } },
  { symbol: "VIX", quote: { price: "14.76", change: "+0.43", pct: "+3.00%", up: true } },
  { symbol: "BTC/USD", quote: { price: "68,420", change: "-324.10", pct: "-0.47%", up: false } },
];

// ── SPY intraday demo data ───────────────────────────────────────────────────

const spyData = [
  { time: "9:30", open: 519.2, close: 520.8, high: 521.4, low: 518.7 },
  { time: "9:45", open: 520.8, close: 520.1, high: 521.2, low: 519.6 },
  { time: "10:00", open: 520.1, close: 521.9, high: 522.5, low: 519.9 },
  { time: "10:15", open: 521.9, close: 521.2, high: 522.8, low: 521.0 },
  { time: "10:30", open: 521.2, close: 522.7, high: 523.2, low: 520.9 },
  { time: "10:45", open: 522.7, close: 521.5, high: 523.1, low: 521.2 },
  { time: "11:00", open: 521.5, close: 523.4, high: 524.0, low: 521.3 },
  { time: "11:15", open: 523.4, close: 522.8, high: 524.2, low: 522.5 },
  { time: "11:30", open: 522.8, close: 524.1, high: 524.8, low: 522.6 },
  { time: "11:45", open: 524.1, close: 523.6, high: 524.9, low: 523.2 },
  { time: "12:00", open: 523.6, close: 524.8, high: 525.4, low: 523.4 },
  { time: "12:15", open: 524.8, close: 524.1, high: 525.2, low: 523.9 },
  { time: "12:30", open: 524.1, close: 524.5, high: 525.0, low: 523.8 },
  { time: "12:45", open: 524.5, close: 524.2, high: 525.1, low: 524.0 },
  { time: "13:00", open: 524.2, close: 524.8, high: 525.3, low: 523.9 },
];

// ── Candlestick chart (SVG) ─────────────────────────────────────────────────

function CandlestickChart() {
  const MIN_PRICE = 518;
  const MAX_PRICE = 526;
  const chartH = 140;
  const paddingY = 8;
  const usableH = chartH - paddingY * 2;

  function priceToY(price: number) {
    return paddingY + ((MAX_PRICE - price) / (MAX_PRICE - MIN_PRICE)) * usableH;
  }

  const candleCount = spyData.length;
  const candleWidth = (100 / candleCount) * 0.6;
  const candleSpacing = 100 / candleCount;

  return (
    <div className="relative w-full" style={{ height: chartH }}>
      <svg
        viewBox={`0 0 100 ${chartH}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-label="SPY intraday candlestick chart"
      >
        {[519, 521, 523, 525].map((price) => (
          <line
            key={price} x1="0" x2="100"
            y1={priceToY(price)} y2={priceToY(price)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.3"
          />
        ))}

        {spyData.map((d, i) => {
          const cx = i * candleSpacing + candleSpacing / 2;
          const bullish = d.close >= d.open;
          const color = bullish ? "#22c55e" : "#ef4444";
          const bodyTop = priceToY(Math.max(d.open, d.close));
          const bodyBottom = priceToY(Math.min(d.open, d.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 0.5);
          const wickTop = priceToY(d.high);
          const wickBottom = priceToY(d.low);

          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth="0.4" />
              <rect x={cx - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyH} fill={color} rx="0.3" />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
        {[525, 523, 521, 519].map((price) => (
          <span key={price} className="text-right text-[10px] text-muted-foreground/60 pr-1">
            {price}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Market Overview Widget ──────────────────────────────────────────────────

export default function MarketOverviewWidget() {
  const [spy, setSpy] = useState<QuoteData>(MOCK_SPY);
  const [miniMarkets, setMiniMarkets] = useState(MOCK_MINI_MARKETS);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch("/api/quotes?symbols=SPY,QQQ,DXY,VIX,BTCUSD");
        if (!res.ok) return;
        const data = await res.json();

        if (data.SPY) setSpy(data.SPY);

        const miniSymbols = [
          { key: "QQQ", display: "QQQ" },
          { key: "DXY", display: "DXY" },
          { key: "VIX", display: "VIX" },
          { key: "BTCUSD", display: "BTC/USD" },
        ];
        const updated = miniSymbols.map((s) => ({
          symbol: s.display,
          quote: data[s.key] ?? MOCK_MINI_MARKETS.find((m) => m.symbol === s.display)?.quote ?? MOCK_SPY,
        }));
        setMiniMarkets(updated);
      } catch {
        // keep mock data
      }
    }

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30_000);
    return () => clearInterval(interval);
  }, []);

  const changeNum = spy.raw?.d ?? parseFloat(spy.change);
  const pctNum = spy.raw?.dp ?? parseFloat(spy.pct);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Market Overview
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">SPY</span>
            <span className="text-lg font-semibold text-foreground">{spy.price}</span>
            <span className={cn("flex items-center gap-0.5 text-sm font-medium", spy.up ? "text-positive" : "text-destructive")}>
              {spy.up ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
              {changeNum >= 0 ? "+" : ""}{changeNum.toFixed(2)} ({pctNum >= 0 ? "+" : ""}{pctNum.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {["1m", "5m", "15m", "1H", "1D"].map((tf) => (
            <button
              key={tf}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                tf === "5m"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <CandlestickChart />

      <div className="flex justify-between px-1 text-[10px] text-muted-foreground/50">
        {["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-0 divide-x divide-white/5 rounded-lg border border-white/5 bg-secondary/50">
        {miniMarkets.map((m) => (
          <div key={m.symbol} className="flex flex-1 flex-col items-center py-2">
            <span className="text-[10px] font-semibold text-muted-foreground">{m.symbol}</span>
            <span className="text-xs font-semibold text-foreground">{m.quote.price}</span>
            <span className={cn("text-[10px] font-medium", m.quote.up ? "text-positive" : "text-destructive")}>
              {m.quote.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
