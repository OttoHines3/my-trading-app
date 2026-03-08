import type { Prisma } from "@prisma/client";

export function parseFiltersToWhere(searchParams: URLSearchParams): Prisma.TradeWhereInput {
  const where: Prisma.TradeWhereInput = {};

  const assetClasses = searchParams.get("assetClasses")?.split(",").filter(Boolean);
  if (assetClasses?.length) where.assetClass = { in: assetClasses };

  const sides = searchParams.get("sides")?.split(",").filter(Boolean);
  if (sides?.length) where.side = { in: sides };

  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean);
  if (symbols?.length) where.symbol = { in: symbols };

  // Strategy filter — uncomment after running migration to add `strategy` column
  // const strategies = searchParams.get("strategies")?.split(",").filter(Boolean);
  // if (strategies?.length) where.strategy = { in: strategies };

  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  if (tags?.length) where.tags = { hasSome: tags };

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.exitDate = {};
    if (dateFrom) where.exitDate.gte = new Date(dateFrom);
    if (dateTo) where.exitDate.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  // Status filters (win/loss/breakeven) are derived from pnl
  const statuses = searchParams.get("statuses")?.split(",").filter(Boolean);
  if (statuses?.length) {
    const pnlConditions: Prisma.TradeWhereInput[] = [];
    if (statuses.includes("win")) pnlConditions.push({ pnl: { gt: 0 } });
    if (statuses.includes("loss")) pnlConditions.push({ pnl: { lt: 0 } });
    if (statuses.includes("breakeven")) pnlConditions.push({ pnl: { equals: 0 } });
    if (pnlConditions.length) where.OR = pnlConditions;
  }

  return where;
}

/** Post-query JS filter for day-of-week and hour-of-day */
export function applyTimeFilters<T extends { entryDate: string | Date }>(
  trades: T[],
  searchParams: URLSearchParams
): T[] {
  const daysOfWeek = searchParams.get("daysOfWeek")?.split(",").map(Number).filter((n) => !isNaN(n));
  const hoursOfDay = searchParams.get("hoursOfDay")?.split(",").map(Number).filter((n) => !isNaN(n));

  let result = trades;
  if (daysOfWeek?.length) {
    result = result.filter((t) => {
      const d = typeof t.entryDate === "string" ? new Date(t.entryDate) : t.entryDate;
      return daysOfWeek.includes(d.getDay());
    });
  }
  if (hoursOfDay?.length) {
    result = result.filter((t) => {
      const d = typeof t.entryDate === "string" ? new Date(t.entryDate) : t.entryDate;
      return hoursOfDay.includes(d.getHours());
    });
  }
  return result;
}
