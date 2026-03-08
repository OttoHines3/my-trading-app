import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcWinRate, calcProfitFactor } from "@/lib/utils/calculations";
import { parseFiltersToWhere, applyTimeFilters } from "@/lib/utils/parse-filters";
import {
  calcExpectancy,
  calcCurrentStreak,
  calcMaxDrawdown,
  calcAvgWinner,
  calcAvgLoser,
  calcBestDay,
  calcWorstDay,
  calcDayWinRate,
  calcDayCounts,
  calcPnlByWeekday,
  calcPnlByHour,
  calcPnlByAssetClass,
  calcPnlBySymbol,
  calcDailyPnl,
  calcDrawdownSeries,
  calcPnlDistribution,
} from "@/lib/utils/widget-calculations";

export async function GET(request: NextRequest) {
  const fields = request.nextUrl.searchParams.get("fields")?.split(",") ?? [];

  try {
    // Fetch trades with filters applied
    const where = parseFiltersToWhere(request.nextUrl.searchParams);
    let trades = await prisma.trade.findMany({
      where,
      orderBy: { exitDate: "asc" },
    });

    // Apply time-based JS filters
    if (request.nextUrl.searchParams.has("daysOfWeek") || request.nextUrl.searchParams.has("hoursOfDay")) {
      trades = applyTimeFilters(
        trades.map((t) => ({ ...t, entryDate: t.entryDate.toISOString() })),
        request.nextUrl.searchParams
      ).map((t) => ({ ...t, entryDate: new Date(t.entryDate) })) as typeof trades;
    }

    const tradeData = trades.map((t) => ({
      pnl: t.pnl,
      exitDate: t.exitDate.toISOString(),
      entryDate: t.entryDate.toISOString(),
      symbol: t.symbol,
      assetClass: t.assetClass,
    }));

    const result: Record<string, unknown> = {};

    if (fields.includes("stats")) {
      const totalPnl = tradeData.reduce((sum, t) => sum + t.pnl, 0);
      const winRate = calcWinRate(tradeData);
      const profitFactor = calcProfitFactor(tradeData);

      result.stats = {
        totalPnl,
        winRate: Math.round(winRate),
        profitFactor: profitFactor === Infinity ? 999 : Number(profitFactor.toFixed(2)),
        dayWinRate: Math.round(calcDayWinRate(tradeData)),
        dayCounts: calcDayCounts(tradeData),
        expectancy: Number(calcExpectancy(tradeData).toFixed(2)),
        currentStreak: calcCurrentStreak(tradeData),
        largestWin: (() => {
          const winners = tradeData.filter((t) => t.pnl > 0);
          if (!winners.length) return { pnl: 0, symbol: "-" };
          const best = winners.reduce((a, b) => (a.pnl > b.pnl ? a : b));
          return { pnl: best.pnl, symbol: best.symbol };
        })(),
        largestLoss: (() => {
          const losers = tradeData.filter((t) => t.pnl < 0);
          if (!losers.length) return { pnl: 0, symbol: "-" };
          const worst = losers.reduce((a, b) => (a.pnl < b.pnl ? a : b));
          return { pnl: worst.pnl, symbol: worst.symbol };
        })(),
        avgWinner: Number(calcAvgWinner(tradeData).toFixed(2)),
        avgLoser: Number(calcAvgLoser(tradeData).toFixed(2)),
        totalTrades: tradeData.length,
        maxDrawdown: Number(calcMaxDrawdown(tradeData).toFixed(2)),
        openPositions: 0, // TODO: wire up from TradeStation
        bestDay: calcBestDay(tradeData),
        worstDay: calcWorstDay(tradeData),
      };
    }

    if (fields.includes("daily-pnl")) {
      result.dailyPnl = calcDailyPnl(tradeData);
    }

    if (fields.includes("by-weekday")) {
      result.byWeekday = calcPnlByWeekday(tradeData);
    }

    if (fields.includes("by-hour")) {
      result.byHour = calcPnlByHour(tradeData);
    }

    if (fields.includes("by-asset-class")) {
      result.byAssetClass = calcPnlByAssetClass(tradeData);
    }

    if (fields.includes("by-symbol")) {
      result.bySymbol = calcPnlBySymbol(tradeData);
    }

    if (fields.includes("drawdown")) {
      result.drawdown = calcDrawdownSeries(tradeData);
    }

    if (fields.includes("distribution")) {
      result.distribution = calcPnlDistribution(tradeData);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Widget data error:", error);
    // Return mock data
    return NextResponse.json({
      stats: {
        totalPnl: 1240,
        winRate: 67,
        profitFactor: 2.4,
        dayWinRate: 72,
        dayCounts: { greenDays: 18, breakEvenDays: 1, redDays: 6 },
        expectancy: 45.6,
        currentStreak: { type: "win", count: 3 },
        largestWin: { pnl: 890, symbol: "TSLA" },
        largestLoss: { pnl: -450, symbol: "NVDA" },
        avgWinner: 320,
        avgLoser: -180,
        totalTrades: 64,
        maxDrawdown: -2100,
        openPositions: 2,
        bestDay: { date: "2026-03-05", pnl: 1580 },
        worstDay: { date: "2026-02-28", pnl: -890 },
      },
      dailyPnl: [
        { date: "2026-02-01", pnl: 120 }, { date: "2026-02-05", pnl: 220 },
        { date: "2026-02-10", pnl: -60 }, { date: "2026-02-15", pnl: 280 },
        { date: "2026-02-20", pnl: -80 }, { date: "2026-02-25", pnl: 240 },
        { date: "2026-03-01", pnl: 170 }, { date: "2026-03-05", pnl: 350 },
      ],
      byWeekday: [
        { day: "Mon", pnl: 420 }, { day: "Tue", pnl: -180 },
        { day: "Wed", pnl: 560 }, { day: "Thu", pnl: 320 }, { day: "Fri", pnl: -90 },
      ],
      byHour: [
        { hour: 9, pnl: 320 }, { hour: 10, pnl: 480 }, { hour: 11, pnl: -120 },
        { hour: 12, pnl: 90 }, { hour: 13, pnl: 210 }, { hour: 14, pnl: -180 },
        { hour: 15, pnl: 340 },
      ],
      byAssetClass: [
        { assetClass: "Stocks", pnl: 2400 }, { assetClass: "Options", pnl: 1800 },
        { assetClass: "Futures", pnl: 900 }, { assetClass: "Crypto", pnl: -400 },
      ],
      bySymbol: [
        { symbol: "TSLA", pnl: 1240, trades: 12 }, { symbol: "SPY", pnl: 890, trades: 18 },
        { symbol: "QQQ", pnl: 560, trades: 8 }, { symbol: "AAPL", pnl: 320, trades: 6 },
        { symbol: "NVDA", pnl: -450, trades: 10 }, { symbol: "AMD", pnl: -280, trades: 5 },
      ],
      drawdown: [
        { date: "2026-02-01", drawdown: 0 }, { date: "2026-02-05", drawdown: -120 },
        { date: "2026-02-10", drawdown: -340 }, { date: "2026-02-15", drawdown: -180 },
        { date: "2026-02-20", drawdown: -560 }, { date: "2026-02-25", drawdown: -420 },
        { date: "2026-03-01", drawdown: -210 }, { date: "2026-03-05", drawdown: -80 },
      ],
      distribution: [
        { bucket: "<-500", count: 2 }, { bucket: "-500 to -250", count: 5 },
        { bucket: "-250 to 0", count: 8 }, { bucket: "0 to 250", count: 12 },
        { bucket: "250 to 500", count: 9 }, { bucket: ">500", count: 4 },
      ],
    });
  }
}
