"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function ProfitFactorWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { profitFactor?: number } | null });
  const pf = data.stats?.profitFactor ?? 2.4;

  const isGood = pf >= 1;
  const barWidth = Math.min((pf / (pf + 1)) * 100, 95);

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Profit Factor</p>
      <p className={cn("text-3xl font-bold", isGood ? "text-[#22c55e]" : "text-[#ef4444]")}>
        {pf === Infinity ? "∞" : pf.toFixed(2)}x
      </p>
      <p className="mt-0.5 text-xs text-gray-500">Gross profit / gross loss</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/5">
        <div className={cn("h-full rounded-full", isGood ? "bg-[#22c55e]" : "bg-[#ef4444]")} style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
}
