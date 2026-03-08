"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Link,
} from "lucide-react";

interface Insight {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  relatedTrades: string[];
  savedAt: string;
  agentType: string;
  thumbsUp: number;
  thumbsDown: number;
}

const CATEGORIES = [
  "All",
  "Strength",
  "Weakness",
  "Pattern",
  "Risk",
  "Recommendation",
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  strength: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  weakness: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  pattern: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  risk: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  recommendation: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
};

function getCategoryStyle(category: string) {
  return (
    CATEGORY_COLORS[category.toLowerCase()] ?? {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      dot: "bg-gray-400",
    }
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/5 bg-[#16161f] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-20 rounded-full bg-gray-700/50" />
        <div className="h-4 w-24 rounded bg-gray-700/50" />
      </div>
      <div className="mb-2 h-5 w-3/4 rounded bg-gray-700/50" />
      <div className="mb-1 h-4 w-full rounded bg-gray-700/50" />
      <div className="mb-1 h-4 w-full rounded bg-gray-700/50" />
      <div className="mb-4 h-4 w-2/3 rounded bg-gray-700/50" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-gray-700/50" />
        <div className="flex gap-2">
          <div className="h-7 w-14 rounded bg-gray-700/50" />
          <div className="h-7 w-14 rounded bg-gray-700/50" />
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(insightId: string, type: "thumbsUp" | "thumbsDown") {
    try {
      const res = await fetch("/api/insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, type }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsights((prev) =>
          prev.map((i) => (i.id === insightId ? data.insight : i))
        );
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/insights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setInsights((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete insight:", err);
    } finally {
      setDeletingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered =
    activeCategory === "All"
      ? insights
      : insights.filter(
          (i) => i.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Lightbulb className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Insights</h1>
          <p className="text-sm text-gray-400">
            {loading
              ? "Loading..."
              : `${insights.length} insight${insights.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        <Filter className="mr-1 h-4 w-4 shrink-0 text-gray-500" />
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const style =
            cat === "All" ? null : getCategoryStyle(cat);
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? cat === "All"
                    ? "bg-white/10 text-white"
                    : `${style!.bg} ${style!.text}`
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#16161f] py-20 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">No insights yet</p>
          <p className="mt-1 text-sm text-gray-500">
            {activeCategory === "All"
              ? "Chat with your AI agents to generate and save insights."
              : `No ${activeCategory.toLowerCase()} insights found. Try a different category.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((insight) => {
            const style = getCategoryStyle(insight.category);
            const isExpanded = expandedIds.has(insight.id);
            const isDeleting = deletingId === insight.id;

            return (
              <div
                key={insight.id}
                className="group flex flex-col rounded-xl border border-white/5 bg-[#16161f] p-5 transition-colors hover:border-white/10"
              >
                {/* Badge + Date Row */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {insight.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(insight.savedAt)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-2 text-sm font-semibold text-white">
                  {insight.title}
                </h3>

                {/* Content */}
                <div className="mb-3 flex-1">
                  <p
                    className={`text-sm leading-relaxed text-gray-300 ${
                      !isExpanded ? "line-clamp-3" : ""
                    }`}
                  >
                    {insight.content}
                  </p>
                  {insight.content.length > 180 && (
                    <button
                      onClick={() => toggleExpand(insight.id)}
                      className="mt-1 inline-flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-300"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Meta Row */}
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {insight.agentType}
                  </span>
                  {insight.relatedTrades.length > 0 && (
                    <a
                      href={`/journal?filter=${insight.relatedTrades.join(",")}`}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <Link className="h-3 w-3" />
                      {insight.relatedTrades.length} trade
                      {insight.relatedTrades.length !== 1 ? "s" : ""}
                    </a>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedback(insight.id, "thumbsUp")}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {insight.thumbsUp > 0 && insight.thumbsUp}
                    </button>
                    <button
                      onClick={() => handleFeedback(insight.id, "thumbsDown")}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {insight.thumbsDown > 0 && insight.thumbsDown}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(insight.id)}
                    disabled={isDeleting}
                    className="rounded-md p-1.5 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
