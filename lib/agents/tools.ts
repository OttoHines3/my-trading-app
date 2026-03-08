import { ToolDefinition } from "@/types/agents";
import { prisma } from "@/lib/prisma";
import type { Trade, JournalEntry, WatchlistItem } from "@prisma/client";
import {
  calcExpectancy,
  calcCurrentStreak,
  calcMaxDrawdown,
  calcAvgWinner,
  calcAvgLoser,
  calcDayWinRate,
  calcPnlBySymbol,
  calcPnlByWeekday,
  calcPnlByHour,
  calcPnlByAssetClass,
  calcDailyPnl,
} from "@/lib/utils/widget-calculations";
import { calcWinRate, calcProfitFactor } from "@/lib/utils/calculations";
import { toolDefinitions as aiToolDefinitions, executeToolCall as executeAiToolCall } from "@/lib/ai-tools";

// ── Tool Definitions (JSON Schema for Claude) ──────────────────────────

export const AGENT_TOOLS: ToolDefinition[] = [
  // New AI tools from ai-tools.ts (cast to match ToolDefinition shape)
  ...(aiToolDefinitions as unknown as ToolDefinition[]),
  // Original agent tools
  {
    name: "get_trades",
    description:
      "Retrieve trades from the database with optional filters. Returns trade data including symbol, P&L, dates, and more.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of trades to return (default: 50)",
        },
        symbol: {
          type: "string",
          description: "Filter by ticker symbol (e.g., 'AAPL', 'TSLA')",
        },
        assetClass: {
          type: "string",
          description: "Filter by asset class",
          enum: ["stocks", "options", "crypto", "forex", "futures"],
        },
        side: {
          type: "string",
          description: "Filter by trade direction",
          enum: ["long", "short"],
        },
        fromDate: {
          type: "string",
          description: "Start date filter (ISO format: YYYY-MM-DD)",
        },
        toDate: {
          type: "string",
          description: "End date filter (ISO format: YYYY-MM-DD)",
        },
        status: {
          type: "string",
          description: "Filter by outcome",
          enum: ["win", "loss", "breakeven"],
        },
      },
    },
  },
  {
    name: "get_trade_by_id",
    description: "Retrieve a specific trade by its ID for detailed analysis.",
    input_schema: {
      type: "object",
      properties: {
        tradeId: {
          type: "string",
          description: "The unique trade ID",
        },
      },
      required: ["tradeId"],
    },
  },
  {
    name: "calculate_performance_metrics",
    description:
      "Calculate comprehensive performance metrics for a set of trades. Use filters to analyze specific subsets.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Optional: Calculate metrics for a specific symbol",
        },
        assetClass: {
          type: "string",
          description: "Optional: Calculate metrics for a specific asset class",
          enum: ["stocks", "options", "crypto", "forex", "futures"],
        },
        fromDate: {
          type: "string",
          description: "Start date (ISO format)",
        },
        toDate: {
          type: "string",
          description: "End date (ISO format)",
        },
        period: {
          type: "string",
          description: "Predefined period",
          enum: ["today", "this_week", "this_month", "last_30_days", "last_90_days", "ytd", "all_time"],
        },
      },
    },
  },
  {
    name: "analyze_patterns",
    description:
      "Analyze trading patterns across time, symbols, and asset classes. Identifies strengths and weaknesses.",
    input_schema: {
      type: "object",
      properties: {
        analysisType: {
          type: "string",
          description: "Type of pattern analysis to perform",
          enum: ["by_weekday", "by_hour", "by_symbol", "by_asset_class", "daily_pnl"],
        },
        fromDate: {
          type: "string",
          description: "Start date filter (ISO format)",
        },
        toDate: {
          type: "string",
          description: "End date filter (ISO format)",
        },
      },
      required: ["analysisType"],
    },
  },
  {
    name: "get_risk_metrics",
    description:
      "Calculate risk-related metrics including drawdown, streak analysis, and position sizing recommendations.",
    input_schema: {
      type: "object",
      properties: {
        fromDate: {
          type: "string",
          description: "Start date filter (ISO format)",
        },
        toDate: {
          type: "string",
          description: "End date filter (ISO format)",
        },
      },
    },
  },
  {
    name: "get_journal_entries",
    description:
      "Retrieve psychology journal entries to understand trader mindset and correlate with performance.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum entries to return (default: 20)",
        },
        fromDate: {
          type: "string",
          description: "Start date filter",
        },
        toDate: {
          type: "string",
          description: "End date filter",
        },
        minMood: {
          type: "number",
          description: "Minimum mood score (1-5)",
        },
        maxMood: {
          type: "number",
          description: "Maximum mood score (1-5)",
        },
      },
    },
  },
  {
    name: "get_watchlist",
    description: "Retrieve the user's watchlist items with notes and price alerts.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Filter by specific symbol",
        },
      },
    },
  },
  {
    name: "compare_periods",
    description:
      "Compare performance between two time periods to identify improvement or regression.",
    input_schema: {
      type: "object",
      properties: {
        period1Start: {
          type: "string",
          description: "First period start date (ISO format)",
        },
        period1End: {
          type: "string",
          description: "First period end date (ISO format)",
        },
        period2Start: {
          type: "string",
          description: "Second period start date (ISO format)",
        },
        period2End: {
          type: "string",
          description: "Second period end date (ISO format)",
        },
      },
      required: ["period1Start", "period1End", "period2Start", "period2End"],
    },
  },
];

