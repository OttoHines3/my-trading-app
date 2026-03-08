"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  headline: string;
  source: string;
  url: string;
  timeAgo: string;
  tag: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── News Feed Widget ─────────────────────────────────────────────────────────

export default function NewsFeedWidget() {
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
    <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card card-glow transition-all duration-200 h-full">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
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
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {item.source}
              </span>
              <span className="ml-auto text-[10px] text-gray-500">{item.timeAgo}</span>
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
