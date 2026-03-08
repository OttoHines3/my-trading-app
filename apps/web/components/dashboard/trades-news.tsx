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

interface NewsItem {
  headline: string;
  source: string;
  url: string;
  timeAgo: string;
  tag: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRADES: TradeRow[] = [
  { id: "1", symbol: "SPY", side: "long", entryPrice: 521.40, exitPrice: 523.85, pnl: 490, exitDate: "Today 11:42" },
  { id: "2", symbol: "QQQ", side: "short", entryPrice: 449.20, exitPrice: 447.60, pnl: 320, exitDate: "Today 10:15" },
  { id: "3", symbol: "TSLA", side: "long", entryPrice: 245.80, exitPrice: 247.90, pnl: 210, exitDate: "Today 09:52" },
  { id: "4", symbol: "NVDA", side: "long", entryPrice: 878.50, exitPrice: 876.10, pnl: -240, exitDate: "Today 09:38" },
  { id: "5", symbol: "AAPL", side: "short", entryPrice: 182.30, exitPrice: 181.80, pnl: 460, exitDate: "Yesterday" },
];

const MOCK_NEWS: NewsItem[] = [
  { source: "Reuters", headline: "Fed officials signal possible rate cuts as inflation data improves", timeAgo: "12m ago", tag: "Fed", url: "#" },
  { source: "Bloomberg", headline: "CPI report expected to show cooling inflation ahead of key release", timeAgo: "28m ago", tag: "Macro", url: "#" },
  { source: "CNBC", headline: "NVIDIA beats Q3 estimates; data center revenue surges 200%", timeAgo: "1h ago", tag: "Earnings", url: "#" },
  { source: "CoinDesk", headline: "Bitcoin consolidates near $68K as ETF inflows continue", timeAgo: "1h 15m ago", tag: "Crypto", url: "#" },
  { source: "WSJ", headline: "Oil prices drop as OPEC output deal faces uncertainty", timeAgo: "2h ago", tag: "Energy", url: "#" },
];

// ── Tag styles ───────────────────────────────────────────────────────────────

const tagStyles: Record<string, string> = {
  Macro: "bg-primary/15 text-primary",
  Fed: "bg-purple-500/15 text-purple-400",
  Earnings: "bg-amber-400/15 text-amber-400",
  Crypto: "bg-accent/15 text-accent",
  Energy: "bg-orange-400/15 text-orange-400",
  general: "bg-primary/15 text-primary",
  forex: "bg-accent/15 text-accent",
  crypto: "bg-accent/15 text-accent",
  merger: "bg-purple-500/15 text-purple-400",
};

function getTag(category?: string): string {
  if (!category) return "Macro";
  const map: Record<string, string> = {
    general: "Macro",
    forex: "Forex",
    crypto: "Crypto",
    merger: "M&A",
  };
  return map[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

function getTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp * 1000;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

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

// ── Recent Trades ────────────────────────────────────────────────────────────

const colClasses = "px-4 py-3 text-xs";

export function RecentTrades() {
  const [trades, setTrades] = useState<TradeRow[]>(MOCK_TRADES);
  const [isReal, setIsReal] = useState(false);

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
          setIsReal(true);
        }
      })
      .catch(() => {});
  }, []);

  const winners = trades.filter((t) => t.pnl > 0).length;
  const losers = trades.filter((t) => t.pnl <= 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card card-glow transition-all duration-200">
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

// ── News Feed ────────────────────────────────────────────────────────────────

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          const mapped: NewsItem[] = data.articles.slice(0, 5).map((a: { headline: string; source: string; url: string; datetime: number; category?: string }) => ({
            headline: a.headline,
            source: a.source,
            url: a.url,
            timeAgo: getTimeAgo(a.datetime),
            tag: getTag(a.category),
          }));
          setNews(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card card-glow transition-all duration-200 h-full">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          News Feed
        </p>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          LIVE
        </span>
      </div>

      <div className="flex flex-col divide-y divide-white/[0.04] overflow-y-auto scrollbar-thin flex-1">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1.5 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  tagStyles[item.tag] ?? tagStyles.general
                )}
              >
                {item.tag}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {item.source}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">{item.timeAgo}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-foreground/90">
              {item.headline}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
