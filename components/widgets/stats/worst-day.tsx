"use client";

import { AlertTriangle } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function WorstDayWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { worstDay?: { pnl: number; date: string } } | null });
  const pnl = data.stats?.worstDay?.pnl ?? -890;
  const date = data.stats?.worstDay?.date ?? "2026-02-28";

  const formatted = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Worst Day</p>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <p className="text-2xl font-bold text-destructive">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatted}</p>
    </div>
  );
}
