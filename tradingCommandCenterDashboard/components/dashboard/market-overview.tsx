"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
} from "recharts"

// ── SPY candlestick-style data (OHLC approximated as bars) ───────────────────
// We render as a "candlestick" using two superimposed Bar layers: body + wick
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
]

// Transform to recharts-friendly format: bottom + body height
const candleData = spyData.map((d) => {
  const bullish = d.close >= d.open
  const bodyLow = Math.min(d.open, d.close)
  const bodyHigh = Math.max(d.open, d.close)
  return {
    time: d.time,
    wickRange: [d.low, d.high] as [number, number],
    bodyLow,
    bodyHeight: bodyHigh - bodyLow,
    bullish,
    // For wick rendering: split into lower wick (low→bodyLow) and upper wick (bodyHigh→high)
    lowerWickBottom: d.low,
    lowerWickHeight: bodyLow - d.low,
    upperWickBottom: bodyHigh,
    upperWickHeight: d.high - bodyHigh,
    // fill color
    fill: bullish ? "#22c55e" : "#ef4444",
  }
})

// Custom candlestick bar shape
function CandleBar(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: (typeof candleData)[0]
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  if (!payload) return null

  const { bullish, fill } = payload

  // Recharts gives us the body rectangle via y + height on the stacked bar
  // We need to draw wick lines manually based on the base chart's y-axis scale.
  // Since we can't easily get the scale here, we render just the bodies as colored bars.
  return (
    <rect
      x={x + 1}
      y={y}
      width={Math.max(width - 2, 1)}
      height={Math.max(height, 1)}
      fill={fill}
      rx={1}
    />
  )
}

