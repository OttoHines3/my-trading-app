"use client";

import { useEffect, useState } from "react";

export default function AvgLoserWidget() {
  const [avg, setAvg] = useState(-180);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.avgLoser != null) setAvg(data.stats.avgLoser); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Avg Loser</p>
      <p className="text-2xl font-bold text-destructive">-${Math.abs(avg).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Average losing trade</p>
    </div>
  );
}
