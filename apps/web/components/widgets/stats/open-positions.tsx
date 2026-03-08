"use client";

import { Activity } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function OpenPositionsWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { openPositions?: number } | null });
  const count = data.stats?.openPositions ?? 2;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Open Positions</p>
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <p className="text-3xl font-bold text-white">{count}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">Currently active</p>
    </div>
  );
}
