"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Radio,
  Clock,
  ImageOff,
} from "lucide-react";
import type { FinnhubNewsItem } from "@/lib/finnhub";

const CATEGORIES = [
  { key: "general", label: "All" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
  { key: "merger", label: "M&A" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

function timeAgo(unixSeconds: number): string {
  const now = Date.now();
  const diff = now - unixSeconds * 1000;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function categoryBadgeClass(category: string | undefined): string {
  switch (category?.toLowerCase()) {
    case "forex":
      return "bg-accent/15 text-accent";
    case "crypto":
      return "bg-accent/15 text-accent";
    case "merger":
      return "bg-purple-500/15 text-purple-400";
    default:
      return "bg-primary/15 text-primary";
  }
}

function categoryLabel(category: string | undefined): string {
  switch (category?.toLowerCase()) {
    case "forex":
      return "Forex";
    case "crypto":
      return "Crypto";
    case "merger":
      return "M&A";
    default:
      return "Macro";
  }
}

export default function NewsPage() {
  const [articles, setArticles] = useState<FinnhubNewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("general");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(
    async (category: CategoryKey, showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${category}`);
        const data = await res.json();
        setArticles(data.articles ?? []);
        setLastUpdated(new Date());
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchNews(activeCategory);

    intervalRef.current = setInterval(() => {
      fetchNews(activeCategory, false);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeCategory, fetchNews]);

  function handleCategoryChange(category: CategoryKey) {
    setActiveCategory(category);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Market News</h1>
            <p className="text-sm text-muted-foreground">
              Real-time market news from Finnhub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Live
            </span>
          </div>

          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Updated {timeAgo(Math.floor(lastUpdated.getTime() / 1000))}
            </span>
          )}

          <button
            onClick={() => fetchNews(activeCategory)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3 w-3", loading && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.key
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/5 bg-card p-5"
            >
              <div className="flex gap-4">
                <div className="h-20 w-32 shrink-0 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                  <div className="h-3 w-full rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-card card-glow p-12 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            No news articles found for this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, i) => (
            <ArticleCard key={`${article.url}-${i}`} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: FinnhubNewsItem }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-white/5 bg-card card-glow p-5 transition-colors hover:bg-white/[0.02]"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        {article.image && !imgError ? (
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-white/5">
            <img
              src={article.image}
              alt=""
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg bg-white/5">
            <ImageOff className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                {article.headline}
              </h3>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {article.summary && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {article.summary}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                categoryBadgeClass(article.category)
              )}
            >
              {categoryLabel(article.category)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {article.source}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(article.datetime)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
