"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import { calcMonthlyPnl } from "@/lib/utils/report-calculations";
import { calcWinRate, calcProfitFactor } from "@/lib/utils/calculations";

export function OverviewTab() {
  const [trades, setTrades] = useState<{ pnl: number; exitDate: string; symbol: string; assetClass: string; entryDate: string }[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("perPage", "10000");
    fetch(`/api/trades?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setTrades(data.trades ?? []))
      .catch(() => {});
  }, [filterQuery]);

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = calcWinRate(trades);
  const profitFactor = calcProfitFactor(trades);
  const monthlyPnl = calcMonthlyPnl(trades);

  const overviewStats = [
    { label: "Total Trades", value: trades.length },
    { label: "Net P&L", value: `$${totalPnl.toFixed(2)}` },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
    { label: "Profit Factor", value: profitFactor === Infinity ? "---" : profitFactor.toFixed(2) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Monthly P&L</h3>
        <div className="h-64">
          {monthlyPnl.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPnl}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]}
                />
                <Bar
                  dataKey="pnl"
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                  // @ts-expect-error recharts cell typing
                  shape={(props: { x: number; y: number; width: number; height: number; payload: { pnl: number } }) => {
                    const { x, y, width, height, payload } = props;
                    return <rect x={x} y={y} width={width} height={height} rx={4} fill={payload.pnl >= 0 ? "#22c55e" : "#ef4444"} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
