"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { useTradeFilters } from "@/lib/stores/trade-filters";

interface SummaryStats {
  netPnl: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winRate: number;
}

export function TradeSummaryCards() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("fields", "stats");
    fetch(`/api/widget-data?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) {
          setStats({
            netPnl: data.stats.totalPnl,
            profitFactor: data.stats.profitFactor,
            avgWin: data.stats.avgWinner,
            avgLoss: data.stats.avgLoser,
            totalTrades: data.stats.totalTrades,
            winRate: data.stats.winRate,
          });
        }
      })
      .catch(() => {});
  }, [filterQuery]);

  const cards = [
    {
      label: "Net P&L",
      value: stats ? `$${stats.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "--",
      icon: stats && stats.netPnl >= 0 ? TrendingUp : TrendingDown,
      color: stats ? (stats.netPnl >= 0 ? "text-positive" : "text-destructive") : "text-muted-foreground",
    },
    {
      label: "Profit Factor",
      value: stats ? stats.profitFactor.toFixed(2) : "--",
      icon: Target,
      color: stats && stats.profitFactor >= 1 ? "text-positive" : "text-destructive",
    },
    {
      label: "Avg Win",
      value: stats ? `$${stats.avgWin.toFixed(2)}` : "--",
      icon: TrendingUp,
      color: "text-positive",
    },
    {
      label: "Avg Loss",
      value: stats ? `$${Math.abs(stats.avgLoss).toFixed(2)}` : "--",
      icon: TrendingDown,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{card.label}</span>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
