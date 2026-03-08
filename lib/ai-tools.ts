import { prisma } from "@/lib/prisma";
import { finnhub } from "@/lib/finnhub";

// ── Tool Definitions (Anthropic tool format) ─────────────────────────

export const toolDefinitions = [
  {
    name: "get_trades_by_filter",
    description:
      "Query trades with dynamic filters including date range, outcome status, symbol, side, pattern/tag matching, time-of-day window, and day-of-week. Supports multiple sort orders.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
        status: {
          type: "string",
          description: "Filter by trade outcome",
          enum: ["win", "loss", "breakeven", "all"],
        },
        symbol: {
          type: "string",
          description: "Filter by ticker symbol (e.g. AAPL)",
        },
        side: {
          type: "string",
          description: "Filter by trade direction",
          enum: ["long", "short", "all"],
        },
        pattern: {
          type: "string",
          description:
            "Filter by pattern/strategy tag (matches against the tags array on each trade)",
        },
        timeOfDayStart: {
          type: "string",
          description: "Filter trades entered at or after this time (HH:MM, 24h format)",
        },
        timeOfDayEnd: {
          type: "string",
          description: "Filter trades entered before this time (HH:MM, 24h format)",
        },
        dayOfWeek: {
          type: "string",
          description: "Filter by day of week the trade was entered",
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "all"],
        },
        limit: {
          type: "number",
          description: "Maximum number of trades to return (default: 50)",
        },
        orderBy: {
          type: "string",
          description: "Sort order for results",
          enum: ["date_desc", "date_asc", "pnl_desc", "pnl_asc"],
        },
      },
    },
  },
  {
    name: "calculate_metrics",
    description:
      "Calculate performance metrics (win rate, profit factor, avg win/loss, total P&L, max drawdown, best/worst day) with optional filters and groupBy. When groupBy is set, returns metrics broken down by that dimension.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
        symbol: {
          type: "string",
          description: "Filter by ticker symbol",
        },
        side: {
          type: "string",
          description: "Filter by trade direction",
          enum: ["long", "short", "all"],
        },
        groupBy: {
          type: "string",
          description: "Group results by dimension",
          enum: ["none", "day", "week", "month", "dayOfWeek", "hour", "pattern", "symbol"],
        },
      },
    },
  },
  {
    name: "get_pattern_performance",
    description:
      "Get win rate, average P&L, and trade count broken down by pattern (from the tags field on trades). Can filter to a specific pattern or return all patterns.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description:
            "Specific pattern/tag to analyze, or 'all' to get breakdown of every pattern (default: 'all')",
        },
        startDate: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "get_vix_correlation",
    description:
      "Analyze the correlation between VIX levels and trade outcomes. Uses vixBuckets to define VIX ranges for analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        vixBuckets: {
          type: "array",
          description: "Array of VIX range buckets to analyze",
          items: {
            type: "object",
            properties: {
              min: { type: "number", description: "Minimum VIX level for this bucket" },
              max: { type: "number", description: "Maximum VIX level for this bucket" },
              label: { type: "string", description: "Label for this bucket (e.g. 'Low Vol')" },
            },
            required: ["min", "max", "label"],
          },
        },
      },
    },
  },
  {
    name: "get_time_of_day_analysis",
    description:
      "Break down trading performance by hour/time-of-day. Returns win rate, avg P&L, and trade count for each time bucket.",
    input_schema: {
      type: "object" as const,
      properties: {
        bucketMinutes: {
          type: "number",
          description: "Size of each time bucket in minutes (default: 60)",
        },
        startDate: {
          type: "string",
          description: "Start date filter (YYYY-MM-DD)",
        },
        endDate: {
          type: "string",
          description: "End date filter (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "get_live_market_data",
    description:
      "Fetch current market data (price, change, high, low, open, previous close) for one or more symbols using Finnhub.",
    input_schema: {
      type: "object" as const,
      properties: {
        symbols: {
          type: "array",
          description: "Array of ticker symbols to fetch quotes for",
          items: { type: "string" },
        },
      },
      required: ["symbols"],
    },
  },
  {
    name: "get_day_detail",
    description:
      "Get all trades and aggregated stats for a specific calendar date.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "The date to get detail for (YYYY-MM-DD)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "get_recent_performance_trend",
    description:
      "Get performance trend over a recent period and compare it against a baseline (previous equivalent period or all-time average).",
    input_schema: {
      type: "object" as const,
      properties: {
        period: {
          type: "string",
          description: "The recent period to analyze",
          enum: ["7days", "14days", "30days", "90days"],
        },
        compareTo: {
          type: "string",
          description: "Baseline for comparison",
          enum: ["previous_period", "all_time_avg"],
        },
      },
      required: ["period"],
    },
  },
  {
    name: "flag_trade_for_review",
    description:
      "Flag a specific trade for manual review by setting flaggedForReview to true and recording a reason.",
    input_schema: {
      type: "object" as const,
      properties: {
        tradeId: {
          type: "string",
          description: "The ID of the trade to flag",
        },
        reason: {
          type: "string",
          description: "The reason for flagging this trade for review",
        },
      },
      required: ["tradeId", "reason"],
    },
  },
  {
    name: "save_insight",
    description:
      "Save a trading insight to the database so the user can reference it later.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Short title for the insight",
        },
        content: {
          type: "string",
          description: "Full insight text/analysis",
        },
        category: {
          type: "string",
          description: "Category of insight (e.g. 'pattern', 'risk', 'psychology', 'performance', 'strategy')",
        },
        relatedTrades: {
          type: "array",
          description: "Array of trade IDs related to this insight",
          items: { type: "string" },
        },
        agentType: {
          type: "string",
          description: "Which agent generated this insight (e.g. 'coach', 'analyst')",
        },
      },
      required: ["title", "content", "category", "agentType"],
    },
  },
];

