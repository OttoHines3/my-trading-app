/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Calculate P&L from entry and exit prices
 */
export function calculatePnl(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: "long" | "short"
): number {
  const multiplier = side === "long" ? 1 : -1;
  return (exitPrice - entryPrice) * quantity * multiplier;
}

/**
 * Calculate win rate from trades
 */
export function calculateWinRate(trades: { pnl: number | null }[]): number {
  const closedTrades = trades.filter((t) => t.pnl !== null);
  if (closedTrades.length === 0) return 0;
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  return (wins / closedTrades.length) * 100;
}
