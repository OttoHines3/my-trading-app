"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  id: string;
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  exitDate: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRADES: TradeRow[] = [
  { id: "1", symbol: "SPY", side: "long", entryPrice: 521.40, exitPrice: 523.85, pnl: 490, exitDate: "Today 11:42" },
  { id: "2", symbol: "QQQ", side: "short", entryPrice: 449.20, exitPrice: 447.60, pnl: 320, exitDate: "Today 10:15" },
  { id: "3", symbol: "TSLA", side: "long", entryPrice: 245.80, exitPrice: 247.90, pnl: 210, exitDate: "Today 09:52" },
  { id: "4", symbol: "NVDA", side: "long", entryPrice: 878.50, exitPrice: 876.10, pnl: -240, exitDate: "Today 09:38" },
  { id: "5", symbol: "AAPL", side: "short", entryPrice: 182.30, exitPrice: 181.80, pnl: 460, exitDate: "Yesterday" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTradeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  if (isToday) return `Today ${time}`;
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Recent Trades Widget ─────────────────────────────────────────────────────

const colClasses = "px-4 py-3 text-xs";

export default function RecentTradesWidget() {
  const [trades, setTrades] = useState<TradeRow[]>(MOCK_TRADES);

  useEffect(() => {
    fetch("/api/trades?limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (data.trades && data.trades.length > 0) {
          const mapped = data.trades.map((t: TradeRow) => ({
            ...t,
            exitDate: formatTradeDate(t.exitDate),
          }));
          setTrades(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const winners = trades.filter((t) => t.pnl > 0).length;
  const losers = trades.filter((t) => t.pnl <= 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card card-glow transition-all duration-200 h-full">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Trades
        </p>
        <button className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full" aria-label="Recent trades">
          <thead>
            <tr className="border-b border-white/5">
              {["Symbol", "Side", "Entry", "Exit", "P&L", "Date"].map((h) => (
                <th
                  key={h}
                  className={cn(colClasses, "text-left font-semibold uppercase tracking-wider text-muted-foreground/70")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                <td className={cn(colClasses, "font-bold text-foreground")}>{t.symbol}</td>
                <td className={colClasses}>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      t.side === "long"
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {t.side}
                  </span>
                </td>
                <td className={cn(colClasses, "font-mono text-foreground/80")}>{t.entryPrice.toFixed(2)}</td>
                <td className={cn(colClasses, "font-mono text-foreground/80")}>{t.exitPrice.toFixed(2)}</td>
                <td className={cn(colClasses, "font-bold", t.pnl >= 0 ? "text-positive" : "text-destructive")}>
                  {t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}
                </td>
                <td className={cn(colClasses, "text-muted-foreground")}>{t.exitDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-6 border-t border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-positive" aria-hidden="true" />
          <span>{winners} winner{winners !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <span>{losers} loser{losers !== 1 ? "s" : ""}</span>
        </div>
        <div className={cn("ml-auto text-xs font-semibold", totalPnl >= 0 ? "text-positive" : "text-destructive")}>
          {totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
