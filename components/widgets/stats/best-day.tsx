"use client";

import { Star } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function BestDayWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { bestDay?: { pnl: number; date: string } } | null });
  const pnl = data.stats?.bestDay?.pnl ?? 1580;
  const date = data.stats?.bestDay?.date ?? "2026-03-05";

  const formatted = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Best Day</p>
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-[#22c55e]" />
        <p className="text-3xl font-bold text-[#22c55e]">+${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{formatted}</p>
    </div>
  );
}
