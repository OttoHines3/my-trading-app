"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight } from "lucide-react";

export default function MaxDrawdownWidget() {
  const [dd, setDd] = useState(-2100);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.maxDrawdown != null) setDd(data.stats.maxDrawdown); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Max Drawdown</p>
      <div className="flex items-center gap-2">
        <ArrowDownRight className="h-5 w-5 text-destructive" />
        <p className="text-2xl font-bold text-destructive">-${Math.abs(dd).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Peak to trough</p>
    </div>
  );
}
