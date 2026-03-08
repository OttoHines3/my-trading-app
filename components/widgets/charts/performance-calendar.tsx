"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const prefix = value >= 0 ? "$" : "-$";
  return `${prefix}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

export default function PerformanceCalendarWidget() {
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
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function goToNextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function goToThisMonth() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card p-4 card-glow h-full min-h-[340px]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="rounded-md p-1 hover:bg-white/5" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">{getMonthLabel(year, month)}</h2>
          <button onClick={goToNextMonth} className="rounded-md p-1 hover:bg-white/5" aria-label="Next month">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToThisMonth}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-white/5"
            >
              This month
            </button>
          )}
        </div>

        {/* Monthly summary */}
        {data && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-semibold",
                data.monthlyPnl >= 0 ? "bg-emerald-500/20 text-positive" : "bg-red-500/20 text-destructive"
              )}
            >
              {formatPnl(data.monthlyPnl)}
            </span>
            <span className="text-muted-foreground">
              {data.tradingDays} day{data.tradingDays !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Calendar + Weekly sidebar */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5 flex-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="rounded-md bg-white/[0.02]" />;
                }

                const dateKey = getDayKey(day);
                const dayData = data?.days[dateKey];
                const today = isToday(year, month, day);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "relative flex flex-col items-end justify-start rounded-md p-1 transition-colors",
                      dayData
                        ? dayData.pnl >= 0
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-red-500/20 border border-red-500/30"
                        : "bg-white/[0.02]"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium leading-none",
                        today
                          ? "flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : dayData ? "text-white" : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </span>

                    {dayData && (
                      <div className="mt-auto flex flex-col items-end">
                        <span
                          className={cn(
                            "text-[11px] font-bold leading-tight",
                            dayData.pnl >= 0 ? "text-positive" : "text-destructive"
                          )}
                        >
                          {formatPnl(dayData.pnl)}
                        </span>
                        <span className="text-[8px] leading-tight text-muted-foreground">
                          {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[8px] leading-tight text-muted-foreground">
                          {dayData.winRate}%
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
        <div className="flex w-24 shrink-0 flex-col gap-0.5">
          <div className="py-1 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 animate-pulse rounded-md bg-white/[0.02]" />
              ))
            : (data?.weeks ?? []).map((week, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center rounded-md px-1.5 py-1",
                    week.tradingDays === 0
                      ? "bg-white/[0.02]"
                      : week.pnl >= 0
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                  )}
                >
                  <span className="text-[9px] font-medium text-muted-foreground">Week {i + 1}</span>
                  {week.tradingDays > 0 ? (
                    <>
                      <span className={cn("text-[11px] font-bold", week.pnl >= 0 ? "text-positive" : "text-destructive")}>
                        {formatPnl(week.pnl)}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        {week.tradingDays} day{week.tradingDays !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">--</span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
