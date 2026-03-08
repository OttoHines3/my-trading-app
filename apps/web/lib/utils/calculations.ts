export function calcPnL(entry: number, exit: number, qty: number, side: "long" | "short"): number {
  return side === "long" ? (exit - entry) * qty : (entry - exit) * qty;
}

export function calcWinRate(trades: { pnl: number }[]): number {
  if (!trades.length) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return (wins / trades.length) * 100;
}

export function calcProfitFactor(trades: { pnl: number }[]): number {
  const gains = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const losses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  return losses === 0 ? Infinity : gains / losses;
}
