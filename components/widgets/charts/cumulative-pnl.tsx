"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const mockData = [
  { date: "Feb 1", pnl: 120 }, { date: "Feb 5", pnl: 340 }, { date: "Feb 10", pnl: 280 },
  { date: "Feb 15", pnl: 560 }, { date: "Feb 20", pnl: 480 }, { date: "Feb 25", pnl: 720 },
  { date: "Mar 1", pnl: 890 }, { date: "Mar 5", pnl: 1240 },
];

export default function CumulativePnlWidget() {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    fetch("/api/widget-data?fields=daily-pnl")
      .then((r) => r.json())
      .then((res) => {
        if (res.dailyPnl?.length) {
          let cumulative = 0;
          const mapped = res.dailyPnl.map((d: { date: string; pnl: number }) => {
            cumulative += d.pnl;
            const dateObj = new Date(d.date);
            return { date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }), pnl: cumulative };
          });
          setData(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const isPositive = data.length > 0 && data[data.length - 1].pnl >= 0;
  const color = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cumulative P&L</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "rgba(255,255,255,0.6)" }} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
            <Area type="monotone" dataKey="pnl" stroke={color} strokeWidth={2} fill="url(#pnlGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
