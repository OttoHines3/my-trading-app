"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTradeFilters } from "@/lib/stores/trade-filters";

interface DayData {
  day: string;
  wins: number;
  losses: number;
}

export function AvgDailyWinLoss() {
  const [data, setData] = useState<DayData[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("fields", "by-weekday");
    fetch(`/api/widget-data?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.byWeekday) {
          setData(
            res.byWeekday.map((d: { day: string; pnl: number }) => ({
              day: d.day,
              wins: Math.max(0, d.pnl),
              losses: Math.min(0, d.pnl),
            }))
          );
        }
      })
      .catch(() => {});
  }, [filterQuery]);

  return (
    <div className="rounded-xl border border-white/5 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Avg Daily Win / Loss</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" fill="#ef4444" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data</div>
        )}
      </div>
    </div>
  );
}
