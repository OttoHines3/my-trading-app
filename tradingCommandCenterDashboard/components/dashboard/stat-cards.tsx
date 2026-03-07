"use client"

import { useEffect, useState } from "react"
import { TrendingUp, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

// ── Shared card shell ────────────────────────────────────────────────────────
function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow",
        className
      )}
    >
      {children}
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

// ── Sparkline data ───────────────────────────────────────────────────────────
const pnlSparkData = [
  { v: 220 }, { v: 480 }, { v: 310 }, { v: 560 }, { v: 420 },
  { v: 680 }, { v: 590 }, { v: 820 }, { v: 760 }, { v: 1040 },
  { v: 920 }, { v: 1240 },
]

const tradesBarData = [
  { v: 1 }, { v: 0 }, { v: 1 }, { v: 1 }, { v: 0 },
  { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 }, { v: 0 },
  { v: 0 }, { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 },
]

// ── P&L Card ─────────────────────────────────────────────────────────────────
export function PnLCard() {
  return (
    <Card>
      <CardLabel>Today's P&L</CardLabel>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-positive">+$1,240.00</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-positive">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            +4.8% vs yesterday
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pnlSparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

// ── Win Rate Card ─────────────────────────────────────────────────────────────
const RADIUS = 24
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function WinRateCard() {
  const pct = 67
  const dashOffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE

  return (
    <Card>
      <CardLabel>Win Rate</CardLabel>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="5"
            />
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{pct}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">43 W / 21 L</p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>
    </Card>
  )
}

// ── Trades Today Card ─────────────────────────────────────────────────────────
export function TradesTodayCard() {
  return (
    <Card>
      <CardLabel>Trades Today</CardLabel>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-foreground">4</p>
          <p className="mt-0.5 text-xs text-muted-foreground">3 winners · 1 loser</p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tradesBarData} barCategoryGap={2}>
              <Bar dataKey="v" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Tooltip
                content={() => null}
                cursor={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

// ── Economic Event Countdown ──────────────────────────────────────────────────
function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1_000)
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
}

export function NextEventCard() {
  const countdown = useCountdown(2 * 3_600_000 + 14 * 60_000)

  return (
    <Card>
      <CardLabel>Next Economic Event</CardLabel>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-foreground leading-tight">CPI Release</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-sm bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
              HIGH
            </span>
            <span className="text-xs text-muted-foreground">Impact</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm font-bold tabular-nums">{countdown}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">08:30 ET</p>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Forecast </span>
          <span className="font-semibold text-foreground">3.1%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Previous </span>
          <span className="font-semibold text-foreground">3.4%</span>
        </div>
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-white/5">
        <div className="h-full w-2/3 rounded-full bg-amber-400/60" />
      </div>
    </Card>
  )
}
