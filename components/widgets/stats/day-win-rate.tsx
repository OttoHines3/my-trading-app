"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function DayWinRateWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { dayWinRate?: number } | null });
  const rate = data.stats?.dayWinRate ?? 72;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Day Win Rate</p>
      <p className={cn("text-3xl font-bold", rate >= 50 ? "text-[#22c55e]" : "text-[#ef4444]")}>{rate}%</p>
      <p className="mt-0.5 text-xs text-gray-500">Green vs red days</p>
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={cn("h-2 flex-1 rounded-sm", i < Math.round(rate / 10) ? "bg-[#22c55e]" : "bg-[#ef4444]/30")} />
        ))}
      </div>
    </div>
  );
}