// ── Tool Execution Functions ───────────────────────────────────────────

type ToolInput = Record<string, unknown>;

function getDateRange(period?: string): { from?: Date; to?: Date } {
  if (!period) return {};

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { from: today, to: now };
    case "this_week": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { from: startOfWeek, to: now };
    }
    case "this_month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfMonth, to: now };
    }
    case "last_30_days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return { from: thirtyDaysAgo, to: now };
    }
    case "last_90_days": {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);
      return { from: ninetyDaysAgo, to: now };
    }
    case "ytd": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: startOfYear, to: now };
    }
    case "all_time":
    default:
      return {};
  }
}

export async function executeTool(
  toolName: string,
  input: ToolInput
): Promise<unknown> {
  switch (toolName) {
    case "get_trades":
      return executeGetTrades(input);
    case "get_trade_by_id":
      return executeGetTradeById(input);
    case "calculate_performance_metrics":
      return executeCalculatePerformanceMetrics(input);
    case "analyze_patterns":
      return executeAnalyzePatterns(input);
    case "get_risk_metrics":
      return executeGetRiskMetrics(input);
    case "get_journal_entries":
      return executeGetJournalEntries(input);
    case "get_watchlist":
      return executeGetWatchlist(input);
    case "compare_periods":
      return executeComparePeriods(input);
    default:
      // Try new AI tools (these need userId, use "default" for now)
      return executeAiToolCall(toolName, input, "default");
  }
}

async function executeGetTrades(input: ToolInput) {
  const limit = (input.limit as number) || 50;
  const where: Record<string, unknown> = {};

  if (input.symbol) where.symbol = input.symbol;
  if (input.assetClass) where.assetClass = input.assetClass;
  if (input.side) where.side = input.side;

  if (input.fromDate || input.toDate) {
    where.exitDate = {};
    if (input.fromDate) (where.exitDate as Record<string, Date>).gte = new Date(input.fromDate as string);
    if (input.toDate) (where.exitDate as Record<string, Date>).lte = new Date(input.toDate as string);
  }

  if (input.status === "win") where.pnl = { gt: 0 };
  else if (input.status === "loss") where.pnl = { lt: 0 };
  else if (input.status === "breakeven") where.pnl = 0;

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { exitDate: "desc" },
    take: limit,
  });

  return {
    count: trades.length,
    trades: trades.map((t: Trade) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      assetClass: t.assetClass,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      quantity: t.quantity,
      pnl: t.pnl,
      entryDate: t.entryDate.toISOString(),
      exitDate: t.exitDate.toISOString(),
      notes: t.notes,
      tags: t.tags,
    })),
  };
}

async function executeGetTradeById(input: ToolInput) {
  const tradeId = input.tradeId as string;
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    return { error: "Trade not found", tradeId };
  }

  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    assetClass: trade.assetClass,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    quantity: trade.quantity,
    pnl: trade.pnl,
    entryDate: trade.entryDate.toISOString(),
    exitDate: trade.exitDate.toISOString(),
    notes: trade.notes,
    tags: trade.tags,
    screenshotUrl: trade.screenshotUrl,
  };
}

