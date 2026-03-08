"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  BarChart3,
  Filter,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface EconomicEvent {
  day: string;
  time: string;
  name: string;
  impact: "HIGH" | "MED" | "LOW";
  forecast: string;
  previous: string;
  country: string;
  datetime?: string;
}

interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number | null;
  year: number | null;
}

type TabType = "economic" | "earnings";
type ImpactLevel = "HIGH" | "MED" | "LOW";

// ── Constants ──────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  HIGH: "bg-destructive/20 text-destructive",
  MED: "bg-amber-400/20 text-amber-400",
  LOW: "bg-white/10 text-muted-foreground",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [tab, setTab] = useState<TabType>("economic");
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [earningsEvents, setEarningsEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [impactFilters, setImpactFilters] = useState<Set<ImpactLevel>>(
    new Set(["HIGH", "MED", "LOW"])
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Date range state ───────────────────────────────────────────────────────

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Go to Monday of current week
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  });

  function toISO(d: Date) {
    return d.toISOString().split("T")[0];
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  function shiftWeek(dir: -1 | 1) {
    setStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  }

  function goToThisWeek() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    setStartDate(d);
  }

  const rangeLabel = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // ── Fetch logic ────────────────────────────────────────────────────────────

  const from = toISO(startDate);
  const to = toISO(endDate);

  const fetchEconomic = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
      const data = await res.json();
      setEconomicEvents(data.events ?? []);
    } catch {
      setEconomicEvents([]);
    }
  }, [from, to]);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?type=earnings&from=${from}&to=${to}`);
      const data = await res.json();
      setEarningsEvents(data.earnings ?? []);
    } catch {
      setEarningsEvents([]);
    }
  }, [from, to]);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (tab === "economic") {
      await fetchEconomic();
    } else {
      await fetchEarnings();
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, [tab, fetchEconomic, fetchEarnings]);

  // Initial load + tab change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Impact filter toggle ───────────────────────────────────────────────────

  function toggleImpact(level: ImpactLevel) {
    setImpactFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }

  // ── Filter economic events ─────────────────────────────────────────────────

  const filteredEconomic = economicEvents.filter((e) =>
    impactFilters.has(e.impact as ImpactLevel)
  );

  // Group by day
  const groupedByDay = filteredEconomic.reduce<Record<string, EconomicEvent[]>>(
    (acc, event) => {
      if (!acc[event.day]) acc[event.day] = [];
      acc[event.day].push(event);
      return acc;
    },
    {}
  );

  // Group earnings by date
  const groupedEarnings = earningsEvents.reduce<Record<string, EarningsEvent[]>>(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {}
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Economic events and earnings reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={refresh}
            className={cn(
              "rounded-lg border border-white/5 bg-card p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
              loading && "animate-spin"
            )}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("economic")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "economic"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Economic
        </button>
        <button
          onClick={() => setTab("earnings")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "earnings"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Earnings
        </button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => shiftWeek(-1)}
          className="rounded-lg border border-white/5 bg-card p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goToThisWeek}
          className="rounded-lg border border-white/5 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          This Week
        </button>
        <button
          onClick={() => shiftWeek(1)}
          className="rounded-lg border border-white/5 bg-card p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
      </div>

      {/* Impact filters (economic only) */}
      {tab === "economic" && (
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Impact
          </span>
          {(["HIGH", "MED", "LOW"] as ImpactLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => toggleImpact(level)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                impactFilters.has(level)
                  ? IMPACT_STYLES[level]
                  : "bg-white/5 text-muted-foreground/50"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-white/5 bg-card p-12 card-glow">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      ) : tab === "economic" ? (
        <EconomicView groups={groupedByDay} />
      ) : (
        <EarningsView groups={groupedEarnings} />
      )}
    </div>
  );
}

// ── Economic View ────────────────────────────────────────────────────────────

function EconomicView({ groups }: { groups: Record<string, EconomicEvent[]> }) {
  const days = Object.keys(groups);

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-12 card-glow">
        <div className="flex flex-col items-center gap-3">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No economic events match your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day} className="rounded-xl border border-white/5 bg-card card-glow overflow-hidden">
          {/* Day header */}
          <div className="border-b border-white/5 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {day}
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_70px_90px_90px] gap-2 border-b border-white/5 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span>Time</span>
            <span>Event</span>
            <span>Impact</span>
            <span className="text-right">Forecast</span>
            <span className="text-right">Previous</span>
          </div>

          {/* Rows */}
          {groups[day].map((event, i) => (
            <div
              key={`${event.name}-${i}`}
              className="grid grid-cols-[60px_1fr_70px_90px_90px] gap-2 items-center px-5 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {event.time}
              </span>
              <span className="text-sm font-medium text-foreground truncate">
                {event.name}
              </span>
              <span>
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    IMPACT_STYLES[event.impact as ImpactLevel] ?? IMPACT_STYLES.LOW
                  )}
                >
                  {event.impact}
                </span>
              </span>
              <span className="text-right text-sm text-foreground tabular-nums">
                {event.forecast}
              </span>
              <span className="text-right text-sm text-muted-foreground tabular-nums">
                {event.previous}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Earnings View ────────────────────────────────────────────────────────────

function EarningsView({ groups }: { groups: Record<string, EarningsEvent[]> }) {
  const dates = Object.keys(groups).sort();

  if (dates.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-12 card-glow">
        <div className="flex flex-col items-center gap-3">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No upcoming earnings reports
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        // Format date label
        const d = new Date(date + "T12:00:00");
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let label = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        if (d.toDateString() === today.toDateString()) label = "Today";
        else if (d.toDateString() === tomorrow.toDateString()) label = "Tomorrow";

        return (
          <div key={date} className="rounded-xl border border-white/5 bg-card card-glow overflow-hidden">
            {/* Date header */}
            <div className="border-b border-white/5 px-5 py-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {groups[date].length} report{groups[date].length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[90px_1fr_100px_100px_100px] gap-2 border-b border-white/5 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Symbol</span>
              <span>Timing</span>
              <span className="text-right">EPS Est.</span>
              <span className="text-right">EPS Act.</span>
              <span className="text-right">Surprise</span>
            </div>

            {/* Rows */}
            {groups[date].map((earning, i) => {
              const hasBeat =
                earning.epsActual != null && earning.epsEstimate != null
                  ? earning.epsActual > earning.epsEstimate
                  : null;
              const surprise =
                earning.epsActual != null && earning.epsEstimate != null
                  ? earning.epsActual - earning.epsEstimate
                  : null;

              return (
                <div
                  key={`${earning.symbol}-${i}`}
                  className="grid grid-cols-[90px_1fr_100px_100px_100px] gap-2 items-center px-5 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="text-sm font-bold text-foreground">
                    {earning.symbol}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {earning.hour}
                  </span>
                  <span className="text-right text-sm text-muted-foreground tabular-nums">
                    {earning.epsEstimate != null
                      ? `$${earning.epsEstimate.toFixed(2)}`
                      : "\u2014"}
                  </span>
                  <span
                    className={cn(
                      "text-right text-sm font-medium tabular-nums",
                      earning.epsActual != null
                        ? hasBeat
                          ? "text-positive"
                          : "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {earning.epsActual != null
                      ? `$${earning.epsActual.toFixed(2)}`
                      : "\u2014"}
                  </span>
                  <span className="flex items-center justify-end gap-1 text-sm tabular-nums">
                    {surprise != null ? (
                      <>
                        {hasBeat ? (
                          <TrendingUp className="h-3 w-3 text-positive" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            hasBeat ? "text-positive" : "text-destructive"
                          )}
                        >
                          {surprise >= 0 ? "+" : ""}
                          ${surprise.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
