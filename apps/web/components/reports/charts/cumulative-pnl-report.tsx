"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTradeFilters } from "@/lib/stores/trade-filters";

interface DataPoint {
  date: string;
  cumPnl: number;
}

export function CumulativePnlReport() {
  const [data, setData] = useState<DataPoint[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("fields", "daily-pnl");
    fetch(`/api/widget-data?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.dailyPnl) {
          let cum = 0;
          setData(
            res.dailyPnl.map((d: { date: string; pnl: number }) => {
              cum += d.pnl;
              return { date: d.date, cumPnl: cum };
            })
          );
        }
      })
      .catch(() => {});
  }, [filterQuery]);

  return (
    <div className="rounded-xl border border-white/5 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Cumulative P&L</h3>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cumulative P&L"]}
              />
              <Area type="monotone" dataKey="cumPnl" stroke="#22c55e" fill="url(#cumPnlGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data</div>
        )}
      </div>
    </div>
  );
}
