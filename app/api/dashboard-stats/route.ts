import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { parseFiltersToWhere } from "@/lib/utils/parse-filters";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const where = parseFiltersToWhere(searchParams);

    const now = new Date();
    const todayStart = startOfDay(now);

    // TODO: filter by userId once auth is implemented
    const [allTrades, todayTrades] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { exitDate: "asc" },
      }),
      prisma.trade.findMany({
        where: { ...where, exitDate: { gte: todayStart } },
      }),
    ]);

    const totalPnl = allTrades.reduce((sum, t) => sum + t.pnl, 0);
    const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = allTrades.filter((t) => t.pnl > 0).length;
    const losses = allTrades.filter((t) => t.pnl <= 0).length;
    const winRate = allTrades.length > 0
      ? Math.round((wins / allTrades.length) * 100)
      : 0;

    // Build P&L sparkline from filtered trades (already sorted by exitDate)
    const historyTrades = allTrades;

    const pnlByDay: Record<string, number> = {};
    let cumulative = 0;
    historyTrades.forEach((t) => {
      const day = t.exitDate.toISOString().split("T")[0];
      cumulative += t.pnl;
      pnlByDay[day] = cumulative;
    });
    const pnlHistory = Object.values(pnlByDay).map((v) => ({ v }));

    return NextResponse.json({
      totalPnl,
      todayPnl,
      todayPnlPct: 0, // needs account balance to compute
      totalTrades: allTrades.length,
      winRate,
      wins,
      losses,
      tradesToday: todayTrades.length,
      tradeWinsToday: todayTrades.filter((t) => t.pnl > 0).length,
      tradeLossesToday: todayTrades.filter((t) => t.pnl <= 0).length,
      pnlHistory: pnlHistory.length >= 2 ? pnlHistory : null,
      hasMockData: false,
    });
  } catch (error) {
    // Return mock data when DB is unavailable
    console.error("Dashboard stats error:", error);
    return NextResponse.json({
      totalPnl: 8450,
      todayPnl: 1240,
      todayPnlPct: 4.8,
      totalTrades: 64,
      winRate: 67,
      wins: 43,
      losses: 21,
      tradesToday: 4,
      tradeWinsToday: 3,
      tradeLossesToday: 1,
      pnlHistory: null,
      hasMockData: true,
    });
  }
}
