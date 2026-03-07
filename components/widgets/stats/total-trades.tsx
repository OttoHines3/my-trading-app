"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

export default function TotalTradesWidget() {
  const [total, setTotal] = useState(64);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.totalTrades != null) setTotal(data.stats.totalTrades); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Trades</p>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <p className="text-2xl font-bold text-foreground">{total}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">All time</p>
    </div>
  );
}
