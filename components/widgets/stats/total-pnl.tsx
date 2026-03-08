"use client";

import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const defaultSparkData = [
  { v: 220 }, { v: 480 }, { v: 310 }, { v: 560 }, { v: 420 },
  { v: 680 }, { v: 590 }, { v: 820 }, { v: 760 }, { v: 1040 },
  { v: 920 }, { v: 1240 },
];

interface DashboardStats {
  totalPnl?: number;
  totalTrades?: number;
  pnlHistory?: { v: number }[] | null;
}

export default function TotalPnlWidget() {
  const { data } = useWidgetFetch<DashboardStats>("/api/dashboard-stats", {});
  const totalPnl = data.totalPnl ?? 8450;
  const totalTrades = data.totalTrades ?? 64;
  const sparkData = data.pnlHistory ?? defaultSparkData;

  const isPositive = totalPnl >= 0;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Total P&amp;L
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-destructive")}>
            {isPositive ? "+" : "-"}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {totalTrades} trade{totalTrades !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={isPositive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
