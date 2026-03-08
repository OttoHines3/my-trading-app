"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function ExpectancyWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { expectancy?: number } | null });
  const expectancy = data.stats?.expectancy ?? 45.6;

  const isPositive = expectancy >= 0;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Expectancy</p>
      <p className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-destructive")}>
        {isPositive ? "+" : ""}${Math.abs(expectancy).toFixed(2)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Expected $ per trade</p>
    </div>
  );
}