// ── Helper utilities ─────────────────────────────────────────────────

interface TradeRow {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  assetClass: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate: Date;
  pnl: number;
  notes: string | null;
  tags: string[];
  screenshotUrl: string | null;
  flaggedForReview: boolean;
  flagReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  autoNote: string | null;
  autoNoteAt: Date | null;
  externalId: string | null;
}

function computeMetrics(trades: TradeRow[]) {
  if (!trades.length) {
    return {
      totalTrades: 0,
      totalPnl: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      maxDrawdown: 0,
      bestDay: null,
      worstDay: null,
    };
  }

  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = (winners.length / trades.length) * 100;

  const grossWins = winners.reduce((s, t) => s + t.pnl, 0);
  const grossLosses = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  const avgWin = winners.length > 0 ? grossWins / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;

  // Max drawdown: peak-to-trough on cumulative P&L (trades sorted by exitDate)
  const sorted = [...trades].sort(
    (a, b) => a.exitDate.getTime() - b.exitDate.getTime()
  );
  let cumPnl = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumPnl += t.pnl;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Best / worst day by aggregating trades per calendar date
  const dailyPnl = new Map<string, number>();
  for (const t of trades) {
    const dateKey = t.exitDate.toISOString().slice(0, 10);
    dailyPnl.set(dateKey, (dailyPnl.get(dateKey) ?? 0) + t.pnl);
  }
  let bestDay: { date: string; pnl: number } | null = null;
  let worstDay: { date: string; pnl: number } | null = null;
  for (const [date, pnl] of dailyPnl) {
    if (!bestDay || pnl > bestDay.pnl) bestDay = { date, pnl };
    if (!worstDay || pnl < worstDay.pnl) worstDay = { date, pnl };
  }

  return {
    totalTrades: trades.length,
    totalPnl: Math.round(totalPnl * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    profitFactor: profitFactor === Infinity ? "Infinity" : Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    bestDay,
    worstDay,
  };
}

function parsePeriodDays(period: string): number {
  switch (period) {
    case "7days": return 7;
    case "14days": return 14;
    case "30days": return 30;
    case "90days": return 90;
    default: return 30;
  }
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Tool Executor ────────────────────────────────────────────────────

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "get_trades_by_filter":
      return execGetTradesByFilter(input, userId);
    case "calculate_metrics":
      return execCalculateMetrics(input, userId);
    case "get_pattern_performance":
      return execGetPatternPerformance(input, userId);
    case "get_vix_correlation":
      return execGetVixCorrelation(input);
    case "get_time_of_day_analysis":
      return execGetTimeOfDayAnalysis(input, userId);
    case "get_live_market_data":
      return execGetLiveMarketData(input);
    case "get_day_detail":
      return execGetDayDetail(input, userId);
    case "get_recent_performance_trend":
      return execGetRecentPerformanceTrend(input, userId);
    case "flag_trade_for_review":
      return execFlagTradeForReview(input, userId);
    case "save_insight":
      return execSaveInsight(input, userId);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── 1. get_trades_by_filter ──────────────────────────────────────────

async function execGetTradesByFilter(
  input: Record<string, unknown>,
  userId: string
) {
  const limit = (input.limit as number) || 50;
  const orderByField = (input.orderBy as string) || "date_desc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };

  // Symbol filter
  if (input.symbol) where.symbol = (input.symbol as string).toUpperCase();

  // Side filter
  if (input.side && input.side !== "all") where.side = input.side;

  // Date range
  if (input.startDate || input.endDate) {
    where.entryDate = {};
    if (input.startDate)
      where.entryDate.gte = new Date(input.startDate as string);
    if (input.endDate) {
      const end = new Date(input.endDate as string);
      end.setHours(23, 59, 59, 999);
      where.entryDate.lte = end;
    }
  }

  // Status filter
  if (input.status && input.status !== "all") {
    if (input.status === "win") where.pnl = { gt: 0 };
    else if (input.status === "loss") where.pnl = { lt: 0 };
    else if (input.status === "breakeven") where.pnl = 0;
  }

  // Pattern (tag) filter
  if (input.pattern) {
    where.tags = { has: input.pattern as string };
  }

  // Order by
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any;
  switch (orderByField) {
    case "date_asc":
      orderBy = { entryDate: "asc" };
      break;
    case "pnl_desc":
      orderBy = { pnl: "desc" };
      break;
    case "pnl_asc":
      orderBy = { pnl: "asc" };
      break;
    case "date_desc":
    default:
      orderBy = { entryDate: "desc" };
      break;
  }

  let trades = await prisma.trade.findMany({
    where,
    orderBy,
    take: limit * 2, // fetch extra to allow post-filters
  });

  // Post-query filters: time of day, day of week (these can't be done in Prisma)
  if (input.timeOfDayStart || input.timeOfDayEnd) {
    const [startH, startM] = input.timeOfDayStart
      ? (input.timeOfDayStart as string).split(":").map(Number)
      : [0, 0];
    const [endH, endM] = input.timeOfDayEnd
      ? (input.timeOfDayEnd as string).split(":").map(Number)
      : [23, 59];
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    trades = trades.filter((t) => {
      const d = t.entryDate;
      const tradeMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
      return tradeMinutes >= startMinutes && tradeMinutes <= endMinutes;
    });
  }

  if (input.dayOfWeek && input.dayOfWeek !== "all") {
    const targetDay = DAY_NAMES.indexOf(input.dayOfWeek as string);
    if (targetDay >= 0) {
      trades = trades.filter((t) => t.entryDate.getUTCDay() === targetDay);
    }
  }

  // Apply limit after post-filters
  trades = trades.slice(0, limit);

  return {
    count: trades.length,
    trades: trades.map((t) => ({
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
      flaggedForReview: t.flaggedForReview,
      flagReason: t.flagReason,
    })),
  };
}

// ── 2. calculate_metrics ─────────────────────────────────────────────

async function execCalculateMetrics(
  input: Record<string, unknown>,
  userId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };
  const groupBy = (input.groupBy as string) || "none";

  if (input.symbol) where.symbol = (input.symbol as string).toUpperCase();
  if (input.side && input.side !== "all") where.side = input.side;

  if (input.startDate || input.endDate) {
    where.exitDate = {};
    if (input.startDate)
      where.exitDate.gte = new Date(input.startDate as string);
    if (input.endDate) {
      const end = new Date(input.endDate as string);
      end.setHours(23, 59, 59, 999);
      where.exitDate.lte = end;
    }
  }

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { exitDate: "asc" },
  });

  if (!trades.length) {
    return { error: "No trades found matching the specified filters." };
  }

  if (groupBy === "none") {
    return computeMetrics(trades);
  }

  // Grouped metrics
  const groups = new Map<string, TradeRow[]>();

  for (const t of trades) {
    let key: string;
    switch (groupBy) {
      case "day":
        key = t.exitDate.toISOString().slice(0, 10);
        break;
      case "week": {
        const d = new Date(t.exitDate);
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(
          ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
        );
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
        break;
      }
      case "month":
        key = t.exitDate.toISOString().slice(0, 7);
        break;
      case "dayOfWeek":
        key = DAY_NAMES[t.exitDate.getUTCDay()];
        break;
      case "hour":
        key = `${String(t.entryDate.getUTCHours()).padStart(2, "0")}:00`;
        break;
      case "pattern": {
        // A trade can have multiple tags; it appears in each tag's group
        const tags = t.tags.length > 0 ? t.tags : ["untagged"];
        for (const tag of tags) {
          if (!groups.has(tag)) groups.set(tag, []);
          groups.get(tag)!.push(t);
        }
        continue; // skip the default set below
      }
      case "symbol":
        key = t.symbol;
        break;
      default:
        key = "all";
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const grouped: Record<string, ReturnType<typeof computeMetrics>> = {};
  for (const [key, groupTrades] of groups) {
    grouped[key] = computeMetrics(groupTrades);
  }

  return {
    groupBy,
    overall: computeMetrics(trades),
    groups: grouped,
  };
}

// ── 3. get_pattern_performance ───────────────────────────────────────

async function execGetPatternPerformance(
  input: Record<string, unknown>,
  userId: string
) {
  const patternFilter = (input.pattern as string) || "all";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };

  if (input.startDate || input.endDate) {
    where.exitDate = {};
    if (input.startDate)
      where.exitDate.gte = new Date(input.startDate as string);
    if (input.endDate) {
      const end = new Date(input.endDate as string);
      end.setHours(23, 59, 59, 999);
      where.exitDate.lte = end;
    }
  }

  if (patternFilter !== "all") {
    where.tags = { has: patternFilter };
  }

  const trades = await prisma.trade.findMany({ where });

  if (!trades.length) {
    return { error: "No trades found matching the specified filters." };
  }

  // Group by tag
  const patternMap = new Map<
    string,
    { wins: number; losses: number; totalPnl: number; count: number; pnls: number[] }
  >();

  for (const t of trades) {
    const tags = t.tags.length > 0 ? t.tags : ["untagged"];
    for (const tag of tags) {
      if (patternFilter !== "all" && tag !== patternFilter) continue;
      if (!patternMap.has(tag)) {
        patternMap.set(tag, { wins: 0, losses: 0, totalPnl: 0, count: 0, pnls: [] });
      }
      const entry = patternMap.get(tag)!;
      entry.count++;
      entry.totalPnl += t.pnl;
      entry.pnls.push(t.pnl);
      if (t.pnl > 0) entry.wins++;
      else if (t.pnl < 0) entry.losses++;
    }
  }

  const patterns = Array.from(patternMap.entries())
    .map(([pattern, data]) => ({
      pattern,
      tradeCount: data.count,
      winRate: Math.round((data.wins / data.count) * 10000) / 100,
      avgPnl: Math.round((data.totalPnl / data.count) * 100) / 100,
      totalPnl: Math.round(data.totalPnl * 100) / 100,
      wins: data.wins,
      losses: data.losses,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);

  return { patterns };
}

// ── 4. get_vix_correlation ───────────────────────────────────────────

async function execGetVixCorrelation(input: Record<string, unknown>) {
  const buckets = input.vixBuckets as
    | Array<{ min: number; max: number; label: string }>
    | undefined;

  return {
    status: "limitation",
    message:
      "VIX correlation analysis is not currently available because VIX levels are not stored per-trade. " +
      "To enable this feature, the Trade model would need a `vixAtEntry` (Float?) field that records the VIX level " +
      "at the time each trade is opened. Once that data is captured, this tool can bucket trades by VIX range and " +
      "compute win rate, avg P&L, and trade count for each bucket.",
    suggestedSchema: "Add to Trade model: vixAtEntry Float?",
    requestedBuckets: buckets ?? "none provided",
  };
}

// ── 5. get_time_of_day_analysis ──────────────────────────────────────

async function execGetTimeOfDayAnalysis(
  input: Record<string, unknown>,
  userId: string
) {
  const bucketMinutes = (input.bucketMinutes as number) || 60;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };

  if (input.startDate || input.endDate) {
    where.entryDate = {};
    if (input.startDate)
      where.entryDate.gte = new Date(input.startDate as string);
    if (input.endDate) {
      const end = new Date(input.endDate as string);
      end.setHours(23, 59, 59, 999);
      where.entryDate.lte = end;
    }
  }

  const trades = await prisma.trade.findMany({ where });

  if (!trades.length) {
    return { error: "No trades found matching the specified filters." };
  }

  // Bucket trades by time of day
  const buckets = new Map<
    string,
    { wins: number; losses: number; totalPnl: number; count: number }
  >();

  for (const t of trades) {
    const totalMinutes =
      t.entryDate.getUTCHours() * 60 + t.entryDate.getUTCMinutes();
    const bucketIndex = Math.floor(totalMinutes / bucketMinutes);
    const bucketStartMinutes = bucketIndex * bucketMinutes;
    const bucketEndMinutes = bucketStartMinutes + bucketMinutes - 1;
    const label = `${String(Math.floor(bucketStartMinutes / 60)).padStart(2, "0")}:${String(bucketStartMinutes % 60).padStart(2, "0")}-${String(Math.floor(bucketEndMinutes / 60)).padStart(2, "0")}:${String(bucketEndMinutes % 60).padStart(2, "0")}`;

    if (!buckets.has(label)) {
      buckets.set(label, { wins: 0, losses: 0, totalPnl: 0, count: 0 });
    }
    const entry = buckets.get(label)!;
    entry.count++;
    entry.totalPnl += t.pnl;
    if (t.pnl > 0) entry.wins++;
    else if (t.pnl < 0) entry.losses++;
  }

  const timeBuckets = Array.from(buckets.entries())
    .map(([timeRange, data]) => ({
      timeRange,
      tradeCount: data.count,
      winRate: Math.round((data.wins / data.count) * 10000) / 100,
      avgPnl: Math.round((data.totalPnl / data.count) * 100) / 100,
      totalPnl: Math.round(data.totalPnl * 100) / 100,
    }))
    .sort((a, b) => a.timeRange.localeCompare(b.timeRange));

  return {
    bucketMinutes,
    totalTrades: trades.length,
    buckets: timeBuckets,
  };
}

// ── 6. get_live_market_data ──────────────────────────────────────────

async function execGetLiveMarketData(input: Record<string, unknown>) {
  const symbols = input.symbols as string[];

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const quote = await finnhub.quote(symbol.toUpperCase());
      return {
        symbol: symbol.toUpperCase(),
        currentPrice: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
      };
    })
  );

  return {
    quotes: results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { symbol: symbols[i].toUpperCase(), error: "Failed to fetch quote" }
    ),
  };
}

