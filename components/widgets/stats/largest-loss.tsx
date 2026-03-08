"use client";

import { TrendingDown } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function LargestLossWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { largestLoss?: { pnl: number; symbol: string } } | null });
  const pnl = data.stats?.largestLoss?.pnl ?? -450;
  const symbol = data.stats?.largestLoss?.symbol ?? "NVDA";

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Largest Loss</p>
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-destructive" />
        <p className="text-2xl font-bold text-destructive">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{symbol}</p>
    </div>
  );
}
