"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayPnl: number;
  todayPnlPct: number;
  winRate: number;
  wins: number;
  losses: number;
  tradesToday: number;
  tradeWinsToday: number;
  tradeLossesToday: number;
  pnlHistory: { v: number }[] | null;
  hasMockData: boolean;
}

interface CalendarEvent {
  time: string;
  name: string;
  impact: string;
  forecast: string;
  previous: string;
  country: string;
  datetime?: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  todayPnl: 1240,
  todayPnlPct: 4.8,
  winRate: 67,
  wins: 43,
  losses: 21,
  tradesToday: 4,
  tradeWinsToday: 3,
  tradeLossesToday: 1,
  pnlHistory: null,
  hasMockData: true,
};

const MOCK_EVENT: CalendarEvent = {
  time: "08:30",
  name: "CPI Release",
  impact: "HIGH",
  forecast: "3.1%",
  previous: "3.4%",
  country: "US",
};

const defaultSparkData = [
  { v: 220 }, { v: 480 }, { v: 310 }, { v: 560 }, { v: 420 },
  { v: 680 }, { v: 590 }, { v: 820 }, { v: 760 }, { v: 1040 },
  { v: 920 }, { v: 1240 },
];

const defaultBarData = [
  { v: 1 }, { v: 0 }, { v: 1 }, { v: 1 }, { v: 0 },
  { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 }, { v: 0 },
  { v: 0 }, { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 },
];

// ── Shared card shell ────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// ── P&L Card ─────────────────────────────────────────────────────────────────

function PnLCard({ stats }: { stats: DashboardStats }) {
  const pnl = stats.todayPnl;
  const isPositive = pnl >= 0;
  const sparkData = stats.pnlHistory ?? defaultSparkData;

  return (
    <Card>
      <CardLabel>Today&apos;s P&amp;L</CardLabel>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-destructive")}>
            {isPositive ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className={cn("mt-0.5 flex items-center gap-1 text-xs", isPositive ? "text-positive" : "text-destructive")}>
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            {isPositive ? "+" : ""}{stats.todayPnlPct.toFixed(1)}% vs yesterday
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

// ── Win Rate Card ────────────────────────────────────────────────────────────

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function WinRateCard({ stats }: { stats: DashboardStats }) {
  const pct = stats.winRate;
  const dashOffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <Card>
      <CardLabel>Win Rate</CardLabel>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{pct}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stats.wins} W / {stats.losses} L</p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>
    </Card>
  );
}

// ── Trades Today Card ────────────────────────────────────────────────────────

function TradesTodayCard({ stats }: { stats: DashboardStats }) {
  return (
    <Card>
      <CardLabel>Trades Today</CardLabel>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.tradesToday}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stats.tradeWinsToday} winners &middot; {stats.tradeLossesToday} loser{stats.tradeLossesToday !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={defaultBarData} barCategoryGap={2}>
              <Bar dataKey="v" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Tooltip content={() => null} cursor={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

// ── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs);

  useEffect(() => {
    setRemaining(targetMs);
  }, [targetMs]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

// ── Next Event Card ──────────────────────────────────────────────────────────

function NextEventCard({ event }: { event: CalendarEvent | null }) {
  const ev = event ?? MOCK_EVENT;

  // Compute countdown: parse event time to get ms remaining
  let targetMs = 2 * 3_600_000 + 14 * 60_000; // fallback: ~2h
  if (ev.datetime) {
    const diff = new Date(ev.datetime).getTime() - Date.now();
    if (diff > 0) targetMs = diff;
  }

  const countdown = useCountdown(targetMs);

  const impactColor = ev.impact === "HIGH"
    ? "bg-destructive/20 text-destructive"
    : ev.impact === "MED"
    ? "bg-amber-400/20 text-amber-400"
    : "bg-white/10 text-muted-foreground";

  return (
    <Card>
      <CardLabel>Next Economic Event</CardLabel>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-foreground leading-tight">{ev.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", impactColor)}>
              {ev.impact}
            </span>
            <span className="text-xs text-muted-foreground">Impact</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm font-bold tabular-nums">{countdown}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{ev.time} ET</p>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Forecast </span>
          <span className="font-semibold text-foreground">{ev.forecast}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Previous </span>
          <span className="font-semibold text-foreground">{ev.previous}</span>
        </div>
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-white/5">
        <div className="h-full w-2/3 rounded-full bg-amber-400/60" />
      </div>
    </Card>
  );
}

// ── Row wrapper — fetches once, renders all 4 cards ──────────────────────────

export function StatCardsRow() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});

    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (data.nextEvent) setNextEvent(data.nextEvent);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <PnLCard stats={stats} />
      <WinRateCard stats={stats} />
      <TradesTodayCard stats={stats} />
      <NextEventCard event={nextEvent} />
    </div>
  );
}
