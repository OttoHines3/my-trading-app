"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export default function BestDayWidget() {
  const [pnl, setPnl] = useState(1580);
  const [date, setDate] = useState("2026-03-05");

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.bestDay) {
          setPnl(data.stats.bestDay.pnl);
          setDate(data.stats.bestDay.date);
        }
      })
      .catch(() => {});
  }, []);

  const formatted = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Best Day</p>
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-positive" />
        <p className="text-2xl font-bold text-positive">+${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatted}</p>
    </div>
  );
}
