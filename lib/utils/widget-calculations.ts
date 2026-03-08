interface TradeInput {
  pnl: number;
  exitDate: string;
  symbol?: string;
  assetClass?: string;
  entryDate?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function groupByDate(trades: TradeInput[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    const date = t.exitDate.slice(0, 10); // YYYY-MM-DD
    map.set(date, (map.get(date) ?? 0) + t.pnl);
  }
  return map;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Exported functions ─────────────────────────────────────────────────

export function calcExpectancy(trades: TradeInput[]): number {
  if (!trades.length) return 0;
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl < 0);
  const winRate = winners.length / trades.length;
  const lossRate = losers.length / trades.length;
  const avgWin = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;
  return avgWin * winRate - avgLoss * lossRate;
}

export function calcCurrentStreak(trades: TradeInput[]): { type: "win" | "loss"; count: number } {
  if (!trades.length) return { type: "win", count: 0 };
  const sorted = [...trades].sort(
    (a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
  );
  const firstSign = sorted[0].pnl >= 0 ? "win" : "loss";
  let count = 0;
  for (const t of sorted) {
    const sign = t.pnl >= 0 ? "win" : "loss";
    if (sign !== firstSign) break;
    count++;
  }
  return { type: firstSign, count };
}

export function calcMaxDrawdown(trades: TradeInput[]): number {
  if (!trades.length) return 0;
  const sorted = [...trades].sort(
    (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );
  let cumulative = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of sorted) {
    cumulative += t.pnl;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcAvgWinner(trades: TradeInput[]): number {
  const winners = trades.filter((t) => t.pnl > 0);
  if (!winners.length) return 0;
  return winners.reduce((s, t) => s + t.pnl, 0) / winners.length;
}

export function calcAvgLoser(trades: TradeInput[]): number {
  const losers = trades.filter((t) => t.pnl < 0);
  if (!losers.length) return 0;
  return losers.reduce((s, t) => s + t.pnl, 0) / losers.length;
}

export function calcBestDay(trades: TradeInput[]): { date: string; pnl: number } {
  const daily = groupByDate(trades);
  if (!daily.size) return { date: "", pnl: 0 };
  let best = { date: "", pnl: -Infinity };
  for (const [date, pnl] of daily) {
    if (pnl > best.pnl) best = { date, pnl };
  }
  return best;
}

export function calcWorstDay(trades: TradeInput[]): { date: string; pnl: number } {
  const daily = groupByDate(trades);
  if (!daily.size) return { date: "", pnl: 0 };
  let worst = { date: "", pnl: Infinity };
  for (const [date, pnl] of daily) {
    if (pnl < worst.pnl) worst = { date, pnl };
  }
  return worst;
}

export function calcDayWinRate(trades: TradeInput[]): number {
  const daily = groupByDate(trades);
  if (!daily.size) return 0;
  let greenDays = 0;
  for (const pnl of daily.values()) {
    if (pnl > 0) greenDays++;
  }
  return (greenDays / daily.size) * 100;
}

export function calcDayCounts(trades: TradeInput[]): { greenDays: number; breakEvenDays: number; redDays: number } {
  const daily = groupByDate(trades);
  let greenDays = 0;
  let breakEvenDays = 0;
  let redDays = 0;
  for (const pnl of daily.values()) {
    if (pnl > 0) greenDays++;
    else if (pnl === 0) breakEvenDays++;
    else redDays++;
  }
  return { greenDays, breakEvenDays, redDays };
}

export function calcPnlByWeekday(trades: TradeInput[]): { day: string; pnl: number }[] {
  const map = new Map<number, number>();
  for (const t of trades) {
    const dayOfWeek = new Date(t.exitDate).getDay();
    map.set(dayOfWeek, (map.get(dayOfWeek) ?? 0) + t.pnl);
  }
  // Return Mon–Fri (1–5)
  return [1, 2, 3, 4, 5].map((d) => ({
    day: WEEKDAY_NAMES[d],
    pnl: map.get(d) ?? 0,
  }));
}

export function calcPnlByHour(trades: TradeInput[]): { hour: number; pnl: number }[] {
  const map = new Map<number, number>();
  for (const t of trades) {
    const hour = new Date(t.exitDate).getHours();
    map.set(hour, (map.get(hour) ?? 0) + t.pnl);
  }
  const hours = Array.from(map.keys()).sort((a, b) => a - b);
  return hours.map((h) => ({ hour: h, pnl: map.get(h) ?? 0 }));
}

export function calcPnlByAssetClass(trades: TradeInput[]): { assetClass: string; pnl: number }[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const ac = t.assetClass ?? "unknown";
    map.set(ac, (map.get(ac) ?? 0) + t.pnl);
  }
  return Array.from(map.entries()).map(([assetClass, pnl]) => ({ assetClass, pnl }));
}

export function calcPnlBySymbol(
  trades: TradeInput[]
): { symbol: string; pnl: number; trades: number }[] {
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const sym = t.symbol ?? "unknown";
    const existing = map.get(sym) ?? { pnl: 0, trades: 0 };
    existing.pnl += t.pnl;
    existing.trades += 1;
    map.set(sym, existing);
  }
  return Array.from(map.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function calcDailyPnl(trades: TradeInput[]): { date: string; pnl: number }[] {
  const daily = groupByDate(trades);
  return Array.from(daily.entries())
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calcDrawdownSeries(trades: TradeInput[]): { date: string; drawdown: number }[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  );
  // Aggregate by day first
  const daily = new Map<string, number>();
  for (const t of sorted) {
    const date = t.exitDate.slice(0, 10);
    daily.set(date, (daily.get(date) ?? 0) + t.pnl);
  }

  const result: { date: string; drawdown: number }[] = [];
  let cumulative = 0;
  let peak = 0;
  for (const [date, pnl] of Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    cumulative += pnl;
    if (cumulative > peak) peak = cumulative;
    result.push({ date, drawdown: peak - cumulative });
  }
  return result;
}

export function calcPnlDistribution(trades: TradeInput[]): { bucket: string; count: number }[] {
  if (!trades.length) return [];

  const pnls = trades.map((t) => t.pnl);
  const min = Math.min(...pnls);
  const max = Math.max(...pnls);

  if (min === max) return [{ bucket: `${min.toFixed(0)}`, count: trades.length }];

  const bucketCount = 10;
  const range = max - min;
  const bucketSize = range / bucketCount;

  const buckets = new Array<number>(bucketCount).fill(0);

  for (const pnl of pnls) {
    let idx = Math.floor((pnl - min) / bucketSize);
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx]++;
  }

  return buckets.map((count, i) => {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize;
    return {
      bucket: `${lo.toFixed(0)} to ${hi.toFixed(0)}`,
      count,
    };
  });
}
