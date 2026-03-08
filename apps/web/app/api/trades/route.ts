import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFiltersToWhere, applyTimeFilters } from "@/lib/utils/parse-filters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? searchParams.get("limit") ?? "25", 10)));

  // Sorting
  const sortField = searchParams.get("sortField") ?? "exitDate";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const allowedSortFields = ["entryDate", "exitDate", "symbol", "pnl", "entryPrice", "exitPrice"];
  const orderByField = allowedSortFields.includes(sortField) ? sortField : "exitDate";

  // Filters
  const where = parseFiltersToWhere(searchParams);

  try {
    const hasDayOrHourFilters = searchParams.has("daysOfWeek") || searchParams.has("hoursOfDay");

    if (hasDayOrHourFilters) {
      // When day/hour filters are active, we must fetch all matching DB rows,
      // apply JS time filters, then paginate manually
      const allTrades = await prisma.trade.findMany({
        where,
        orderBy: { [orderByField]: sortDir },
      });

      const serialized = allTrades.map((t) => ({
        ...t,
        entryDate: t.entryDate.toISOString(),
        exitDate: t.exitDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }));

      const filtered = applyTimeFilters(serialized, searchParams);
      const total = filtered.length;
      const trades = filtered.slice((page - 1) * perPage, page * perPage);

      return NextResponse.json({ trades, total });
    }

    // Standard DB-level pagination
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { [orderByField]: sortDir },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.trade.count({ where }),
    ]);

    return NextResponse.json({ trades, total });
  } catch (error) {
    console.error("Trades fetch error:", error);
    return NextResponse.json({ trades: [], total: 0 });
  }
}
