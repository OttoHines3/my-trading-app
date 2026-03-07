"use client";

import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";

export default function LargestLossWidget() {
  const [pnl, setPnl] = useState(-450);
  const [symbol, setSymbol] = useState("NVDA");

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.largestLoss) {
          setPnl(data.stats.largestLoss.pnl);
          setSymbol(data.stats.largestLoss.symbol);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Largest Loss</p>
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-destructive" />
        <p className="text-2xl font-bold text-destructive">-${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{symbol}</p>
    </div>
  );
}
