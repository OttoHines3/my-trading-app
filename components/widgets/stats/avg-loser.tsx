"use client";

import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function AvgLoserWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { avgLoser?: number } | null });
  const avg = data.stats?.avgLoser ?? -180;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Avg Loser</p>
      <p className="text-2xl font-bold text-destructive">-${Math.abs(avg).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Average losing trade</p>
    </div>
  );
}
