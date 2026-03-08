"use client";

import { AlertTriangle } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function WorstDayWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { worstDay?: { pnl: number; date: string } } | null });
  const pnl = data.stats?.worstDay?.pnl ?? -890;
  const date = data.stats?.worstDay?.date ?? "2026-02-28";

  const formatted = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Worst Day</p>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
        <p className="text-3xl font-bold text-[#ef4444]">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{formatted}</p>
    </div>
  );
}
