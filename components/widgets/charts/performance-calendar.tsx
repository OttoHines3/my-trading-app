"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import DayDetailModal from "./day-detail-modal";

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-5 card-glow h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="rounded-md p-1.5 hover:bg-white/5 transition-colors" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </button>
          <h2 className="text-sm font-semibold text-white">{getMonthLabel(year, month)}</h2>
          <button onClick={goToNextMonth} className="rounded-md p-1.5 hover:bg-white/5 transition-colors" aria-label="Next month">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToThisMonth}
              className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white hover:bg-white/15 transition-colors"
            >
              This month
            </button>
          )}
        </div>

        {/* Monthly summary */}
        {data && (
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-gray-500">Monthly stats:</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-bold",
                data.monthlyPnl >= 0 ? "bg-green-500/20 text-[#22c55e]" : "bg-red-500/20 text-[#ef4444]"
              )}
            >
              {formatPnl(data.monthlyPnl)}
            </span>
            <span className="text-gray-400">
              {data.tradingDays} day{data.tradingDays !== 1 ? "s" : ""} traded
            </span>
          </div>
        )}
      </div>

      {/* Calendar + Weekly sidebar */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 border-b border-white/5 pb-1.5">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-xs text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="rounded-md bg-[#16161f] border border-white/5" />;
                }

                const dateKey = getDayKey(day);
                const dayData = data?.days[dateKey];
                const today = isToday(year, month, day);

                return (
                  <div
                    key={dateKey}
                    onClick={dayData ? () => setSelectedDate(dateKey) : undefined}
                    className={cn(
                      "relative flex flex-col rounded-md p-1.5 transition-colors min-h-[72px]",
                      dayData
                        ? cn(
                            dayData.pnl >= 0
                              ? "bg-[#14532d] border-l-2 border-green-500"
                              : "bg-[#450a0a] border-l-2 border-red-500",
                            "cursor-pointer hover:brightness-125"
                          )
                        : "bg-[#16161f] border border-white/5"
                    )}
                  >
                    {/* Day number — top left */}
                    {today ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                        {day}
                      </span>
                    ) : (
                      <span className={cn("text-sm leading-none", dayData ? "text-gray-300" : "text-gray-400")}>
                        {day}
                      </span>
                    )}

                    {/* Trade data — centered */}
                    {dayData && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                        <span
                          className={cn(
                            "text-base font-bold leading-tight",
                            dayData.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                          )}
                        >
                          {formatPnl(dayData.pnl)}
                        </span>
                        <span className="text-[10px] leading-tight text-gray-300">
                          {dayData.trades} trade{dayData.trades !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] leading-tight text-gray-400">
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
        <div className="flex w-28 shrink-0 flex-col gap-1.5">
          <div className="py-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-500">
            Weekly
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 animate-pulse rounded-xl bg-[#16161f] border border-white/5" />
              ))
            : (data?.weeks ?? []).map((week, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-center rounded-xl bg-[#16161f] border border-white/5 p-3"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Week {i + 1}</span>
                  {week.tradingDays > 0 ? (
                    <>
                      <span className={cn(
                        "text-lg font-bold mt-1",
                        week.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                      )}>
                        {formatPnl(week.pnl)}
                      </span>
                      <span className="mt-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                        {week.tradingDays} day{week.tradingDays !== 1 ? "s" : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 mt-1">--</span>
                  )}
                </div>
              ))}
        </div>
      </div>

      <DayDetailModal
        date={selectedDate ?? ""}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
