"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

interface Stats {
  winRate: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  totalTrades: number;
  expectancy: number;
}

const defaults: Stats = {
  winRate: 67, profitFactor: 2.4, avgWinner: 320,
  avgLoser: -180, totalTrades: 64, expectancy: 45.6,
};

export default function PerformanceSummaryWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as Stats | null });
  const stats: Stats = {
    winRate: res.stats?.winRate ?? defaults.winRate,
    profitFactor: res.stats?.profitFactor ?? defaults.profitFactor,
    avgWinner: res.stats?.avgWinner ?? defaults.avgWinner,
    avgLoser: res.stats?.avgLoser ?? defaults.avgLoser,
    totalTrades: res.stats?.totalTrades ?? defaults.totalTrades,
    expectancy: res.stats?.expectancy ?? defaults.expectancy,
  };

  const rows = [
    { label: "Win Rate", value: `${stats.winRate}%`, color: stats.winRate >= 50 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "Profit Factor", value: stats.profitFactor === Infinity ? "Infinity" : `${stats.profitFactor.toFixed(2)}x`, color: stats.profitFactor >= 1 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "Avg Winner", value: `+$${stats.avgWinner.toFixed(2)}`, color: "text-[#22c55e]" },
    { label: "Avg Loser", value: `-$${Math.abs(stats.avgLoser).toFixed(2)}`, color: "text-[#ef4444]" },
    { label: "Total Trades", value: String(stats.totalTrades), color: "text-white" },
    { label: "Expectancy", value: `${stats.expectancy >= 0 ? "+" : ""}$${stats.expectancy.toFixed(2)}`, color: stats.expectancy >= 0 ? "text-[#22c55e]" : "text-[#ef4444]" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card card-glow transition-all duration-200 h-full">
      <div className="border-b border-white/5 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Performance Summary</p>
      </div>
      <div className="flex flex-col divide-y divide-white/[0.04] flex-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className={cn("text-sm font-bold", row.color)}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
