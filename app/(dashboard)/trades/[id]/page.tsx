"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, Play, Share2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradeStatsPanel } from "@/components/trades/trade-detail/trade-stats-panel";
import { TradeChartPanel } from "@/components/trades/trade-detail/trade-chart-panel";
import type { Trade } from "@/types";

const TABS = ["Stats", "Strategy", "Executions", "Attachments", "Notes", "Running P&L"] as const;

function formatPnl(v: number) {
  const prefix = v >= 0 ? "$" : "-$";
  return `${prefix}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Stats");
  const [adjacentIds, setAdjacentIds] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trades/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setTrade(data))
      .catch(() => setTrade(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch adjacent trade IDs for prev/next navigation
  useEffect(() => {
    if (!trade) return;
    const params = new URLSearchParams();
    params.set("perPage", "100");
    params.set("sortField", "exitDate");
    params.set("sortDir", "desc");
    fetch(`/api/trades?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const trades: Trade[] = data.trades ?? [];
        const idx = trades.findIndex((t) => t.id === id);
        setAdjacentIds({
          prev: idx > 0 ? trades[idx - 1].id : null,
          next: idx < trades.length - 1 ? trades[idx + 1].id : null,
        });
      })
      .catch(() => {});
  }, [id, trade]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading trade...
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Trade not found</p>
        <button onClick={() => router.push("/trades")} className="text-sm text-primary hover:underline">
          Back to trades
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/trades")}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjacentIds.prev && router.push(`/trades/${adjacentIds.prev}`)}
              disabled={!adjacentIds.prev}
              className={cn("rounded-lg p-1.5 transition-colors", adjacentIds.prev ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-700")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => adjacentIds.next && router.push(`/trades/${adjacentIds.next}`)}
              disabled={!adjacentIds.next}
              className={cn("rounded-lg p-1.5 transition-colors", adjacentIds.next ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-700")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{trade.symbol}</h1>
              <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted-foreground capitalize">
                {trade.assetClass}
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                trade.pnl > 0 ? "bg-positive/10 text-positive" : trade.pnl < 0 ? "bg-destructive/10 text-destructive" : "bg-muted/10 text-muted-foreground"
              )}>
                {formatPnl(trade.pnl)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(trade.entryDate)} — {formatDate(trade.exitDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <CheckCircle className="h-3.5 w-3.5" />
            Mark as Reviewed
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Play className="h-3.5 w-3.5" />
            Replay
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors border-b-2",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Stats" ? (
        <div className="flex gap-4 flex-1 min-h-0">
          <TradeStatsPanel trade={trade} />
          <TradeChartPanel trade={trade} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-white/10 min-h-[200px]">
          <p className="text-sm text-gray-500">{activeTab} — coming soon</p>
        </div>
      )}

      {/* Notes section */}
      {trade.notes && (
        <div className="rounded-xl bg-[#16161f] border border-white/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Notes</h4>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {/* Tags */}
      {trade.tags && trade.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {trade.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
