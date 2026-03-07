"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const mockData = [
  { date: "Mon", pnl: 320 }, { date: "Tue", pnl: -150 }, { date: "Wed", pnl: 480 },
  { date: "Thu", pnl: -90 }, { date: "Fri", pnl: 560 }, { date: "Mon", pnl: 210 },
  { date: "Tue", pnl: -320 }, { date: "Wed", pnl: 180 },
];

export default function DailyPnlBarsWidget() {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    fetch("/api/widget-data?fields=daily-pnl")
      .then((r) => r.json())
      .then((res) => {
        if (res.dailyPnl?.length) {
          const mapped = res.dailyPnl.slice(-20).map((d: { date: string; pnl: number }) => {
            const dateObj = new Date(d.date);
            return { date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }), pnl: d.pnl };
          });
          setData(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Daily P&L</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
