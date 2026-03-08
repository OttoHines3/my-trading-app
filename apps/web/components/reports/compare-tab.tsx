"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { calcWinRate, calcProfitFactor } from "@/lib/utils/calculations";
import { calcTradeExpectancy, calcAvgWinLoss } from "@/lib/utils/report-calculations";
import { useTradeFilters } from "@/lib/stores/trade-filters";

export function CompareTab() {
  const [trades, setTrades] = useState<{ pnl: number; exitDate: string; entryDate: string; symbol: string; assetClass: string }[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("perPage", "10000");
    fetch(`/api/trades?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setTrades(data.trades ?? []))
      .catch(() => {});
  }, [filterQuery]);

  // Split trades into two halves for comparison
  const sorted = [...trades].sort((a, b) => a.exitDate.localeCompare(b.exitDate));
  const mid = Math.ceil(sorted.length / 2);
  const period1 = sorted.slice(0, mid);
  const period2 = sorted.slice(mid);

  const getLabel = (t: typeof period1) => {
    if (!t.length) return "N/A";
    const first = t[0].exitDate.split("T")[0];
    const last = t[t.length - 1].exitDate.split("T")[0];
    return `${first} - ${last}`;
  };

  const calcStats = (t: typeof period1) => {
    const totalPnl = t.reduce((s, tr) => s + tr.pnl, 0);
    const wr = calcWinRate(t);
    const pf = calcProfitFactor(t);
    const exp = calcTradeExpectancy(t);
    const { avgWin, avgLoss } = calcAvgWinLoss(t);
    return [
      { label: "Trades", value: String(t.length) },
      { label: "Net P&L", value: `$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? "text-positive" : "text-destructive" },
      { label: "Win Rate", value: `${wr.toFixed(1)}%`, color: wr >= 50 ? "text-positive" : "text-destructive" },
      { label: "Profit Factor", value: pf === Infinity ? "---" : pf.toFixed(2), color: pf >= 1 ? "text-positive" : "text-destructive" },
      { label: "Expectancy", value: `$${exp.toFixed(2)}`, color: exp >= 0 ? "text-positive" : "text-destructive" },
      { label: "Avg Win", value: `$${avgWin.toFixed(2)}`, color: "text-positive" },
      { label: "Avg Loss", value: `$${avgLoss.toFixed(2)}`, color: "text-destructive" },
    ];
  };

  const stats1 = calcStats(period1);
  const stats2 = calcStats(period2);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Comparing first half vs second half of your filtered trades
      </p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: getLabel(period1), stats: stats1, title: "Period 1" },
          { label: getLabel(period2), stats: stats2, title: "Period 2" },
        ].map((period) => (
          <div key={period.title} className="rounded-xl border border-white/5 bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">{period.title}</h3>
            <p className="text-[10px] text-muted-foreground mb-3">{period.label}</p>
            <div className="space-y-2">
              {period.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className={cn("text-xs font-medium", stat.color ?? "text-foreground")}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
