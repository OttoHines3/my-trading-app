"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function WorstDayWidget() {
  const [pnl, setPnl] = useState(-890);
  const [date, setDate] = useState("2026-02-28");

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.worstDay) {
          setPnl(data.stats.worstDay.pnl);
          setDate(data.stats.worstDay.date);
        }
      })
      .catch(() => {});
  }, []);

  const formatted = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Worst Day</p>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <p className="text-2xl font-bold text-destructive">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatted}</p>
    </div>
  );
}