// ── 7. get_day_detail ────────────────────────────────────────────────

async function execGetDayDetail(
  input: Record<string, unknown>,
  userId: string
) {
  const dateStr = input.date as string;
  const dayStart = new Date(dateStr);
  const dayEnd = new Date(dateStr);
  dayEnd.setHours(23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { entryDate: "asc" },
  });

  if (!trades.length) {
    return {
      date: dateStr,
      totalTrades: 0,
      message: "No trades found for this date.",
    };
  }

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl < 0);

  return {
    date: dateStr,
    totalTrades: trades.length,
    totalPnl: Math.round(totalPnl * 100) / 100,
    winRate:
      Math.round((winners.length / trades.length) * 10000) / 100,
    winners: winners.length,
    losers: losers.length,
    breakeven: trades.length - winners.length - losers.length,
    largestWin:
      winners.length > 0
        ? Math.max(...winners.map((t) => t.pnl))
        : 0,
    largestLoss:
      losers.length > 0
        ? Math.min(...losers.map((t) => t.pnl))
        : 0,
    trades: trades.map((t) => ({
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
      tags: t.tags,
      notes: t.notes,
    })),
  };
}

// ── 8. get_recent_performance_trend ──────────────────────────────────

async function execGetRecentPerformanceTrend(
  input: Record<string, unknown>,
  userId: string
) {
  const period = (input.period as string) || "30days";
  const compareTo = (input.compareTo as string) || "previous_period";
  const days = parsePeriodDays(period);

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);

  const previousPeriodStart = new Date(periodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

  // Fetch current period trades
  const currentTrades = await prisma.trade.findMany({
    where: {
      userId,
      exitDate: { gte: periodStart, lte: now },
    },
    orderBy: { exitDate: "asc" },
  });

  const currentMetrics = computeMetrics(currentTrades);

  let baselineMetrics;
  let baselineLabel: string;

  if (compareTo === "previous_period") {
    const prevTrades = await prisma.trade.findMany({
      where: {
        userId,
        exitDate: { gte: previousPeriodStart, lt: periodStart },
      },
      orderBy: { exitDate: "asc" },
    });
    baselineMetrics = computeMetrics(prevTrades);
    baselineLabel = `Previous ${days} days`;
  } else {
    // all_time_avg
    const allTrades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { exitDate: "asc" },
    });
    baselineMetrics = computeMetrics(allTrades);
    baselineLabel = "All-time";
  }

  // Compute deltas
  const delta = {
    totalPnl:
      Math.round(
        ((currentMetrics.totalPnl as number) -
          (baselineMetrics.totalPnl as number)) *
          100
      ) / 100,
    winRate:
      Math.round(
        ((currentMetrics.winRate as number) -
          (baselineMetrics.winRate as number)) *
          100
      ) / 100,
    totalTrades: currentMetrics.totalTrades - baselineMetrics.totalTrades,
    avgWin:
      Math.round(
        ((currentMetrics.avgWin as number) -
          (baselineMetrics.avgWin as number)) *
          100
      ) / 100,
    avgLoss:
      Math.round(
        ((currentMetrics.avgLoss as number) -
          (baselineMetrics.avgLoss as number)) *
          100
      ) / 100,
  };

  return {
    period,
    periodRange: {
      start: periodStart.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    },
    current: currentMetrics,
    baseline: {
      label: baselineLabel,
      metrics: baselineMetrics,
    },
    delta,
  };
}

// ── 9. flag_trade_for_review ─────────────────────────────────────────

async function execFlagTradeForReview(
  input: Record<string, unknown>,
  userId: string
) {
  const tradeId = input.tradeId as string;
  const reason = input.reason as string;

  // Verify ownership
  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
  });

  if (!trade) {
    return { error: "Trade not found or does not belong to this user.", tradeId };
  }

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      flaggedForReview: true,
      flagReason: reason,
    },
  });

  return {
    success: true,
    tradeId: updated.id,
    symbol: updated.symbol,
    flaggedForReview: updated.flaggedForReview,
    flagReason: updated.flagReason,
  };
}

// ── 10. save_insight ─────────────────────────────────────────────────

async function execSaveInsight(
  input: Record<string, unknown>,
  userId: string
) {
  const insight = await prisma.tradingInsight.create({
    data: {
      userId,
      title: input.title as string,
      content: input.content as string,
      category: input.category as string,
      agentType: input.agentType as string,
      relatedTrades: (input.relatedTrades as string[]) || [],
    },
  });

  return {
    success: true,
    insightId: insight.id,
    title: insight.title,
    category: insight.category,
    savedAt: insight.savedAt.toISOString(),
  };
}
