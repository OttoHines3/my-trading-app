"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const mockData = [
  { bucket: "<-500", count: 2 }, { bucket: "-500 to -250", count: 5 },
  { bucket: "-250 to 0", count: 8 }, { bucket: "0 to 250", count: 12 },
  { bucket: "250 to 500", count: 9 }, { bucket: ">500", count: 4 },
];

export default function WinLossDistributionWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=distribution", { distribution: null as { bucket: string; count: number }[] | null });
  const data = res.distribution?.length ? res.distribution : mockData;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">P&L Distribution</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [value, "Trades"]} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.bucket.startsWith("-") || entry.bucket.startsWith("<") ? "#ef4444" : "#22c55e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