async function executeCalculatePerformanceMetrics(input: ToolInput) {
  const where: Record<string, unknown> = {};

  if (input.symbol) where.symbol = input.symbol;
  if (input.assetClass) where.assetClass = input.assetClass;

  // Handle period or explicit dates
  if (input.period) {
    const { from, to } = getDateRange(input.period as string);
    if (from || to) {
      where.exitDate = {};
      if (from) (where.exitDate as Record<string, Date>).gte = from;
      if (to) (where.exitDate as Record<string, Date>).lte = to;
    }
  } else if (input.fromDate || input.toDate) {
    where.exitDate = {};
    if (input.fromDate) (where.exitDate as Record<string, Date>).gte = new Date(input.fromDate as string);
    if (input.toDate) (where.exitDate as Record<string, Date>).lte = new Date(input.toDate as string);
  }

  const trades = await prisma.trade.findMany({ where });

  if (!trades.length) {
    return { error: "No trades found for the specified filters" };
  }

  const tradeData = trades.map((t: Trade) => ({
    pnl: t.pnl,
    exitDate: t.exitDate.toISOString(),
    symbol: t.symbol,
    assetClass: t.assetClass,
  }));

  const winners = trades.filter((t: Trade) => t.pnl > 0);
  const losers = trades.filter((t: Trade) => t.pnl < 0);
  const totalPnl = trades.reduce((sum: number, t: Trade) => sum + t.pnl, 0);

  return {
    totalTrades: trades.length,
    totalPnl,
    winRate: calcWinRate(trades),
    profitFactor: calcProfitFactor(trades),
    expectancy: calcExpectancy(tradeData),
    maxDrawdown: calcMaxDrawdown(tradeData),
    currentStreak: calcCurrentStreak(tradeData),
    averageWin: calcAvgWinner(tradeData),
    averageLoss: calcAvgLoser(tradeData),
    dayWinRate: calcDayWinRate(tradeData),
    winners: winners.length,
    losers: losers.length,
    breakeven: trades.length - winners.length - losers.length,
    largestWin: Math.max(...trades.map((t: Trade) => t.pnl), 0),
    largestLoss: Math.min(...trades.map((t: Trade) => t.pnl), 0),
  };
}

async function executeAnalyzePatterns(input: ToolInput) {
  const analysisType = input.analysisType as string;
  const where: Record<string, unknown> = {};

  if (input.fromDate || input.toDate) {
    where.exitDate = {};
    if (input.fromDate) (where.exitDate as Record<string, Date>).gte = new Date(input.fromDate as string);
    if (input.toDate) (where.exitDate as Record<string, Date>).lte = new Date(input.toDate as string);
  }

  const trades = await prisma.trade.findMany({ where });

  if (!trades.length) {
    return { error: "No trades found for pattern analysis" };
  }

  const tradeData = trades.map((t: Trade) => ({
    pnl: t.pnl,
    exitDate: t.exitDate.toISOString(),
    symbol: t.symbol,
    assetClass: t.assetClass,
  }));

  switch (analysisType) {
    case "by_weekday":
      return {
        analysisType: "Performance by Day of Week",
        data: calcPnlByWeekday(tradeData),
        insight: "Shows which days are most/least profitable",
      };
    case "by_hour":
      return {
        analysisType: "Performance by Hour of Day",
        data: calcPnlByHour(tradeData),
        insight: "Shows which trading hours are most/least profitable",
      };
    case "by_symbol":
      return {
        analysisType: "Performance by Symbol",
        data: calcPnlBySymbol(tradeData),
        insight: "Shows which symbols are most/least profitable",
      };
    case "by_asset_class":
      return {
        analysisType: "Performance by Asset Class",
        data: calcPnlByAssetClass(tradeData),
        insight: "Shows which asset classes are most/least profitable",
      };
    case "daily_pnl":
      return {
        analysisType: "Daily P&L Trend",
        data: calcDailyPnl(tradeData),
        insight: "Shows daily profit/loss over time",
      };
    default:
      return { error: `Unknown analysis type: ${analysisType}` };
  }
}

async function executeGetRiskMetrics(input: ToolInput) {
  const where: Record<string, unknown> = {};

  if (input.fromDate || input.toDate) {
    where.exitDate = {};
    if (input.fromDate) (where.exitDate as Record<string, Date>).gte = new Date(input.fromDate as string);
    if (input.toDate) (where.exitDate as Record<string, Date>).lte = new Date(input.toDate as string);
  }

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { exitDate: "asc" },
  });

  if (!trades.length) {
    return { error: "No trades found for risk analysis" };
  }

  const tradeData = trades.map((t: Trade) => ({
    pnl: t.pnl,
    exitDate: t.exitDate.toISOString(),
    symbol: t.symbol,
    assetClass: t.assetClass,
  }));

  const maxDrawdown = calcMaxDrawdown(tradeData);
  const currentStreak = calcCurrentStreak(tradeData);
  const avgWin = calcAvgWinner(tradeData);
  const avgLoss = Math.abs(calcAvgLoser(tradeData));
  const winRate = calcWinRate(trades);

  // Calculate risk/reward ratio
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Calculate consecutive losses (worst streak)
  let maxConsecutiveLosses = 0;
  let currentLosses = 0;
  for (const t of tradeData) {
    if (t.pnl < 0) {
      currentLosses++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    } else {
      currentLosses = 0;
    }
  }

  // Calculate % of account at risk (assuming $10k starting capital for estimation)
  const estimatedCapital = 10000;
  const maxDrawdownPercent = (maxDrawdown / estimatedCapital) * 100;

  return {
    maxDrawdown,
    maxDrawdownPercent: maxDrawdownPercent.toFixed(2) + "%",
    currentStreak,
    maxConsecutiveLosses,
    averageWin: avgWin,
    averageLoss: -avgLoss,
    riskRewardRatio: riskRewardRatio.toFixed(2),
    winRate: winRate.toFixed(2) + "%",
    kellyPercentage:
      winRate > 0 && riskRewardRatio > 0
        ? ((winRate / 100 - (1 - winRate / 100) / riskRewardRatio) * 100).toFixed(2) + "%"
        : "N/A",
    warnings: generateRiskWarnings(maxDrawdownPercent, maxConsecutiveLosses, winRate, riskRewardRatio),
  };
}

