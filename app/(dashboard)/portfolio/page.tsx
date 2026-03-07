"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2,
  Link2Off,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioSummary, TSPosition } from "@/types/tradestation";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function PnLText({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn(value >= 0 ? "text-positive" : "text-destructive", className)}>
      {value >= 0 ? "+" : ""}
      {formatCurrency(value)}
    </span>
  );
}

function PositionRow({ position }: { position: TSPosition }) {
  const isLong = position.LongShort === "Long";
  const pnlPct = position.UnrealizedProfitLossPercent;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{position.Symbol}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
              isLong
                ? "bg-positive/10 text-positive"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {position.LongShort}
          </span>
        </div>
        {position.Description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
            {position.Description}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">
        {position.Quantity}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">
        {formatCurrency(position.AveragePrice)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">
        {formatCurrency(position.Last)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">
        {formatCurrency(position.MarketValue)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {position.UnrealizedProfitLoss >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-positive" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
          )}
          <PnLText value={position.UnrealizedProfitLoss} className="font-mono text-sm" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 text-right">
          {formatPercent(pnlPct)}
        </p>
      </td>
    </tr>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL for OAuth error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
      window.history.replaceState({}, "", "/portfolio");
    }
  }, []);

  const fetchPortfolio = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/tradestation/portfolio");
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Auto-refresh every 60 seconds when connected
  useEffect(() => {
    if (!data?.connected) return;
    const interval = setInterval(() => fetchPortfolio(true), 60_000);
    return () => clearInterval(interval);
  }, [data?.connected, fetchPortfolio]);

  const handleDisconnect = async () => {
    await fetch("/api/tradestation/disconnect", { method: "POST" });
    setData(null);
    fetchPortfolio();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not connected — show connect prompt
  if (!data?.connected) {
    return (
      <div className="flex flex-col gap-4 p-4 min-h-full">
        <h1 className="text-xl font-semibold text-foreground">Portfolio</h1>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-white/5 bg-card p-12 mt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Connect Your TradeStation Account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Link your TradeStation brokerage account to view live positions,
              balances, and P&L directly in your dashboard.
            </p>
          </div>
          <a
            href="/api/tradestation/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Connect TradeStation
          </a>
          <p className="text-xs text-muted-foreground">
            Uses OAuth2 — your credentials are never stored in this app.
          </p>
        </div>
      </div>
    );
  }

  // Connected — show portfolio data
  const { accounts, balances, positions, totalEquity, totalPnL, totalUnrealizedPnL } = data;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Portfolio</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-positive">
            <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
            Connected
          </span>
          <button
            onClick={() => fetchPortfolio(true)}
            disabled={refreshing}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
          <button
            onClick={handleDisconnect}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Link2Off className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Account summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Total Equity
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatCurrency(totalEquity)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {totalPnL >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-positive" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            Today&apos;s P&L
          </div>
          <p className="mt-2 text-2xl font-bold">
            <PnLText value={totalPnL} />
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {totalUnrealizedPnL >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-positive" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            Unrealized P&L
          </div>
          <p className="mt-2 text-2xl font-bold">
            <PnLText value={totalUnrealizedPnL} />
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            Open Positions
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {positions.length}
          </p>
        </div>
      </div>

      {/* Per-account balances */}
      {balances.length > 1 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((b) => (
            <div
              key={b.AccountID}
              className="rounded-xl border border-white/5 bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {b.AccountID}
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                  {b.AccountType}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equity</span>
                  <span className="font-mono">{formatCurrency(b.Equity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-mono">{formatCurrency(b.CashBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buying Power</span>
                  <span className="font-mono">{formatCurrency(b.BuyingPower)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today&apos;s P&L</span>
                  <PnLText value={b.TodaysProfitLoss} className="font-mono" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Positions table */}
      <div className="rounded-xl border border-white/5 bg-card">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Open Positions ({positions.length})
          </h2>
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Briefcase className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No open positions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Symbol</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-right font-medium">Avg Cost</th>
                  <th className="px-4 py-2.5 text-right font-medium">Last</th>
                  <th className="px-4 py-2.5 text-right font-medium">Mkt Value</th>
                  <th className="px-4 py-2.5 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <PositionRow key={`${p.AccountID}-${p.Symbol}`} position={p} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                    {formatCurrency(positions.reduce((s, p) => s + p.MarketValue, 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PnLText
                      value={totalUnrealizedPnL}
                      className="font-mono text-sm font-semibold"
                    />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
