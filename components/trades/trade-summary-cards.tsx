"use client";

import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

interface SummaryStats {
  netPnl: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winRate: number;
  dailyPnl: { date: string; pnl: number }[];
}

export function TradeSummaryCards() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    const params = new URLSearchParams(filterQuery);
    params.set("fields", "stats,dailyPnl");
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
            dailyPnl: data.dailyPnl ?? [],
          });
        }
      })
      .catch(() => {});
  }, [filterQuery]);

  // Cumulative P&L sparkline data
  const sparkData = useMemo(() => {
    if (!stats?.dailyPnl?.length) return [];
    let cum = 0;
    return stats.dailyPnl.map((d) => {
      cum += d.pnl;
      return { value: cum };
    });
  }, [stats?.dailyPnl]);

  // Win rate pie data
  const winPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Win", value: stats.winRate },
      { name: "Loss", value: 100 - stats.winRate },
    ];
  }, [stats]);

  // Avg win/loss bar data
  const avgBarData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Avg Win", value: stats.avgWin, fill: "#22c55e" },
      { name: "Avg Loss", value: -Math.abs(stats.avgLoss), fill: "#ef4444" },
    ];
  }, [stats]);

  const formatPnl = (v: number) => {
    const prefix = v >= 0 ? "$" : "-$";
    return `${prefix}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Net P&L with sparkline */}
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Net P&L</span>
          {stats && (stats.netPnl >= 0 ? (
            <TrendingUp className="h-4 w-4 text-positive" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          ))}
        </div>
        <p className={cn("text-lg font-bold mb-2", stats ? (stats.netPnl >= 0 ? "text-positive" : "text-destructive") : "text-muted-foreground")}>
          {stats ? formatPnl(stats.netPnl) : "--"}
        </p>
        {sparkData.length >= 2 && (
          <div className="h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="pnlSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stats!.netPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={stats!.netPnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={stats!.netPnl >= 0 ? "#22c55e" : "#ef4444"}
                  strokeWidth={1.5}
                  fill="url(#pnlSparkGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Profit Factor gauge */}
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Profit Factor</span>
        </div>
        <p className={cn("text-lg font-bold mb-2", stats && stats.profitFactor >= 1 ? "text-positive" : "text-destructive")}>
          {stats ? stats.profitFactor.toFixed(2) : "--"}
        </p>
        {stats && (
          <div className="h-10 flex items-end">
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", stats.profitFactor >= 1 ? "bg-positive" : "bg-destructive")}
                style={{ width: `${Math.min(100, (stats.profitFactor / 3) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Win Rate semicircle */}
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Trade Win %</span>
        </div>
        <p className={cn("text-lg font-bold", stats ? "text-foreground" : "text-muted-foreground")}>
          {stats ? `${stats.winRate.toFixed(1)}%` : "--"}
        </p>
        {stats && winPieData.length > 0 && (
          <div className="h-12 flex justify-center">
            <ResponsiveContainer width={80} height="100%">
              <PieChart>
                <Pie
                  data={winPieData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={20}
                  outerRadius={30}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#333" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Avg Win/Loss bar */}
      <div className="rounded-xl border border-white/5 bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Avg Win / Loss</span>
        </div>
        <div className="flex gap-3 text-sm font-bold mb-1">
          <span className="text-positive">{stats ? `$${stats.avgWin.toFixed(0)}` : "--"}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-destructive">{stats ? `$${Math.abs(stats.avgLoss).toFixed(0)}` : "--"}</span>
        </div>
        {stats && avgBarData.length > 0 && (
          <div className="h-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgBarData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                  {avgBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
