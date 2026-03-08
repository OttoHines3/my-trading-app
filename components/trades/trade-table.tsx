"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import { useColumnConfig, ALL_COLUMNS } from "@/lib/stores/column-config";
import { TradePagination } from "./trade-pagination";
import { ColumnSelectorModal } from "./column-selector-modal";
import type { Trade } from "@/types";

type SortField = "entryDate" | "exitDate" | "symbol" | "pnl" | "entryPrice" | "exitPrice";
type SortDir = "asc" | "desc";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function formatPrice(p: number) {
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcDuration(entry: string, exit: string): string {
  const ms = new Date(exit).getTime() - new Date(entry).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return `${hrs}h ${rem}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function calcRoi(trade: Trade): string {
  if (!trade.entryPrice || !trade.quantity) return "—";
  const multiplier = trade.assetClass === "options" ? 100 : 1;
  const roi = (trade.pnl / (trade.entryPrice * trade.quantity * multiplier)) * 100;
  if (Math.abs(roi) > 999) return "—";
  return `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;
}

function getStatus(pnl: number) {
  if (pnl > 0) return { label: "WIN", cls: "bg-positive/10 text-positive" };
  if (pnl < 0) return { label: "LOSS", cls: "bg-destructive/10 text-destructive" };
  return { label: "BE", cls: "bg-muted/10 text-muted-foreground" };
}

export function TradeTable() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>("exitDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colModalOpen, setColModalOpen] = useState(false);
  const filterQuery = useTradeFilters((s) => s.toQueryString());
  const visibleKeys = useColumnConfig((s) => s.visibleKeys);

  const visibleColumns = ALL_COLUMNS.filter((c) => visibleKeys.includes(c.key));

  const fetchTrades = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams(filterQuery);
    params.set("page", String(page));
    params.set("perPage", String(perPage));
    params.set("sortField", sortField);
    params.set("sortDir", sortDir);

    fetch(`/api/trades?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterQuery, page, perPage, sortField, sortDir]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);
  useEffect(() => { setPage(1); }, [filterQuery]);

  const toggleSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(f);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const allSelected = trades.length > 0 && trades.every((t) => selected.has(t.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(trades.map((t) => t.id)));
    }
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderCell = (col: typeof ALL_COLUMNS[number], trade: Trade) => {
    switch (col.key) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={selected.has(trade.id)}
            onChange={(e) => { e.stopPropagation(); toggleOne(trade.id); }}
            className="accent-primary h-3.5 w-3.5"
          />
        );
      case "entryDate":
        return <span className="text-foreground">{formatDate(trade.entryDate)}</span>;
      case "exitDate":
        return <span className="text-foreground">{formatDate(trade.exitDate)}</span>;
      case "symbol":
        return <span className="font-medium text-foreground">{trade.symbol}</span>;
      case "side":
        return (
          <span className={cn("text-xs font-medium", trade.side === "long" ? "text-positive" : "text-destructive")}>
            {trade.side.toUpperCase()}
          </span>
        );
      case "assetClass":
        return <span className="text-muted-foreground capitalize">{trade.assetClass}</span>;
      case "quantity":
        return <span className="text-foreground">{Math.round(trade.quantity)}</span>;
      case "entryPrice":
        return <span className="text-foreground">{formatPrice(trade.entryPrice)}</span>;
      case "exitPrice":
        return <span className="text-foreground">{formatPrice(trade.exitPrice)}</span>;
      case "pnl": {
        return (
          <span className={cn("font-medium", trade.pnl >= 0 ? "text-positive" : "text-destructive")}>
            {trade.pnl >= 0 ? "+" : ""}${formatPrice(Math.abs(trade.pnl))}
          </span>
        );
      }
      case "roi":
        return <span className={cn("text-xs", trade.pnl >= 0 ? "text-positive" : "text-destructive")}>{calcRoi(trade)}</span>;
      case "duration":
        return <span className="text-muted-foreground">{calcDuration(trade.entryDate, trade.exitDate)}</span>;
      case "status": {
        const status = getStatus(trade.pnl);
        return (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", status.cls)}>
            {status.label}
          </span>
        );
      }
      case "strategy":
        return <span className="text-muted-foreground">{trade.strategy ?? "—"}</span>;
      case "commissions":
        return <span className="text-muted-foreground">{trade.commissions ? `$${trade.commissions.toFixed(2)}` : "—"}</span>;
      case "tags":
        return (
          <div className="flex gap-1 flex-wrap">
            {(trade.tags ?? []).map((t) => (
              <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
            ))}
            {(!trade.tags || trade.tags.length === 0) && "—"}
          </div>
        );
      case "notes":
        return <span className="text-muted-foreground truncate max-w-[120px] block">{trade.notes ?? "—"}</span>;
      case "reviewed":
        return <span className={trade.reviewed ? "text-positive" : "text-muted-foreground/40"}>{trade.reviewed ? "Yes" : "No"}</span>;
      case "tradeRating":
        return trade.tradeRating ? (
          <span className="text-yellow-400">{"★".repeat(trade.tradeRating)}{"☆".repeat(5 - trade.tradeRating)}</span>
        ) : <span className="text-muted-foreground/40">—</span>;
      default:
        return "—";
    }
  };

  return (
    <>
      <div className="rounded-xl border border-white/5 bg-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="text-xs text-muted-foreground">
            {selected.size > 0 && <span>{selected.size} selected</span>}
          </div>
          <button
            onClick={() => setColModalOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            title="Configure columns"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-medium text-muted-foreground",
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    )}
                  >
                    {col.key === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-primary h-3.5 w-3.5"
                      />
                    ) : col.sortField ? (
                      <button onClick={() => toggleSort(col.sortField!)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {col.label}
                        <SortIcon field={col.sortField} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : trades.length === 0 ? (
                <tr><td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-muted-foreground">No trades found</td></tr>
              ) : (
                trades.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => router.push(`/trades/${trade.id}`)}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3",
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                        )}
                        onClick={col.key === "checkbox" ? (e) => e.stopPropagation() : undefined}
                      >
                        {renderCell(col, trade)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <TradePagination
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </div>
      </div>

      <ColumnSelectorModal isOpen={colModalOpen} onClose={() => setColModalOpen(false)} />
    </>
  );
}
