"use client";

import { cn } from "@/lib/utils";
import type { Trade } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Props {
  trade: Trade;
}

function formatPnl(v: number) {
  const prefix = v >= 0 ? "$" : "-$";
  return `${prefix}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcRoi(trade: Trade): number {
  if (!trade.entryPrice || !trade.quantity) return 0;
  const multiplier = trade.assetClass === "options" ? 100 : 1;
  return (trade.pnl / (trade.entryPrice * trade.quantity * multiplier)) * 100;
}

function calcDuration(entry: string, exit: string): string {
  const ms = new Date(exit).getTime() - new Date(entry).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return `${hrs}h ${rem}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export function TradeStatsPanel({ trade }: Props) {
  const roi = calcRoi(trade);
  const duration = calcDuration(trade.entryDate, trade.exitDate);
  const multiplier = trade.assetClass === "options" ? 100 : 1;
  const positionSize = trade.entryPrice * trade.quantity * multiplier;
  const priceChange = trade.exitPrice - trade.entryPrice;
  const priceChangePct = trade.entryPrice > 0 ? (priceChange / trade.entryPrice) * 100 : 0;

  // Simple sparkline from entry to exit
  const sparkData = [
    { value: trade.entryPrice },
    { value: (trade.entryPrice + trade.exitPrice) / 2 + (trade.pnl > 0 ? priceChange * 0.3 : priceChange * 0.3) },
    { value: trade.exitPrice },
  ];

  const metrics = [
    { label: "Net P&L", value: formatPnl(trade.pnl), color: trade.pnl >= 0 ? "text-positive" : "text-destructive" },
    { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`, color: roi >= 0 ? "text-positive" : "text-destructive" },
    { label: "Duration", value: duration, color: "text-foreground" },
    { label: "Position Size", value: `$${positionSize.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-foreground" },
  ];

  const priceMetrics = [
    { label: "Entry Price", value: `$${trade.entryPrice.toFixed(2)}` },
    { label: "Exit Price", value: `$${trade.exitPrice.toFixed(2)}` },
    { label: "Price Change", value: `${priceChange >= 0 ? "+" : ""}$${priceChange.toFixed(2)} (${priceChangePct >= 0 ? "+" : ""}${priceChangePct.toFixed(2)}%)` },
    { label: "Quantity", value: String(Math.round(trade.quantity)) },
  ];

  const extraMetrics = [
    { label: "Asset Class", value: trade.assetClass.charAt(0).toUpperCase() + trade.assetClass.slice(1) },
    { label: "Side", value: trade.side.toUpperCase() },
    { label: "Strategy", value: trade.strategy ?? "—" },
    { label: "Commissions", value: trade.commissions ? `$${trade.commissions.toFixed(2)}` : "—" },
  ];

  return (
    <div className="w-[280px] shrink-0 space-y-4 overflow-y-auto">
      {/* Key Metrics */}
      <div className="rounded-xl bg-[#16161f] border border-white/5 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Key Metrics</h4>
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{m.label}</span>
            <span className={cn("text-sm font-bold", m.color)}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Price Analytics */}
      <div className="rounded-xl bg-[#16161f] border border-white/5 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Price Analytics</h4>
        {priceMetrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{m.label}</span>
            <span className="text-sm text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div className="rounded-xl bg-[#16161f] border border-white/5 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Price Movement</h4>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id="tradeSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trade.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trade.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={trade.pnl >= 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill="url(#tradeSparkGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Details */}
      <div className="rounded-xl bg-[#16161f] border border-white/5 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Details</h4>
        {extraMetrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{m.label}</span>
            <span className="text-sm text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Rating */}
      <div className="rounded-xl bg-[#16161f] border border-white/5 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Trade Rating</h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={cn(
                "text-lg",
                (trade.tradeRating ?? 0) >= star ? "text-yellow-400" : "text-gray-700"
              )}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
