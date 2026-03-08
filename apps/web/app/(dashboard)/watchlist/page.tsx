"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Bell,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Quote {
  price: string;
  change: string;
  pct: string;
  up: boolean;
  raw?: { c: number; d: number; dp: number };
}

interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
  createdAt: string;
  quote: Quote | null;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [alertPrice, setAlertPrice] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      setItems(data.items ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchItems();
    intervalRef.current = setInterval(fetchItems, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          notes: notes.trim() || undefined,
          alertPrice: alertPrice ? parseFloat(alertPrice) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add symbol");
        return;
      }

      setSymbol("");
      setNotes("");
      setAlertPrice("");
      await fetchItems();
    } catch {
      setError("Failed to add symbol");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Failed to remove item");
    }
  };

  const isAlertTriggered = (item: WatchlistItem) => {
    if (!item.alertPrice || !item.quote?.raw?.c) return false;
    return item.quote.raw.c >= item.alertPrice;
  };

  return (
    <div className="flex flex-col gap-6 p-4 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track symbols with live prices and price alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchItems}
            className="rounded-lg border border-white/10 bg-secondary/50 p-2 text-muted-foreground transition-colors hover:text-foreground"
            title="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add Symbol Form */}
      <div className="rounded-xl border border-white/5 bg-card p-5 card-glow">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Add Symbol
        </h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="symbol"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Symbol *
            </label>
            <input
              id="symbol"
              type="text"
              placeholder="AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="h-9 w-32 rounded-lg border border-white/10 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Notes
            </label>
            <input
              id="notes"
              type="text"
              placeholder="Watching for breakout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 w-56 rounded-lg border border-white/10 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="alertPrice"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Alert Price
            </label>
            <input
              id="alertPrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="h-9 w-32 rounded-lg border border-white/10 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !symbol.trim()}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Watchlist Table */}
      <div className="rounded-xl border border-white/5 bg-card card-glow">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Watching {items.length} Symbol{items.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Eye className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Your watchlist is empty
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add a symbol above to start tracking live prices
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Symbol
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Price
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Change
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    % Change
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Notes
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Alert
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const triggered = isAlertTriggered(item);
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-white/5 transition-colors hover:bg-white/[0.02]",
                        triggered && "bg-destructive/5"
                      )}
                    >
                      {/* Symbol */}
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-foreground">
                          {item.symbol}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {item.quote ? `$${item.quote.price}` : "--"}
                        </span>
                      </td>

                      {/* Change */}
                      <td className="px-5 py-3 text-right">
                        {item.quote ? (
                          <span
                            className={cn(
                              "text-sm tabular-nums font-medium",
                              item.quote.up
                                ? "text-positive"
                                : "text-destructive"
                            )}
                          >
                            {item.quote.change}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            --
                          </span>
                        )}
                      </td>

                      {/* % Change */}
                      <td className="px-5 py-3 text-right">
                        {item.quote ? (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
                              item.quote.up
                                ? "bg-positive/10 text-positive"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {item.quote.pct}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            --
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="max-w-[200px] truncate px-5 py-3">
                        <span className="text-sm text-muted-foreground">
                          {item.notes || "--"}
                        </span>
                      </td>

                      {/* Alert */}
                      <td className="px-5 py-3 text-right">
                        {item.alertPrice ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-sm tabular-nums font-medium",
                              triggered
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            {triggered && (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            {!triggered && (
                              <Bell className="h-3.5 w-3.5" />
                            )}
                            ${item.alertPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            --
                          </span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
