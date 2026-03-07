"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import {
  calcAvgHoldTime,
  calcLoggedDays,
  calcAvgDailyVolume,
  calcAvgDailyNetPnl,
  calcAvgDailyWinRate,
  calcMaxDailyDrawdown,
  calcAvgDailyDrawdown,
  calcTradeExpectancy,
  calcAvgWinLoss,
} from "@/lib/utils/report-calculations";
import { calcWinRate, calcProfitFactor } from "@/lib/utils/calculations";

const SUB_TABS = ["Summary", "Days", "Trades"] as const;
type SubTab = (typeof SUB_TABS)[number];

interface TradeData {
  pnl: number;
  entryDate: string;
  exitDate: string;
  symbol: string;
  assetClass: string;
}

export function PerformanceSummaryGrid() {
  const [subTab, setSubTab] = useState<SubTab>("Summary");
  const [trades, setTrades] = useState<TradeData[]>([]);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("perPage", "10000");
    fetch(`/api/trades?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setTrades(data.trades ?? []))
      .catch(() => {});
  }, [filterQuery]);

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = calcWinRate(trades);
  const profitFactor = calcProfitFactor(trades);
  const expectancy = calcTradeExpectancy(trades);
  const { avgWin, avgLoss } = calcAvgWinLoss(trades);
  const avgHoldTime = calcAvgHoldTime(trades);
  const loggedDays = calcLoggedDays(trades);
  const avgDailyVolume = calcAvgDailyVolume(trades);
  const avgDailyNetPnl = calcAvgDailyNetPnl(trades);
  const avgDailyWinRate = calcAvgDailyWinRate(trades);
  const maxDailyDrawdown = calcMaxDailyDrawdown(trades);
  const avgDailyDrawdown = calcAvgDailyDrawdown(trades);

  const fmt = (v: number, prefix = "$") => `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  const summaryStats = [
    { label: "Net P&L", value: fmt(totalPnl), color: totalPnl >= 0 ? "text-positive" : "text-destructive" },
    { label: "Trade Expectancy", value: fmt(expectancy), color: expectancy >= 0 ? "text-positive" : "text-destructive" },
    { label: "Avg Net Trade P&L", value: fmt(trades.length ? totalPnl / trades.length : 0), color: totalPnl >= 0 ? "text-positive" : "text-destructive" },
    { label: "Avg Daily Volume", value: avgDailyVolume.toFixed(1), color: "text-foreground" },
    { label: "Win %", value: fmtPct(winRate), color: winRate >= 50 ? "text-positive" : "text-destructive" },
    { label: "Profit Factor", value: profitFactor === Infinity ? "---" : profitFactor.toFixed(2), color: profitFactor >= 1 ? "text-positive" : "text-destructive" },
    { label: "Avg Trade Win", value: fmt(avgWin), color: "text-positive" },
    { label: "Avg Trade Loss", value: fmt(avgLoss), color: "text-destructive" },
  ];

  const dayStats = [
    { label: "Logged Days", value: String(loggedDays), color: "text-foreground" },
    { label: "Avg Daily Net P&L", value: fmt(avgDailyNetPnl), color: avgDailyNetPnl >= 0 ? "text-positive" : "text-destructive" },
    { label: "Avg Daily Win Rate", value: fmtPct(avgDailyWinRate), color: avgDailyWinRate >= 50 ? "text-positive" : "text-destructive" },
    { label: "Max Daily Drawdown", value: fmt(maxDailyDrawdown), color: "text-destructive" },
    { label: "Avg Daily Drawdown", value: fmt(avgDailyDrawdown), color: "text-destructive" },
    { label: "Avg Daily Volume", value: avgDailyVolume.toFixed(1), color: "text-foreground" },
  ];

  const tradeStats = [
    { label: "Total Trades", value: String(trades.length), color: "text-foreground" },
    { label: "Avg Hold Time", value: `${avgHoldTime.toFixed(1)}h`, color: "text-foreground" },
    { label: "Trade Expectancy", value: fmt(expectancy), color: expectancy >= 0 ? "text-positive" : "text-destructive" },
    { label: "Avg Win", value: fmt(avgWin), color: "text-positive" },
    { label: "Avg Loss", value: fmt(avgLoss), color: "text-destructive" },
    { label: "Profit Factor", value: profitFactor === Infinity ? "---" : profitFactor.toFixed(2), color: profitFactor >= 1 ? "text-positive" : "text-destructive" },
  ];

  const activeStats = subTab === "Summary" ? summaryStats : subTab === "Days" ? dayStats : tradeStats;

  return (
    <div className="rounded-xl border border-white/5 bg-card p-4">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground">Performance Summary</h3>
        <div className="flex gap-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                subTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {activeStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/5 bg-gray-950/50 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
            <p className={cn("text-sm font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
