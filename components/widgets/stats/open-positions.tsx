"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function OpenPositionsWidget() {
  const [count, setCount] = useState(2);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.openPositions != null) setCount(data.stats.openPositions); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Open Positions</p>
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <p className="text-2xl font-bold text-foreground">{count}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Currently active</p>
    </div>
  );
}
