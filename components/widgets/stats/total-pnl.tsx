"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const defaultSparkData = [
  { v: 220 }, { v: 480 }, { v: 310 }, { v: 560 }, { v: 420 },
  { v: 680 }, { v: 590 }, { v: 820 }, { v: 760 }, { v: 1040 },
  { v: 920 }, { v: 1240 },
];

export default function TotalPnlWidget() {
  const [pnl, setPnl] = useState(1240);
  const [pnlPct, setPnlPct] = useState(4.8);
  const [sparkData, setSparkData] = useState(defaultSparkData);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then((data) => {
        setPnl(data.todayPnl);
        setPnlPct(data.todayPnlPct);
        if (data.pnlHistory) setSparkData(data.pnlHistory);
      })
      .catch(() => {});
  }, []);

  const isPositive = pnl >= 0;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Today&apos;s P&amp;L
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-destructive")}>
            {isPositive ? "+" : "-"}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className={cn("mt-0.5 flex items-center gap-1 text-xs", isPositive ? "text-positive" : "text-destructive")}>
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            {isPositive ? "+" : ""}{pnlPct.toFixed(1)}% vs yesterday
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
