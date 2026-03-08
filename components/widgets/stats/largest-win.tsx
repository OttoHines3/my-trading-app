"use client";

import { Trophy } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function LargestWinWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { largestWin?: { pnl: number; symbol: string } } | null });
  const pnl = data.stats?.largestWin?.pnl ?? 890;
  const symbol = data.stats?.largestWin?.symbol ?? "TSLA";

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Largest Win</p>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#22c55e]" />
        <p className="text-3xl font-bold text-[#22c55e]">+${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{symbol}</p>
    </div>
  );
}
