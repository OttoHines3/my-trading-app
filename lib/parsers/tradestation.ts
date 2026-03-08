/**
 * TradeStation Historical Activity Report CSV Parser
 *
 * Format:
 *   - Metadata header block (# --- lines, report info, account info)
 *   - Column headers: Date, Symbol, CUSIP, Side, Quantity, Price, Principal, Commission, Other Fees, Net Amount, Order ID
 *   - Each row is a single execution; multiple rows form one round-trip trade
 *   - Side: empty or "BuyToOpen"/"SellToOpen" for opens, "SellToClose"/"BuyToClose" for closes
 *   - Symbol format for options: "SPY 260107C693" → underlying YYMMDD[C/P]Strike
 */

interface Execution {
  date: string;
  symbol: string;
  cusip: string;
  side: string;
  quantity: number;
  price: number;
  principal: number;
  commission: number;
  otherFees: number;
  netAmount: number;
  orderId: string;
}

interface GroupedTrade {
  symbol: string;
  underlying: string;
  assetClass: "stocks" | "options" | "futures";
  side: "long" | "short";
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  commissions: number;
  fees: number;
  notes: string;
}

export interface ParsedTradeResult {
  trades: GroupedTrade[];
  errors: string[];
  accountInfo?: {
    account: string;
    dateRange: string;
    type: string;
  };
}

function parseNumber(val: string): number {
  return parseFloat(val.replace(/[$,\s]/g, "")) || 0;
}

function parseDate(val: string): Date {
  // TradeStation uses MM/DD/YYYY
  const parts = val.trim().split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts.map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(val);
}

/** Parse TradeStation options symbol like "SPY 260107C693" */
function parseOptionSymbol(sym: string): { underlying: string; expiry: string; type: string; strike: string } | null {
  // Format: "UNDERLYING YYMMDD[C/P]STRIKE"
  const match = sym.match(/^(\w+)\s+(\d{6})([CP])(\d+)$/);
  if (!match) return null;
  return {
    underlying: match[1],
    expiry: match[2],
    type: match[3] === "C" ? "Call" : "Put",
    strike: match[4],
  };
}

function isOpenSide(side: string): boolean {
  const s = side.toLowerCase().trim();
  return s === "" || s === "buytoopen" || s === "selltoopen";
}

function isCloseSide(side: string): boolean {
  const s = side.toLowerCase().trim();
  return s === "selltoclose" || s === "buytoclose";
}

function isShortOpen(side: string): boolean {
  return side.toLowerCase().trim() === "selltoopen";
}

/**
 * Parse a TradeStation CSV and skip the metadata header.
 * Returns the column header row index and parsed rows.
 */
