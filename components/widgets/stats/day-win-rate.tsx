"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function DayWinRateWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { dayWinRate?: number } | null });
  const rate = data.stats?.dayWinRate ?? 72;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Day Win Rate</p>
      <p className={cn("text-2xl font-bold", rate >= 50 ? "text-positive" : "text-destructive")}>{rate}%</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Green vs red days</p>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={cn("h-2 flex-1 rounded-sm", i < Math.round(rate / 10) ? "bg-positive/60" : "bg-destructive/30")} />
        ))}
      </div>
    </div>
  );
}
