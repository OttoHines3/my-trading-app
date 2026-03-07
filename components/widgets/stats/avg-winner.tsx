"use client";

import { useEffect, useState } from "react";

export default function AvgWinnerWidget() {
  const [avg, setAvg] = useState(320);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.avgWinner != null) setAvg(data.stats.avgWinner); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Avg Winner</p>
      <p className="text-2xl font-bold text-positive">+${avg.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Average winning trade</p>
    </div>
  );
}