function parseCSVRows(text: string): { headers: string[]; rows: string[][]; accountInfo?: { account: string; dateRange: string; type: string } } {
  const lines = text.split(/\r?\n/);
  let headerIdx = -1;
  let accountInfo: { account: string; dateRange: string; type: string } | undefined;

  // Extract account info from metadata and find column headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract metadata
    if (line.startsWith("Account:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.account = line.replace("Account:", "").trim();
    }
    if (line.startsWith("Dates:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.dateRange = line.replace("Dates:", "").trim();
    }
    if (line.startsWith("Type:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.type = line.replace("Type:", "").trim();
    }

    // Detect column header row by looking for "Date" and "Symbol" columns
    if (line.includes("Date") && line.includes("Symbol") && line.includes("Quantity")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    return { headers: [], rows: [], accountInfo };
  }

  // Parse header
  const headers = lines[headerIdx].split(",").map((h) => h.trim());

  // Parse data rows
  const rows: string[][] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Simple CSV parse (TradeStation doesn't quote fields with commas)
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length >= headers.length - 1 && cells[0]) {
      rows.push(cells);
    }
  }

  return { headers, rows, accountInfo };
}

/**
 * Main parser: takes raw CSV text, returns grouped trades.
 */
export function parseTradeStationCSV(text: string): ParsedTradeResult {
  const { headers, rows, accountInfo } = parseCSVRows(text);
  const errors: string[] = [];

  if (headers.length === 0) {
    return { trades: [], errors: ["Could not find column headers in the CSV. Expected TradeStation Historical Activity Report format."], accountInfo };
  }

  // Map column indices
  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/\s+/g, "");
    colIdx[key] = i;
  });

  const dateCol = colIdx["date"] ?? -1;
  const symbolCol = colIdx["symbol"] ?? -1;
  const sideCol = colIdx["side"] ?? -1;
  const quantityCol = colIdx["quantity"] ?? -1;
  const priceCol = colIdx["price"] ?? -1;
  const principalCol = colIdx["principal"] ?? -1;
  const commissionCol = colIdx["commission"] ?? -1;
  const otherFeesCol = colIdx["otherfees"] ?? -1;
  const netAmountCol = colIdx["netamount"] ?? -1;
  const orderIdCol = colIdx["orderid"] ?? -1;

  if (dateCol === -1 || symbolCol === -1) {
    return { trades: [], errors: ["Missing required columns: Date and Symbol"], accountInfo };
  }

  // Parse all executions
  const executions: Execution[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const date = row[dateCol];
    const symbol = row[symbolCol];
    if (!date || !symbol) {
      errors.push(`Row ${rowNum}: missing date or symbol`);
      continue;
    }

    executions.push({
      date,
      symbol,
      cusip: row[colIdx["cusip"]] || "",
      side: sideCol >= 0 ? (row[sideCol] || "") : "",
      quantity: quantityCol >= 0 ? parseNumber(row[quantityCol]) : 0,
      price: priceCol >= 0 ? parseNumber(row[priceCol]) : 0,
      principal: principalCol >= 0 ? parseNumber(row[principalCol]) : 0,
      commission: commissionCol >= 0 ? parseNumber(row[commissionCol]) : 0,
      otherFees: otherFeesCol >= 0 ? parseNumber(row[otherFeesCol]) : 0,
      netAmount: netAmountCol >= 0 ? parseNumber(row[netAmountCol]) : 0,
      orderId: orderIdCol >= 0 ? (row[orderIdCol] || "") : "",
    });
  }

  // Group executions by symbol into open/close buckets
  const symbolGroups = new Map<string, { opens: Execution[]; closes: Execution[] }>();

  for (const exec of executions) {
    if (!symbolGroups.has(exec.symbol)) {
      symbolGroups.set(exec.symbol, { opens: [], closes: [] });
    }
    const group = symbolGroups.get(exec.symbol)!;

    if (isCloseSide(exec.side)) {
      group.closes.push(exec);
    } else {
      group.opens.push(exec);
    }
  }

  // Build round-trip trades from grouped executions
  const trades: GroupedTrade[] = [];

  for (const [symbol, { opens, closes }] of symbolGroups) {
    // Determine asset class and underlying from symbol
    const optionInfo = parseOptionSymbol(symbol);
    const underlying = optionInfo ? optionInfo.underlying : symbol;
    const assetClass = optionInfo ? "options" : "stocks";

    // Determine side: if opens have no side or "BuyToOpen" → long; "SellToOpen" → short
    const isShort = opens.length > 0 && isShortOpen(opens[0].side);
    const side = isShort ? "short" : "long";

    // Calculate entry stats from opens
    const totalOpenQty = opens.reduce((s, e) => s + Math.abs(e.quantity), 0);
    const weightedEntryPrice = totalOpenQty > 0
      ? opens.reduce((s, e) => s + e.price * Math.abs(e.quantity), 0) / totalOpenQty
      : 0;
    const entryDate = opens.length > 0 ? parseDate(opens[0].date) : new Date();

    // Calculate exit stats from closes
    const totalCloseQty = closes.reduce((s, e) => s + Math.abs(e.quantity), 0);
    const weightedExitPrice = totalCloseQty > 0
      ? closes.reduce((s, e) => s + e.price * Math.abs(e.quantity), 0) / totalCloseQty
      : 0;
    const exitDate = closes.length > 0 ? parseDate(closes[closes.length - 1].date) : entryDate;

    // Total P&L from net amounts (most accurate, includes fees)
    const allExecs = [...opens, ...closes];
    const totalNetAmount = allExecs.reduce((s, e) => s + e.netAmount, 0);
    const totalCommission = allExecs.reduce((s, e) => s + e.commission, 0);
    const totalFees = allExecs.reduce((s, e) => s + e.otherFees, 0);

    // Build notes with trade details
    const noteParts: string[] = [];
    if (optionInfo) {
      noteParts.push(`${optionInfo.underlying} ${optionInfo.expiry.slice(0, 2)}/${optionInfo.expiry.slice(2, 4)}/${optionInfo.expiry.slice(4, 6)} ${optionInfo.type} $${optionInfo.strike}`);
    }
    if (totalCommission) noteParts.push(`Commission: $${Math.abs(totalCommission).toFixed(2)}`);
    if (totalFees) noteParts.push(`Fees: $${Math.abs(totalFees).toFixed(2)}`);

    const quantity = Math.max(totalOpenQty, totalCloseQty);

    // Only create trade if there are executions
    if (quantity > 0) {
      trades.push({
        symbol: underlying,
        underlying,
        assetClass,
        side,
        entryDate,
        exitDate,
        entryPrice: weightedEntryPrice,
        exitPrice: weightedExitPrice,
        quantity,
        pnl: totalNetAmount,
        commissions: Math.abs(totalCommission),
        fees: Math.abs(totalFees),
        notes: noteParts.join(" | "),
      });
    }
  }

  // Sort by entry date
  trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

  return { trades, errors, accountInfo };
}
