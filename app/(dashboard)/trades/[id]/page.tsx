"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, Play, Share2, ArrowLeft, Bot, RefreshCw, Loader2, Upload, X, Image as ImageIcon, FileText, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradeStatsPanel } from "@/components/trades/trade-detail/trade-stats-panel";
import { AGChartsPanel } from "@/components/trades/trade-detail/ag-charts-panel";
import type { Trade } from "@/types";

// ── Types ────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  tradeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

const LEFT_TABS = ["Stats", "Strategy", "Executions", "Attachments"] as const;
const RIGHT_TABS = ["Chart", "Options Chart", "Notes", "Running P&L"] as const;

type LeftTab = (typeof LEFT_TABS)[number];
type RightTab = (typeof RIGHT_TABS)[number];

// ── Helpers ──────────────────────────────────────────────────────────

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExecDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Left Tab Panels ──────────────────────────────────────────────────

function StrategyPanel({ trade }: { trade: Trade }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Side & Asset Class */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Side</p>
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              trade.side === "long"
                ? "bg-positive/10 text-positive"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trade.side}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Asset Class</p>
          <span className="inline-block rounded bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 capitalize">
            {trade.assetClass}
          </span>
        </div>
      </div>

      {/* Strategy Notes */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Strategy</p>
        {trade.strategy ? (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{trade.strategy}</p>
        ) : (
          <p className="text-sm text-gray-600 italic">No strategy notes</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Tags</p>
        {trade.tags && trade.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {trade.tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 italic">No tags</p>
        )}
      </div>

      {/* Setup placeholder */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Setup</p>
        <div className="rounded-lg border border-dashed border-white/10 p-4 flex items-center justify-center">
          <p className="text-xs text-gray-600">Setup details coming soon</p>
        </div>
      </div>
    </div>
  );
}

function ExecutionsPanel({ trade }: { trade: Trade }) {
  const executions = [
    {
      type: "Entry",
      date: trade.entryDate,
      price: trade.entryPrice,
      qty: trade.quantity,
      side: trade.side === "long" ? "BUY" : "SELL",
    },
    {
      type: "Exit",
      date: trade.exitDate,
      price: trade.exitPrice,
      qty: trade.quantity,
      side: trade.side === "long" ? "SELL" : "BUY",
    },
  ];

  return (
    <div className="p-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
            <th className="text-left py-2 font-medium">Type</th>
            <th className="text-left py-2 font-medium">Date</th>
            <th className="text-right py-2 font-medium">Price</th>
            <th className="text-right py-2 font-medium">Qty</th>
            <th className="text-right py-2 font-medium">Side</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((exec) => (
            <tr key={exec.type} className="border-b border-white/5 last:border-0">
              <td className="py-2.5 text-gray-300 font-medium">{exec.type}</td>
              <td className="py-2.5 text-gray-400">{formatExecDate(exec.date)}</td>
              <td className="py-2.5 text-gray-300 text-right font-mono">
                ${exec.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 text-gray-300 text-right font-mono">{exec.qty}</td>
              <td className="py-2.5 text-right">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    exec.side === "BUY"
                      ? "bg-positive/10 text-positive"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {exec.side}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttachmentsPanel({ tradeId }: { tradeId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments);
      }
    } catch {
      // silently fail
    }
  }, [tradeId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`/api/trades/${tradeId}/attachments`, {
          method: "POST",
          body: formData,
        });
      }
      await fetchAttachments();
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/trades/${tradeId}/attachments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attachmentId }),
      });
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      // silently fail
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
          dragOver
            ? "border-white/20 bg-white/5"
            : "border-white/10 hover:border-white/20"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
        ) : (
          <Upload className="h-6 w-6 text-gray-500" />
        )}
        <p className="text-xs text-gray-500">
          {uploading ? "Uploading..." : "Drag and drop here"}
        </p>
        {!uploading && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Or Browse Files
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Attachment grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden group"
            >
              <button
                onClick={() => setLightboxUrl(att.url)}
                className="w-full aspect-square overflow-hidden"
              >
                <img
                  src={att.url}
                  alt={att.fileName}
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="p-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 truncate">{att.fileName}</p>
                  <p className="text-[10px] text-gray-600">{formatFileSize(att.fileSize)}</p>
                </div>
                <button
                  onClick={() => deleteAttachment(att.id)}
                  className="shrink-0 rounded p-1 text-gray-600 hover:bg-white/5 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Attachment preview"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Right Tab Panels ─────────────────────────────────────────────────

function NotesPanel({ trade }: { trade: Trade }) {
  return (
    <div className="p-6">
      {trade.notes ? (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{trade.notes}</p>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <FileText className="h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-600">No notes for this trade</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("Stats");
  const [rightTab, setRightTab] = useState<RightTab>("Chart");
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

  // ── Render left tab content ──
  const renderLeftContent = () => {
    switch (leftTab) {
      case "Stats":
        return <TradeStatsPanel trade={trade} />;
      case "Strategy":
        return <StrategyPanel trade={trade} />;
      case "Executions":
        return <ExecutionsPanel trade={trade} />;
      case "Attachments":
        return <AttachmentsPanel tradeId={id} />;
    }
  };

  // ── Render right tab content ──
  const renderRightContent = () => {
    switch (rightTab) {
      case "Chart":
        return <AGChartsPanel trade={trade} />;
      case "Options Chart":
        return trade.assetClass === "options" ? (
          <AGChartsPanel trade={trade} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <DollarSign className="h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-600">Options chart is only available for options trades</p>
          </div>
        );
      case "Notes":
        return <NotesPanel trade={trade} />;
      case "Running P&L":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Clock className="h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-600">Running P&L — coming soon</p>
          </div>
        );
    }
  };

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

      {/* Two-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left column */}
        <div className="w-[340px] shrink-0 flex flex-col rounded-xl bg-[#16161f] border border-white/5 overflow-hidden">
          {/* Left tabs */}
          <div className="flex border-b border-white/5">
            {LEFT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium transition-colors border-b-2",
                  leftTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Left tab content */}
          <div className="flex-1 overflow-y-auto">
            {renderLeftContent()}
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col rounded-xl bg-[#16161f] border border-white/5 overflow-hidden">
          {/* Right tabs */}
          <div className="flex border-b border-white/5">
            {RIGHT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium transition-colors border-b-2",
                  rightTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Right tab content */}
          <div className="flex-1 min-h-0">
            {renderRightContent()}
          </div>
        </div>
      </div>

      {/* AI Auto-Note */}
      <AutoNoteSection tradeId={id} autoNote={trade.autoNote} autoNoteAt={trade.autoNoteAt} />

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

// ── AI Auto-Note Section ──────────────────────────────────────────────

function AutoNoteSection({
  tradeId,
  autoNote,
  autoNoteAt,
}: {
  tradeId: string;
  autoNote?: string | null;
  autoNoteAt?: string | null;
}) {
  const [note, setNote] = useState(autoNote || null);
  const [noteAt, setNoteAt] = useState(autoNoteAt || null);
  const [loading, setLoading] = useState(false);

  const generateNote = async (regenerate = false) => {
    setLoading(true);
    try {
      const url = `/api/trades/${tradeId}/auto-analysis${regenerate ? "?regenerate=true" : ""}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setNote(data.autoNote);
      setNoteAt(data.autoNoteAt);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#16161f] border border-white/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-400" />
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            AI Auto-Note
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {noteAt && (
            <span className="text-[10px] text-gray-600">
              {new Date(noteAt).toLocaleString()}
            </span>
          )}
          <button
            onClick={() => generateNote(true)}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-gray-500 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {note ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>
      {loading && !note ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing trade...
        </div>
      ) : note ? (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{note}</p>
      ) : (
        <p className="text-sm text-gray-600">
          No auto-analysis yet. Click Generate to analyze this trade.
        </p>
      )}
    </div>
  );
}
