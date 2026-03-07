"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayData {
  pnl: number;
  trades: number;
  winRate: number;
}

interface WeekData {
  pnl: number;
  tradingDays: number;
}

interface CalendarData {
  days: Record<string, DayData>;
  weeks: WeekData[];
  monthlyPnl: number;
  tradingDays: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPnl(value: number): string {
  const prefix = value >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );
}

export default function PerformanceCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const param = getMonthParam(year, month);
      const res = await fetch(`/api/trades/calendar?month=${param}`);
      const json: CalendarData = await res.json();
      setData(json);
    } catch {
      setData({ days: {}, weeks: [], monthlyPnl: 0, tradingDays: 0 });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function goToPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToThisMonth() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  // Leading empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  // Trailing empty cells to complete the last row
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="rounded-xl border border-white/5 bg-card p-4 card-glow">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{getMonthLabel(year, month)}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Monthly summary badge */}
          {data && (
            <div className="mr-4 flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium",
                  data.monthlyPnl >= 0
                    ? "bg-emerald-500/20 text-positive"
                    : "bg-red-500/20 text-destructive"
                )}
              >
                {formatPnl(data.monthlyPnl)}
              </span>
              <span className="text-muted-foreground">
                {data.tradingDays} trading day{data.tradingDays !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Navigation */}
          <button
            onClick={goToPrevMonth}
            className="rounded-md p-1.5 transition-colors hover:bg-white/5"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={goToThisMonth}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/5",
              isCurrentMonth
                ? "text-muted-foreground"
                : "text-primary"
            )}
          >
            This month
          </button>
          <button
            onClick={goToNextMonth}
            className="rounded-md p-1.5 transition-colors hover:bg-white/5"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar + Weekly sidebar */}
      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1">
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square rounded-lg bg-white/[0.02]"
                    />
                  );
                }

                const dateKey = getDayKey(day);
                const dayData = data?.days[dateKey];
                const today = isToday(year, month, day);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-lg p-1 transition-colors",
                      dayData
                        ? dayData.pnl >= 0
                          ? "bg-emerald-500/20"
                          : "bg-red-500/20"
                        : "bg-white/[0.02]"
                    )}
                  >
                    {/* Day number */}
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        today
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : dayData
                            ? "text-white"
                            : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </span>

                    {/* P&L and stats */}
                    {dayData && (
                      <div className="mt-0.5 flex flex-col items-center gap-0">
                        <span
                          className={cn(
                            "text-[11px] font-semibold leading-tight",
                            dayData.pnl >= 0
                              ? "text-positive"
                              : "text-destructive"
                          )}
                        >
                          {formatPnl(dayData.pnl)}
                        </span>
                        <span className="text-[9px] leading-tight text-muted-foreground">
                          {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}{" "}
                          &middot; {dayData.winRate}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly summary sidebar */}
        <div className="flex w-36 shrink-0 flex-col gap-1">
          <div className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-white/[0.02]"
                />
              ))
            : (data?.weeks ?? []).map((week, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center rounded-lg p-2",
                    week.tradingDays === 0
                      ? "bg-white/[0.02]"
                      : week.pnl >= 0
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                  )}
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Wk {i + 1}
                  </span>
                  {week.tradingDays > 0 ? (
                    <>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          week.pnl >= 0 ? "text-positive" : "text-destructive"
                        )}
                      >
                        {formatPnl(week.pnl)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {week.tradingDays} day{week.tradingDays !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
