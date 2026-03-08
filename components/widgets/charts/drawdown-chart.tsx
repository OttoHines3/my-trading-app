"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const mockData = [
  { date: "Feb 1", drawdown: 0 }, { date: "Feb 5", drawdown: -120 }, { date: "Feb 10", drawdown: -340 },
  { date: "Feb 15", drawdown: -180 }, { date: "Feb 20", drawdown: -560 }, { date: "Feb 25", drawdown: -420 },
  { date: "Mar 1", drawdown: -210 }, { date: "Mar 5", drawdown: -80 },
];

export default function DrawdownChartWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=drawdown", { drawdown: null as { date: string; drawdown: number }[] | null });

  let data = mockData;
  if (res.drawdown?.length) {
    data = res.drawdown.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      drawdown: d.drawdown,
    }));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Drawdown</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`$${Number(value).toFixed(2)}`, "Drawdown"]} />
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
