"use client";

import { Trophy } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function LargestWinWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { largestWin?: { pnl: number; symbol: string } } | null });
  const pnl = data.stats?.largestWin?.pnl ?? 890;
  const symbol = data.stats?.largestWin?.symbol ?? "TSLA";

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Largest Win</p>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-positive" />
        <p className="text-2xl font-bold text-positive">+${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{symbol}</p>
    </div>
  );
}
