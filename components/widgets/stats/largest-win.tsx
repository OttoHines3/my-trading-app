"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

export default function LargestWinWidget() {
  const [pnl, setPnl] = useState(890);
  const [symbol, setSymbol] = useState("TSLA");

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.largestWin) {
          setPnl(data.stats.largestWin.pnl);
          setSymbol(data.stats.largestWin.symbol);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Largest Win</p>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-positive" />
        <p className="text-2xl font-bold text-positive">+${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{symbol}</p>
    </div>
  );
}
