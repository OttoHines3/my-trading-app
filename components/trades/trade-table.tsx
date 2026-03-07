"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import { TradePagination } from "./trade-pagination";
import type { Trade } from "@/types";

type SortField = "entryDate" | "exitDate" | "symbol" | "pnl" | "entryPrice" | "exitPrice";
type SortDir = "asc" | "desc";

export function TradeTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>("exitDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

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

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterQuery]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const getStatus = (pnl: number) => {
    if (pnl > 0) return { label: "WIN", cls: "bg-positive/10 text-positive" };
    if (pnl < 0) return { label: "LOSS", cls: "bg-destructive/10 text-destructive" };
    return { label: "BE", cls: "bg-muted/10 text-muted-foreground" };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  const formatPrice = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns: { label: string; field?: SortField; className?: string }[] = [
    { label: "Open Date", field: "entryDate" },
    { label: "Symbol", field: "symbol" },
    { label: "Side" },
    { label: "Status" },
    { label: "Close Date", field: "exitDate" },
    { label: "Entry", field: "entryPrice", className: "text-right" },
    { label: "Exit", field: "exitPrice", className: "text-right" },
    { label: "P&L", field: "pnl", className: "text-right" },
    { label: "Strategy" },
    { label: "Commissions", className: "text-right" },
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th key={col.label} className={cn("px-4 py-3 text-left font-medium text-muted-foreground", col.className)}>
                  {col.field ? (
                    <button onClick={() => toggleSort(col.field!)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      {col.label}
                      <SortIcon field={col.field} />
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
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">No trades found</td></tr>
            ) : (
              trades.map((trade) => {
                const status = getStatus(trade.pnl);
                return (
                  <tr key={trade.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-foreground">{formatDate(trade.entryDate)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium", trade.side === "long" ? "text-positive" : "text-destructive")}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", status.cls)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatDate(trade.exitDate)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatPrice(trade.entryPrice)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatPrice(trade.exitPrice)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium", trade.pnl >= 0 ? "text-positive" : "text-destructive")}>
                      {trade.pnl >= 0 ? "+" : ""}${formatPrice(Math.abs(trade.pnl))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{trade.strategy ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {trade.commissions ? `$${trade.commissions.toFixed(2)}` : "-"}
                    </td>
                  </tr>
                );
              })
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
  );
}
