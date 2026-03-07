import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DayData {
  pnl: number;
  trades: number;
  winRate: number;
}

interface WeekData {
  pnl: number;
  tradingDays: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // e.g. "2026-03"

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthParam) {
    const parts = monthParam.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // convert to 0-indexed
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1); // first day of next month

  try {
    // TODO: filter by userId once auth is implemented
    const trades = await prisma.trade.findMany({
      where: {
        exitDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        exitDate: true,
        pnl: true,
      },
      orderBy: { exitDate: "asc" },
    });

    // Group by day
    const days: Record<string, DayData> = {};

    for (const trade of trades) {
      const dateKey = trade.exitDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

      if (!days[dateKey]) {
        days[dateKey] = { pnl: 0, trades: 0, winRate: 0 };
      }

      days[dateKey].pnl += trade.pnl;
      days[dateKey].trades += 1;
    }

    // Calculate win rates per day
    for (const trade of trades) {
      const dateKey = trade.exitDate.toISOString().split("T")[0];
      // We need to count wins per day
    }

    // Recalculate properly: count wins per day
    const dayWins: Record<string, number> = {};
    for (const trade of trades) {
      const dateKey = trade.exitDate.toISOString().split("T")[0];
      if (!dayWins[dateKey]) dayWins[dateKey] = 0;
      if (trade.pnl > 0) dayWins[dateKey] += 1;
    }

    for (const [dateKey, data] of Object.entries(days)) {
      data.winRate =
        data.trades > 0
          ? Math.round(((dayWins[dateKey] || 0) / data.trades) * 100)
          : 0;
      // Round pnl to 2 decimal places
      data.pnl = Math.round(data.pnl * 100) / 100;
    }

    // Calculate weekly summaries
    // Get all days in the month organized by week (Sun-Sat)
    const weeks: WeekData[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // last day of month
    const totalDays = lastDay.getDate();

    // Find the Sunday that starts the first week
    let currentDate = new Date(firstDay);
    // Go back to the previous Sunday if month doesn't start on Sunday
    const firstDayOfWeek = firstDay.getDay(); // 0=Sun

    let weekStart = 1; // day of month
    let weekPnl = 0;
    let weekTradingDays = 0;

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateKey = d.toISOString().split("T")[0];

      if (days[dateKey]) {
        weekPnl += days[dateKey].pnl;
        weekTradingDays += 1;
      }

      // End of week (Saturday) or last day of month
      if (d.getDay() === 6 || day === totalDays) {
        weeks.push({
          pnl: Math.round(weekPnl * 100) / 100,
          tradingDays: weekTradingDays,
        });
        weekPnl = 0;
        weekTradingDays = 0;
      }
    }

    // Monthly totals
    let monthlyPnl = 0;
    const tradingDaysSet = new Set<string>();

    for (const [dateKey, data] of Object.entries(days)) {
      monthlyPnl += data.pnl;
      tradingDaysSet.add(dateKey);
    }

    return NextResponse.json({
      days,
      weeks,
      monthlyPnl: Math.round(monthlyPnl * 100) / 100,
      tradingDays: tradingDaysSet.size,
    });
  } catch (error) {
    console.error("Calendar trades fetch error:", error);
    return NextResponse.json({
      days: {},
      weeks: [],
      monthlyPnl: 0,
      tradingDays: 0,
    });
  }
}
