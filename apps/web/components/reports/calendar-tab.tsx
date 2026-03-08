"use client";

import { useEffect, useState } from "react";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  pnl: number;
}

export function CalendarTab() {
  const [dailyPnl, setDailyPnl] = useState<DayData[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("fields", "daily-pnl");
    fetch(`/api/widget-data?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => setDailyPnl(res.dailyPnl ?? []))
      .catch(() => {});
  }, [filterQuery]);

  // Group by month
  const byMonth: Record<string, DayData[]> = {};
  dailyPnl.forEach((d) => {
    const month = d.date.substring(0, 7);
    (byMonth[month] ??= []).push(d);
  });

  return (
    <div className="space-y-4">
      {Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a)).map(([month, days]) => {
        const total = days.reduce((s, d) => s + d.pnl, 0);
        return (
          <div key={month} className="rounded-xl border border-white/5 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">{month}</h3>
              <span className={cn("text-sm font-bold", total >= 0 ? "text-positive" : "text-destructive")}>
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-lg p-2 text-center text-xs",
                    d.pnl > 0 ? "bg-positive/10 text-positive" : d.pnl < 0 ? "bg-destructive/10 text-destructive" : "bg-gray-950 text-muted-foreground"
                  )}
                >
                  <div className="font-medium">{new Date(d.date + "T12:00:00").getDate()}</div>
                  <div className="text-[10px]">${d.pnl.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {dailyPnl.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-card p-8 text-center text-xs text-muted-foreground">
          No trading data to display
        </div>
      )}
    </div>
  );
}