// Lightweight candlestick chart using SVG overlay approach
function CandlestickChart() {
  const MIN_PRICE = 518
  const MAX_PRICE = 526

  const chartH = 140
  const chartW = 100 // percentage relative
  const paddingY = 8
  const usableH = chartH - paddingY * 2

  function priceToY(price: number) {
    return paddingY + ((MAX_PRICE - price) / (MAX_PRICE - MIN_PRICE)) * usableH
  }

  const candleCount = spyData.length
  const candleWidth = (100 / candleCount) * 0.6
  const candleSpacing = 100 / candleCount

  return (
    <div className="relative w-full" style={{ height: chartH }}>
      <svg
        viewBox={`0 0 100 ${chartH}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-label="SPY intraday candlestick chart"
      >
        {/* Grid lines */}
        {[519, 521, 523, 525].map((price) => (
          <line
            key={price}
            x1="0"
            x2="100"
            y1={priceToY(price)}
            y2={priceToY(price)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.3"
          />
        ))}

        {/* Candles */}
        {spyData.map((d, i) => {
          const cx = i * candleSpacing + candleSpacing / 2
          const bullish = d.close >= d.open
          const color = bullish ? "#22c55e" : "#ef4444"
          const bodyTop = priceToY(Math.max(d.open, d.close))
          const bodyBottom = priceToY(Math.min(d.open, d.close))
          const bodyH = Math.max(bodyBottom - bodyTop, 0.5)
          const wickTop = priceToY(d.high)
          const wickBottom = priceToY(d.low)

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={cx}
                x2={cx}
                y1={wickTop}
                y2={wickBottom}
                stroke={color}
                strokeWidth="0.4"
              />
              {/* Body */}
              <rect
                x={cx - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyH}
                fill={color}
                rx="0.3"
              />
            </g>
          )
        })}
      </svg>

      {/* Price labels on right */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
        {[525, 523, 521, 519].map((price) => (
          <span key={price} className="text-right text-[10px] text-muted-foreground/60 pr-1">
            {price}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Mini market row ──────────────────────────────────────────────────────────
const miniMarkets = [
  { symbol: "QQQ", price: "448.92", change: "+0.64%", up: true },
  { symbol: "DXY", price: "104.32", change: "-0.17%", up: false },
  { symbol: "VIX", price: "14.76", change: "+3.00%", up: true },
  { symbol: "BTC/USD", price: "68,420", change: "-0.47%", up: false },
]

// ── Market Overview card ──────────────────────────────────────────────────────
export function MarketOverview() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Market Overview
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">SPY</span>
            <span className="text-lg font-semibold text-foreground">524.18</span>
            <span className="flex items-center gap-0.5 text-sm font-medium text-positive">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              +1.24 (0.24%)
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

      {/* Candlestick chart */}
      <CandlestickChart />

      {/* Time axis */}
      <div className="flex justify-between px-1 text-[10px] text-muted-foreground/50">
        {["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Mini market list */}
      <div className="mt-1 flex items-center gap-0 divide-x divide-white/5 rounded-lg border border-white/5 bg-secondary/50">
        {miniMarkets.map((m) => (
          <div key={m.symbol} className="flex flex-1 flex-col items-center py-2">
            <span className="text-[10px] font-semibold text-muted-foreground">{m.symbol}</span>
            <span className="text-xs font-semibold text-foreground">{m.price}</span>
            <span
              className={cn(
                "text-[10px] font-medium",
                m.up ? "text-positive" : "text-destructive"
              )}
            >
              {m.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Economic Calendar ─────────────────────────────────────────────────────────
type Impact = "HIGH" | "MED" | "LOW"

const calendarEvents: {
  day: string
  time: string
  name: string
  impact: Impact
  forecast: string
  previous: string
}[] = [
  { day: "Today", time: "08:30", name: "CPI m/m", impact: "HIGH", forecast: "0.3%", previous: "0.4%" },
  { day: "Today", time: "08:30", name: "Core CPI m/m", impact: "HIGH", forecast: "0.3%", previous: "0.3%" },
  { day: "Today", time: "10:00", name: "Fed Chair Speech", impact: "HIGH", forecast: "—", previous: "—" },
  { day: "Today", time: "14:00", name: "Beige Book", impact: "MED", forecast: "—", previous: "—" },
  { day: "Tomorrow", time: "08:30", name: "PPI m/m", impact: "MED", forecast: "0.2%", previous: "0.3%" },
  { day: "Tomorrow", time: "08:30", name: "Jobless Claims", impact: "MED", forecast: "215K", previous: "218K" },
  { day: "Tomorrow", time: "10:00", name: "Crude Oil Inventories", impact: "LOW", forecast: "-1.1M", previous: "2.3M" },
]

const impactStyles: Record<Impact, string> = {
  HIGH: "bg-destructive/20 text-destructive",
  MED: "bg-amber-400/20 text-amber-400",
  LOW: "bg-white/10 text-muted-foreground",
}

export function EconomicCalendar() {
  const today = calendarEvents.filter((e) => e.day === "Today")
  const tomorrow = calendarEvents.filter((e) => e.day === "Tomorrow")

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Economic Calendar
      </p>

      <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin flex-1">
        {/* Today */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground/60">Today</p>
          <div className="flex flex-col gap-1">
            {today.map((ev, i) => (
              <EventRow key={i} event={ev} />
            ))}
          </div>
        </div>

        {/* Tomorrow */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground/60">Tomorrow</p>
          <div className="flex flex-col gap-1">
            {tomorrow.map((ev, i) => (
              <EventRow key={i} event={ev} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventRow({
  event,
}: {
  event: (typeof calendarEvents)[0]
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/5 transition-colors">
      <span className="w-9 shrink-0 text-[11px] font-mono text-muted-foreground">
        {event.time}
      </span>
      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
          impactStyles[event.impact]
        )}
      >
        {event.impact}
      </span>
      <span className="flex-1 truncate text-xs font-medium text-foreground">
        {event.name}
      </span>
      <div className="flex shrink-0 gap-3 text-[10px]">
        <span className="text-muted-foreground">
          F <span className="text-foreground font-medium">{event.forecast}</span>
        </span>
        <span className="text-muted-foreground">
          P <span className="text-foreground font-medium">{event.previous}</span>
        </span>
      </div>
    </div>
  )
}
