"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const mockData = [
  { hour: 9, pnl: 320 }, { hour: 10, pnl: 480 }, { hour: 11, pnl: -120 },
  { hour: 12, pnl: 90 }, { hour: 13, pnl: 210 }, { hour: 14, pnl: -180 },
  { hour: 15, pnl: 340 },
];

export default function PnlByHourWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=by-hour", { byHour: null as { hour: number; pnl: number }[] | null });
  const data = res.byHour?.length ? res.byHour : mockData;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-card p-5 card-glow transition-all duration-200 h-full">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">P&L by Hour</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}:00`} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
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
