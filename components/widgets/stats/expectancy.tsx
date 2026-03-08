"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function ExpectancyWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { expectancy?: number } | null });
  const expectancy = data.stats?.expectancy ?? 45.6;

  const isPositive = expectancy >= 0;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Expectancy</p>
      <p className={cn("text-3xl font-bold", isPositive ? "text-[#22c55e]" : "text-[#ef4444]")}>
        {isPositive ? "+" : ""}${Math.abs(expectancy).toFixed(2)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">Expected $ per trade</p>
    </div>
  );
}
