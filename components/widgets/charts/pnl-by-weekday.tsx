"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const mockData = [
  { day: "Mon", pnl: 420 }, { day: "Tue", pnl: -180 }, { day: "Wed", pnl: 560 },
  { day: "Thu", pnl: 320 }, { day: "Fri", pnl: -90 },
];

export default function PnlByWeekdayWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=by-weekday", { byWeekday: null as { day: string; pnl: number }[] | null });
  const data = res.byWeekday?.length ? res.byWeekday : mockData;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">P&L by Day of Week</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
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
