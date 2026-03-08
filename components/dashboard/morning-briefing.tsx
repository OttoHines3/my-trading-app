"use client";

import { useState, useEffect } from "react";
import { Bot, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface BriefingData {
  content: string;
  date: string;
  vixLevel: number | null;
  spyPrice: number | null;
  createdAt: string;
}

export function MorningBriefing() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);

  const fetchBriefing = async (regenerate = false) => {
    try {
      if (regenerate) setRegenerating(true);
      else setLoading(true);

      const url = regenerate
        ? "/api/daily-briefing?regenerate=true"
        : "/api/daily-briefing";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch briefing");
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (err) {
      console.error("Morning briefing fetch error:", err);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      setIsWeekend(true);
      setLoading(false);
      return;
    }
    fetchBriefing();
  }, []);

  // Don't render on weekends or if dismissed
  if (isWeekend || dismissed) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#16161f] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-5 w-40 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-4/6 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  const formattedDate = new Date(briefing.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  return (
    <div className="rounded-xl border border-white/5 bg-[#16161f] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Morning Briefing
            </h3>
            <p className="text-xs text-white/40">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Regenerate */}
          <button
            onClick={() => fetchBriefing(true)}
            disabled={regenerating}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors disabled:opacity-30"
            title="Regenerate briefing"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
            />
          </button>

          {/* Expand / Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Dismiss for today"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Market data pills */}
      {(briefing.vixLevel !== null || briefing.spyPrice !== null) && (
        <div className="flex items-center gap-2 mt-3 mb-3">
          {briefing.spyPrice !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
              SPY{" "}
              <span className="text-white/90">
                ${briefing.spyPrice.toFixed(2)}
              </span>
            </span>
          )}
          {briefing.vixLevel !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                briefing.vixLevel > 25
                  ? "bg-red-500/10 text-red-400"
                  : briefing.vixLevel > 18
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              VIX{" "}
              <span className="font-semibold">
                {briefing.vixLevel.toFixed(1)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {expanded && (
        <div className="mt-3 text-sm leading-relaxed text-white/70 prose prose-invert prose-sm max-w-none prose-strong:text-white/90 prose-p:my-1.5">
          {briefing.content.split("\n").map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Bold markdown headers: **text**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={i} className="my-1">
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={j} className="text-white/90 font-semibold">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>
      )}

      {/* Regenerating overlay */}
      {regenerating && (
        <div className="mt-3 flex items-center gap-2 text-xs text-indigo-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Regenerating briefing...
        </div>
      )}
    </div>
  );
}
