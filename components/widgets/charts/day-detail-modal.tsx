"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Trade } from "@/types";

interface DayDetailModalProps {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? "$" : "-$";
  return `${prefix}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function parseOptionSymbol(symbol: string): { ticker: string; expiry: string; strike: number; type: "CALL" | "PUT" } | null {
  const match = symbol.trim().match(/^(\w+)\s+(\d{2})(\d{2})(\d{2})(C|P)(\d+)/);
  if (!match) return null;
  const [, ticker, yy, mm, dd, type, strikeRaw] = match;
  return {
    ticker,
    expiry: `${mm}-${dd}-20${yy}`,
    strike: Math.round(parseInt(strikeRaw, 10) / 10),
    type: type === "C" ? "CALL" : "PUT",
  };
}

function formatInstrument(trade: Trade): string {
  const opt = parseOptionSymbol(trade.symbol);
  if (opt) return `${opt.expiry} ${opt.strike} ${opt.type}`;
  return trade.symbol;
}

function getOptionSide(trade: Trade): string {
  const opt = parseOptionSymbol(trade.symbol);
  if (opt) return opt.type;
  return trade.side === "long" ? "BUY" : "SELL";
}

function calcRoi(trade: Trade): string {
  if (!trade.entryPrice || !trade.quantity) return "—";
  const multiplier = trade.assetClass === "options" ? 100 : 1;
  const roi = (trade.pnl / (trade.entryPrice * trade.quantity * multiplier)) * 100;
  if (Math.abs(roi) > 999) return "—";
  return `(${roi >= 0 ? "" : "-"}${Math.abs(roi).toFixed(2)}%)`;
}

export default function DayDetailModal({ date, isOpen, onClose }: DayDetailModalProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trades?dateFrom=${date}&dateTo=${date}&perPage=100&sortField=entryDate&sortDir=asc`
      );
      const json = await res.json();
      setTrades(json.trades ?? []);
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (isOpen && date) fetchTrades();
  }, [isOpen, date, fetchTrades]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Computed stats
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const grossPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const winners = trades.filter((t) => t.pnl > 0);
    const losers = trades.filter((t) => t.pnl < 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
    const volume = trades.reduce((s, t) => s + t.quantity, 0);
    const grossProfit = winners.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const commissions = trades.reduce((s, t) => s + (t.commissions ?? 0), 0);

    return { totalTrades, grossPnl, winners: winners.length, losers: losers.length, winRate, volume, profitFactor, commissions };
  }, [trades]);

  // Cumulative P&L chart data
  const chartData = useMemo(() => {
    let cumulative = 0;
    return trades.map((t) => {
      cumulative += t.pnl;
      return { pnl: cumulative };
    });
  }, [trades]);

  const finalPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-4xl bg-[#0a0a0f] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{formatDateLabel(date)}</h2>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">Net P&L</span>
            <span
              className={cn(
                "text-xl font-bold",
                stats.grossPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
              )}
            >
              {formatPnl(stats.grossPnl)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
              <Play className="h-3.5 w-3.5" />
              Replay
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add note
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading trades...</div>
          ) : (
            <>
              {/* Top section: chart + stats */}
              <div className="flex gap-5 mb-6">
                {/* Cumulative P&L chart */}
                <div className="w-[40%] rounded-xl bg-[#16161f] border border-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                    Cumulative P&L
                  </p>
                  {chartData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="dayPnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor={finalPnl >= 0 ? "#22c55e" : "#ef4444"}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor={finalPnl >= 0 ? "#22c55e" : "#ef4444"}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <YAxis
                          hide={false}
                          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                          tickFormatter={(v: number) => `$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1a1a26",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ display: "none" }}
                          formatter={(value) => [formatPnl(Number(value)), "P&L"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="pnl"
                          stroke={finalPnl >= 0 ? "#22c55e" : "#ef4444"}
                          strokeWidth={2}
                          fill="url(#dayPnlGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-gray-500 text-xs">
                      Not enough data
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="w-[60%] grid grid-cols-4 grid-rows-2 gap-4">
                  {[
                    { label: "Total Trades", value: String(stats.totalTrades), color: "text-white" },
                    {
                      label: "Gross P&L",
                      value: formatPnl(stats.grossPnl),
                      color: stats.grossPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]",
                    },
                    {
                      label: "Winners / Losers",
                      value: `${stats.winners} / ${stats.losers}`,
                      color: "text-white",
                    },
                    {
                      label: "Commissions",
                      value: formatPnl(stats.commissions),
                      color: "text-white",
                    },
                    {
                      label: "Win Rate",
                      value: `${stats.winRate.toFixed(2)}%`,
                      color: "text-white",
                    },
                    { label: "Volume", value: String(Math.round(stats.volume)), color: "text-white" },
                    {
                      label: "Profit Factor",
                      value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2),
                      color: "text-white",
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-[#16161f] border border-white/5 p-4 flex flex-col justify-center">
                      <span className="text-xs text-gray-400 mb-1">{stat.label}</span>
                      <span className={cn("text-lg font-bold", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trades table */}
              <div className="rounded-xl bg-[#16161f] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Open Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Side</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ticker</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Instrument</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Net P&L</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Net ROI</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">R-Multiple</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Strategy</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Replay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                            No trades found for this day
                          </td>
                        </tr>
                      ) : (
                        trades.map((trade) => {
                          const opt = parseOptionSymbol(trade.symbol);
                          const ticker = opt ? opt.ticker : trade.symbol.split(/\s+/)[0];
                          return (
                            <tr
                              key={trade.id}
                              className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="px-4 py-4 text-sm text-gray-300">
                                {formatTime(trade.entryDate)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-300">
                                {getOptionSide(trade)}
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-white">
                                  {ticker}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-300 text-center">
                                {Math.round(trade.quantity)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-300">
                                {formatInstrument(trade)}
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-4 text-sm font-bold text-right",
                                  trade.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                                )}
                              >
                                {formatPnl(trade.pnl)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-400 text-right">
                                {calcRoi(trade)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500 text-right">—</td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {trade.strategy ?? "—"}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button className="rounded-full bg-blue-600/20 p-1.5 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors">
                                  <Play className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </>
  );
}
