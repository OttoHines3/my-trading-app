"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  Settings,
  Trash2,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingAccounts, type TradingAccount } from "@/lib/stores/trading-accounts";
import type { PortfolioSummary, TSPosition } from "@/types/tradestation";

// ── Helpers ──────────────────────────────────────────────────────────

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

// ── Account Switcher Dropdown ────────────────────────────────────────

function AccountSwitcher() {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const accounts = useTradingAccounts((s) => s.accounts);
  const selectedIds = useTradingAccounts((s) => s.selectedIds);
  const toggleAccount = useTradingAccounts((s) => s.toggleAccount);
  const selectAll = useTradingAccounts((s) => s.selectAll);
  const renameAccount = useTradingAccounts((s) => s.renameAccount);
  const removeAccount = useTradingAccounts((s) => s.removeAccount);

  const allSelected = selectedIds.length === 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setManaging(false);
        setEditingId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (accounts.length === 0) return null;

  const label = allSelected
    ? "All accounts"
    : selectedIds.length === 1
      ? accounts.find((a) => a.id === selectedIds[0])?.name || "Account"
      : `${selectedIds.length} accounts`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground hover:bg-white/5 transition-colors"
      >
        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-white/10 bg-card shadow-xl">
          <div className="p-2">
            {/* All accounts option */}
            <button
              onClick={() => selectAll()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5 transition-colors"
            >
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded border",
                allSelected ? "border-primary bg-primary" : "border-white/20"
              )}>
                {allSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-foreground">All accounts</span>
            </button>

            {/* Divider */}
            <div className="my-1.5 border-t border-white/5" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">My accounts</p>

            {/* Individual accounts */}
            {accounts.map((acct) => {
              const isSelected = allSelected || selectedIds.includes(acct.id);
              return (
                <div key={acct.id} className="flex items-center gap-1">
                  {editingId === acct.id ? (
                    <div className="flex flex-1 items-center gap-1 px-3 py-1.5">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editName.trim()) {
                            renameAccount(acct.id, editName.trim());
                            setEditingId(null);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-primary"
                      />
                      <button
                        onClick={() => {
                          if (editName.trim()) renameAccount(acct.id, editName.trim());
                          setEditingId(null);
                        }}
                        className="p-0.5 text-positive hover:text-positive/80"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleAccount(acct.id)}
                        className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          isSelected ? "border-primary bg-primary" : "border-white/20"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-foreground truncate">{acct.name}</p>
                          <p className="text-[10px] text-muted-foreground">{acct.tradeCount} trades &middot; {acct.broker}</p>
                        </div>
                      </button>
                      {managing && (
                        <div className="flex items-center gap-0.5 pr-2">
                          <button
                            onClick={() => { setEditingId(acct.id); setEditName(acct.name); }}
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeAccount(acct.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 p-2">
            <button
              onClick={() => setManaging(!managing)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              {managing ? "Done managing" : "Manage accounts"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Name Account Modal ───────────────────────────────────────────────

function NameAccountModal({
  onSave,
  onCancel,
  defaultName,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Name Your Account</h2>
          <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Give this account a name so you can identify it later (e.g. &ldquo;TradeStation VY75&rdquo; or &ldquo;Paper Trading&rdquo;).
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); }}
          placeholder="e.g. TradeStation Main"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
        />
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onSave(name.trim() || defaultName)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Position Row ─────────────────────────────────────────────────────

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
      <td className="px-4 py-3 text-right font-mono text-sm">{position.Quantity}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(position.AveragePrice)}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(position.Last)}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(position.MarketValue)}</td>
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

// ── CSV Upload Section ───────────────────────────────────────────────

function CSVUploadSection({ onImportSuccess }: { onImportSuccess: (count: number) => void }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ message: string; errors?: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // We'll create the account first so we have the ID, then name it after
  const addAccount = useTradingAccounts((s) => s.addAccount);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadError("Please upload a CSV file");
      return;
    }
    setUploading(true);
    setResult(null);
    setUploadError(null);

    // Create account with temporary name, will be renamed in modal
    const accountId = addAccount({
      name: `Import ${new Date().toLocaleDateString()}`,
      broker: "csv",
      tradeCount: 0,
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", accountId);

    try {
      const res = await fetch("/api/trades/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Import failed");
        // Remove the account we just created since import failed
        useTradingAccounts.getState().removeAccount(accountId);
      } else {
        setResult({ message: json.message, errors: json.errors });
        // Update trade count
        useTradingAccounts.getState().updateTradeCount(accountId, json.imported || 0);
        onImportSuccess(json.imported || 0);
      }
    } catch {
      setUploadError("Failed to upload file");
      useTradingAccounts.getState().removeAccount(accountId);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-white/5 bg-card p-8">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Import Trades from CSV</h2>
      </div>

      <label
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Importing trades..." : "Drop CSV file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
        </div>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileSelect}
          disabled={uploading}
        />
      </label>

      {result && (
        <div className="mt-4 rounded-lg border border-positive/30 bg-positive/10 p-4">
          <div className="flex items-center gap-2 text-sm text-positive font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {result.message}
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i}>{e}</p>
              ))}
              {result.errors.length > 5 && (
                <p>...and {result.errors.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {uploadError}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/70 mb-1">Supported formats:</p>
        <p>TradeStation Historical Activity Report (auto-detected), or any CSV with Symbol, Side, Entry/Exit Price, Quantity, Dates, P&L columns.</p>
      </div>
    </div>
  );
}

// ── Imported Accounts Summary ────────────────────────────────────────

function ImportedAccountsList() {
  const accounts = useTradingAccounts((s) => s.accounts);

  if (accounts.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-card">
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Imported Accounts ({accounts.length})
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {accounts.map((acct) => (
          <div key={acct.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{acct.name}</p>
              <p className="text-xs text-muted-foreground">
                {acct.tradeCount} trade{acct.tradeCount !== 1 ? "s" : ""} &middot; {acct.broker} &middot; Added {new Date(acct.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
              {acct.broker}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNamingModal, setShowNamingModal] = useState(false);

  const accounts = useTradingAccounts((s) => s.accounts);
  const renameAccount = useTradingAccounts((s) => s.renameAccount);

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

  const handleImportSuccess = (count: number) => {
    // Show naming modal after successful import
    setShowNamingModal(true);
  };

  const handleNameSave = (name: string) => {
    // Rename the most recently added account
    const latestAccount = accounts[accounts.length - 1];
    if (latestAccount) {
      renameAccount(latestAccount.id, name);
    }
    setShowNamingModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not connected — show connect prompt + CSV upload + imported accounts
  if (!data?.connected) {
    const latestAccount = accounts[accounts.length - 1];

    return (
      <div className="flex flex-col gap-4 p-4 min-h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Portfolio</h1>
          <AccountSwitcher />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          {/* TradeStation connect */}
          <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-white/5 bg-card p-12">
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

          {/* CSV Upload */}
          <CSVUploadSection onImportSuccess={handleImportSuccess} />
        </div>

        {/* Imported accounts list */}
        <ImportedAccountsList />

        {/* Naming modal */}
        {showNamingModal && latestAccount && (
          <NameAccountModal
            defaultName={latestAccount.name}
            onSave={handleNameSave}
            onCancel={() => setShowNamingModal(false)}
          />
        )}
      </div>
    );
  }

  // Connected — show portfolio data
  const { accounts: tsAccounts, balances, positions, totalEquity, totalPnL, totalUnrealizedPnL } = data;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Portfolio</h1>
        <div className="flex items-center gap-2">
          <AccountSwitcher />
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
            {tsAccounts.length} account{tsAccounts.length !== 1 ? "s" : ""}
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
