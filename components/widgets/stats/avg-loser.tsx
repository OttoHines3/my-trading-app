"use client";

import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function AvgLoserWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { avgLoser?: number } | null });
  const avg = data.stats?.avgLoser ?? -180;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Avg Loser</p>
      <p className="text-3xl font-bold text-[#ef4444]">-${Math.abs(avg).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p className="mt-0.5 text-xs text-gray-500">Average losing trade</p>
    </div>
  );
}
