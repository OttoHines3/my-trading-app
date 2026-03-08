interface TradeData {
  pnl: number;
  entryDate: string;
  exitDate: string;
  symbol: string;
  assetClass: string;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
}

export function calcAvgHoldTime(trades: TradeData[]): number {
  if (!trades.length) return 0;
  const totalMs = trades.reduce((sum, t) => {
    return sum + (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime());
  }, 0);
  return totalMs / trades.length / (1000 * 60 * 60); // hours
}

export function calcLoggedDays(trades: TradeData[]): number {
  const days = new Set(trades.map((t) => t.exitDate.split("T")[0]));
  return days.size;
}

export function calcAvgDailyVolume(trades: TradeData[]): number {
  const days = calcLoggedDays(trades);
  return days > 0 ? trades.length / days : 0;
}

export function calcAvgDailyNetPnl(trades: TradeData[]): number {
  const days = calcLoggedDays(trades);
  if (!days) return 0;
  const total = trades.reduce((s, t) => s + t.pnl, 0);
  return total / days;
}

export function calcAvgDailyWinRate(trades: TradeData[]): number {
  const byDay: Record<string, TradeData[]> = {};
  trades.forEach((t) => {
    const day = t.exitDate.split("T")[0];
    (byDay[day] ??= []).push(t);
  });
  const dayRates = Object.values(byDay).map((dayTrades) => {
    const wins = dayTrades.filter((t) => t.pnl > 0).length;
    return wins / dayTrades.length;
  });
  if (!dayRates.length) return 0;
  return (dayRates.reduce((s, r) => s + r, 0) / dayRates.length) * 100;
}

export function calcMaxDailyDrawdown(trades: TradeData[]): number {
  const byDay: Record<string, number> = {};
  trades.forEach((t) => {
    const day = t.exitDate.split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + t.pnl;
  });
  const dailyPnls = Object.values(byDay);
  let peak = 0;
  let cumulative = 0;
  let maxDD = 0;
  for (const pnl of dailyPnls) {
    cumulative += pnl;
    if (cumulative > peak) peak = cumulative;
    const dd = cumulative - peak;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcAvgDailyDrawdown(trades: TradeData[]): number {
  const byDay: Record<string, number[]> = {};
  trades.forEach((t) => {
    const day = t.exitDate.split("T")[0];
    (byDay[day] ??= []).push(t.pnl);
  });
  const dailyDrawdowns = Object.values(byDay).map((pnls) => {
    let peak = 0, cumulative = 0, maxDD = 0;
    for (const p of pnls) {
      cumulative += p;
      if (cumulative > peak) peak = cumulative;
      const dd = cumulative - peak;
      if (dd < maxDD) maxDD = dd;
    }
    return maxDD;
  });
  if (!dailyDrawdowns.length) return 0;
  return dailyDrawdowns.reduce((s, d) => s + d, 0) / dailyDrawdowns.length;
}

export function calcTradeExpectancy(trades: TradeData[]): number {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.pnl, 0) / trades.length;
}

export function calcAvgWinLoss(trades: TradeData[]): { avgWin: number; avgLoss: number } {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  return {
    avgWin: wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0,
    avgLoss: losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0,
  };
}

export function calcMonthlyPnl(trades: TradeData[]): { month: string; pnl: number }[] {
  const byMonth: Record<string, number> = {};
  trades.forEach((t) => {
    const month = t.exitDate.substring(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] ?? 0) + t.pnl;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl }));
}

export function calcCumulativePnl(trades: TradeData[]): { date: string; cumPnl: number }[] {
  const sorted = [...trades].sort((a, b) => a.exitDate.localeCompare(b.exitDate));
  let cum = 0;
  return sorted.map((t) => {
    cum += t.pnl;
    return { date: t.exitDate.split("T")[0], cumPnl: cum };
  });
}
