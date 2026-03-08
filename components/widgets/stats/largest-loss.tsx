"use client";

import { TrendingDown } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function LargestLossWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { largestLoss?: { pnl: number; symbol: string } } | null });
  const pnl = data.stats?.largestLoss?.pnl ?? -450;
  const symbol = data.stats?.largestLoss?.symbol ?? "NVDA";

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Largest Loss</p>
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-[#ef4444]" />
        <p className="text-3xl font-bold text-[#ef4444]">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{symbol}</p>
    </div>
  );
}