function generateRiskWarnings(
  drawdownPct: number,
  maxLossStreak: number,
  winRate: number,
  riskReward: number
): string[] {
  const warnings: string[] = [];

  if (drawdownPct > 20) {
    warnings.push(`High drawdown (${drawdownPct.toFixed(1)}%) - consider reducing position size`);
  }
  if (maxLossStreak >= 5) {
    warnings.push(`Experienced ${maxLossStreak} consecutive losses - review entry criteria`);
  }
  if (winRate < 40) {
    warnings.push(`Low win rate (${winRate.toFixed(1)}%) - focus on trade selection`);
  }
  if (riskReward < 1) {
    warnings.push(`Risk/reward ratio below 1:1 (${riskReward.toFixed(2)}) - consider tighter stops or wider targets`);
  }

  return warnings;
}

async function executeGetJournalEntries(input: ToolInput) {
  const limit = (input.limit as number) || 20;
  const where: Record<string, unknown> = {};

  if (input.fromDate || input.toDate) {
    where.date = {};
    if (input.fromDate) (where.date as Record<string, Date>).gte = new Date(input.fromDate as string);
    if (input.toDate) (where.date as Record<string, Date>).lte = new Date(input.toDate as string);
  }

  if (input.minMood || input.maxMood) {
    where.mood = {};
    if (input.minMood) (where.mood as Record<string, number>).gte = input.minMood as number;
    if (input.maxMood) (where.mood as Record<string, number>).lte = input.maxMood as number;
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
  });

  return {
    count: entries.length,
    entries: entries.map((e: JournalEntry) => ({
      id: e.id,
      date: e.date.toISOString(),
      mood: e.mood,
      notes: e.notes,
      marketBias: e.marketBias,
    })),
  };
}

async function executeGetWatchlist(input: ToolInput) {
  const where: Record<string, unknown> = {};

  if (input.symbol) where.symbol = input.symbol;

  const items = await prisma.watchlistItem.findMany({ where });

  return {
    count: items.length,
    items: items.map((item: WatchlistItem) => ({
      id: item.id,
      symbol: item.symbol,
      notes: item.notes,
      alertPrice: item.alertPrice,
    })),
  };
}

async function executeComparePeriods(input: ToolInput) {
  const period1Start = new Date(input.period1Start as string);
  const period1End = new Date(input.period1End as string);
  const period2Start = new Date(input.period2Start as string);
  const period2End = new Date(input.period2End as string);

  const [period1Trades, period2Trades] = await Promise.all([
    prisma.trade.findMany({
      where: { exitDate: { gte: period1Start, lte: period1End } },
    }),
    prisma.trade.findMany({
      where: { exitDate: { gte: period2Start, lte: period2End } },
    }),
  ]);

  const calcPeriodMetrics = (trades: Trade[]) => {
    if (!trades.length) return null;
    const tradeData = trades.map((t: Trade) => ({
      pnl: t.pnl,
      exitDate: t.exitDate.toISOString(),
    }));
    return {
      totalTrades: trades.length,
      totalPnl: trades.reduce((sum: number, t: Trade) => sum + t.pnl, 0),
      winRate: calcWinRate(trades),
      profitFactor: calcProfitFactor(trades),
      expectancy: calcExpectancy(tradeData),
      maxDrawdown: calcMaxDrawdown(tradeData),
      avgWin: calcAvgWinner(tradeData),
      avgLoss: calcAvgLoser(tradeData),
    };
  };

  const period1Metrics = calcPeriodMetrics(period1Trades);
  const period2Metrics = calcPeriodMetrics(period2Trades);

  return {
    period1: {
      range: `${period1Start.toISOString().slice(0, 10)} to ${period1End.toISOString().slice(0, 10)}`,
      metrics: period1Metrics,
    },
    period2: {
      range: `${period2Start.toISOString().slice(0, 10)} to ${period2End.toISOString().slice(0, 10)}`,
      metrics: period2Metrics,
    },
    comparison:
      period1Metrics && period2Metrics
        ? {
            pnlChange: period2Metrics.totalPnl - period1Metrics.totalPnl,
            winRateChange: period2Metrics.winRate - period1Metrics.winRate,
            tradesChange: period2Metrics.totalTrades - period1Metrics.totalTrades,
          }
        : null,
  };
}
