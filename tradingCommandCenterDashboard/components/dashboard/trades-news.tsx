"use client"

import { cn } from "@/lib/utils"

// ── Recent Trades ─────────────────────────────────────────────────────────────
type Side = "LONG" | "SHORT"

const trades: {
  symbol: string
  side: Side
  entry: string
  exit: string
  pnl: string
  pnlNum: number
  date: string
}[] = [
  { symbol: "SPY", side: "LONG", entry: "521.40", exit: "523.85", pnl: "+$490.00", pnlNum: 490, date: "Today 11:42" },
  { symbol: "QQQ", side: "SHORT", entry: "449.20", exit: "447.60", pnl: "+$320.00", pnlNum: 320, date: "Today 10:15" },
  { symbol: "TSLA", side: "LONG", entry: "245.80", exit: "247.90", pnl: "+$210.00", pnlNum: 210, date: "Today 09:52" },
  { symbol: "NVDA", side: "LONG", entry: "878.50", exit: "876.10", pnl: "-$240.00", pnlNum: -240, date: "Today 09:38" },
  { symbol: "AAPL", side: "SHORT", entry: "182.30", exit: "181.80", pnl: "+$460.00", pnlNum: 460, date: "Yesterday" },
]

const colClasses = "px-4 py-3 text-xs"

export function RecentTrades() {
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
                  className={cn(
                    colClasses,
                    "text-left font-semibold uppercase tracking-wider text-muted-foreground/70"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr
                key={i}
                className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
              >
                <td className={cn(colClasses, "font-bold text-foreground")}>{t.symbol}</td>
                <td className={colClasses}>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      t.side === "LONG"
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {t.side}
                  </span>
                </td>
                <td className={cn(colClasses, "font-mono text-foreground/80")}>{t.entry}</td>
                <td className={cn(colClasses, "font-mono text-foreground/80")}>{t.exit}</td>
                <td
                  className={cn(
                    colClasses,
                    "font-bold",
                    t.pnlNum >= 0 ? "text-positive" : "text-destructive"
                  )}
                >
                  {t.pnl}
                </td>
                <td className={cn(colClasses, "text-muted-foreground")}>{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 border-t border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-positive" aria-hidden="true" />
          <span>4 winners</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <span>1 loser</span>
        </div>
        <div className="ml-auto text-xs font-semibold text-positive">+$1,240.00</div>
      </div>
    </div>
  )
}

// ── News Feed ─────────────────────────────────────────────────────────────────
type NewsTag = "Macro" | "Fed" | "Earnings" | "Crypto" | "Energy"

const tagStyles: Record<NewsTag, string> = {
  Macro: "bg-primary/15 text-primary",
  Fed: "bg-purple-500/15 text-purple-400",
  Earnings: "bg-amber-400/15 text-amber-400",
  Crypto: "bg-accent/15 text-accent",
  Energy: "bg-orange-400/15 text-orange-400",
}

const news: {
  source: string
  headline: string
  timeAgo: string
  tag: NewsTag
}[] = [
  {
    source: "Reuters",
    headline: "Fed officials signal possible rate cuts as inflation data improves",
    timeAgo: "12m ago",
    tag: "Fed",
  },
  {
    source: "Bloomberg",
    headline: "CPI report expected to show cooling inflation ahead of key release",
    timeAgo: "28m ago",
    tag: "Macro",
  },
  {
    source: "CNBC",
    headline: "NVIDIA beats Q3 estimates; data center revenue surges 200%",
    timeAgo: "1h ago",
    tag: "Earnings",
  },
  {
    source: "CoinDesk",
    headline: "Bitcoin consolidates near $68K as ETF inflows continue",
    timeAgo: "1h 15m ago",
    tag: "Crypto",
  },
  {
    source: "WSJ",
    headline: "Oil prices drop as OPEC output deal faces uncertainty",
    timeAgo: "2h ago",
    tag: "Energy",
  },
]

export function NewsFeed() {
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
          <div
            key={i}
            className="flex flex-col gap-1.5 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  tagStyles[item.tag]
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
          </div>
        ))}
      </div>
    </div>
  )
}
