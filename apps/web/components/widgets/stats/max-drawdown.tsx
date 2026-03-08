"use client";

import { ArrowDownRight } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function MaxDrawdownWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { maxDrawdown?: number } | null });
  const dd = data.stats?.maxDrawdown ?? -2100;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Max Drawdown</p>
      <div className="flex items-center gap-2">
        <ArrowDownRight className="h-5 w-5 text-[#ef4444]" />
        <p className="text-3xl font-bold text-[#ef4444]">-${Math.abs(dd).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">Peak to trough</p>
    </div>
  );
}
