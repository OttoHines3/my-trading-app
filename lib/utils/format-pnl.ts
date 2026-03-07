import type { DisplayMode } from "@/lib/stores/display-mode";

interface FormatPnlOptions {
  /** The P&L dollar value */
  pnl: number;
  /** Current display mode */
  mode: DisplayMode;
  /** Trade entry price (used for percentage calculation) */
  entryPrice?: number;
  /** Trade exit price (used for percentage calculation) */
  exitPrice?: number;
  /** Trade quantity (used for percentage calculation) */
  quantity?: number;
  /** Asset class — required for ticks/pips/points modes */
  assetClass?: string;
  /** Initial risk in dollars — required for R-multiple mode */
  initialRisk?: number;
  /** Tick size for the instrument (defaults vary by asset) */
  tickSize?: number;
  /** Point value per tick (defaults vary by asset) */
  tickValue?: number;
}

/**
 * Format a P&L value according to the selected display mode.
 *
 * - **dollar**: "$134" / "-$84"
 * - **percentage**: "+2.5%" / "-1.2%" (calculated from entry/exit or pnl / position cost)
 * - **privacy**: hides value behind dots
 * - **r-multiple**: "2.5R" / "-1R" (requires initialRisk)
 * - **ticks**: futures only, calculated from pnl and tick parameters
 * - **pips**: forex only, calculated from entry/exit price difference
 * - **points**: futures only, calculated from entry/exit price difference
 */
export function formatPnl(opts: FormatPnlOptions): string {
  const { pnl, mode } = opts;

  switch (mode) {
    case "dollar":
      return formatDollar(pnl);

    case "percentage":
      return formatPercentage(opts);

    case "privacy":
      return "\u2022\u2022\u2022";

    case "r-multiple":
      return formatRMultiple(opts);

    case "ticks":
      return formatTicks(opts);

    case "pips":
      return formatPips(opts);

    case "points":
      return formatPoints(opts);

    default:
      return formatDollar(pnl);
  }
}

// ---------------------------------------------------------------------------
// Individual formatters
// ---------------------------------------------------------------------------

function formatDollar(pnl: number): string {
  const abs = Math.abs(pnl).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (pnl >= 0) return `$${abs}`;
  return `-$${abs}`;
}

function formatPercentage(opts: FormatPnlOptions): string {
  const { pnl, entryPrice, quantity } = opts;

  // Try to compute percentage from position cost
  if (entryPrice && quantity) {
    const cost = entryPrice * quantity;
    if (cost !== 0) {
      const pct = (pnl / cost) * 100;
      const sign = pct >= 0 ? "+" : "";
      return `${sign}${pct.toFixed(2)}%`;
    }
  }

  // Fallback: if we have entry price, use pnl / entryPrice as rough percentage
  if (entryPrice && entryPrice !== 0) {
    const pct = (pnl / entryPrice) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}%`;
  }

  // Cannot compute percentage — show dash
  return "\u2014";
}

function formatRMultiple(opts: FormatPnlOptions): string {
  const { pnl, initialRisk } = opts;
  if (!initialRisk || initialRisk === 0) return "\u2014";

  const r = pnl / initialRisk;
  const sign = r >= 0 ? "" : "";
  return `${sign}${r.toFixed(1)}R`;
}

function formatTicks(opts: FormatPnlOptions): string {
  const { pnl, assetClass, tickSize, tickValue } = opts;
  if (assetClass !== "futures") return "\u2014";

  // Default tick: $12.50 per tick (e.g., ES mini)
  const tv = tickValue ?? 12.5;
  if (tv === 0) return "\u2014";

  const ticks = pnl / tv;
  return `${ticks >= 0 ? "" : ""}${ticks.toFixed(1)}T`;
}

function formatPips(opts: FormatPnlOptions): string {
  const { assetClass, entryPrice, exitPrice } = opts;
  if (assetClass !== "forex") return "\u2014";

  if (entryPrice != null && exitPrice != null) {
    // Standard pip = 0.0001 for most pairs (0.01 for JPY pairs)
    const pipSize = entryPrice > 10 ? 0.01 : 0.0001;
    const pips = (exitPrice - entryPrice) / pipSize;
    return `${pips >= 0 ? "+" : ""}${pips.toFixed(1)}PP`;
  }

  return "\u2014";
}

function formatPoints(opts: FormatPnlOptions): string {
  const { assetClass, entryPrice, exitPrice } = opts;
  if (assetClass !== "futures") return "\u2014";

  if (entryPrice != null && exitPrice != null) {
    const points = exitPrice - entryPrice;
    return `${points >= 0 ? "+" : ""}${points.toFixed(2)}P`;
  }

  return "\u2014";
}
