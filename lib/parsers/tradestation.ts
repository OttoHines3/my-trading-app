/**
 * TradeStation Historical Activity Report CSV Parser
 *
 * Format:
 *   - Metadata header block (# --- lines, report info, account info)
 *   - Column headers: Date, Symbol, CUSIP, Side, Quantity, Price, Principal, Commission, Other Fees, Net Amount, Order ID
 *   - Each row is a single execution; multiple rows form one round-trip trade
 *   - Side: empty or "BuyToOpen"/"SellToOpen" for opens, "SellToClose"/"BuyToClose" for closes
 *   - Symbol format for options: "SPY 260107C693" → underlying YYMMDD[C/P]Strike
 *
 * Handles: trailing commas from spreadsheet exports, tab-delimited files,
 * quoted values, BOM characters, mixed line endings.
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
  const match = sym.match(/^(\w+)\s+(\d{6})([CP])(\d+)$/);
  if (!match) return null;
  return {
    underlying: match[1],
    expiry: match[2],
    type: match[3] === "C" ? "Call" : "Put",
    strike: match[4],
  };
}

function isCloseSide(side: string): boolean {
  const s = side.toLowerCase().trim();
  return s === "selltoclose" || s === "buytoclose";
}

function isShortOpen(side: string): boolean {
  return side.toLowerCase().trim() === "selltoopen";
}

/** Strip BOM and normalize line endings */
function cleanText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Detect delimiter: if splitting first data-looking line by tab gives more columns than comma, use tab */
function detectDelimiter(text: string): string {
  const lines = text.split("\n");
  for (const line of lines) {
    // Find a line that looks like data (starts with a date pattern MM/DD/YYYY)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim())) {
      const commaCount = line.split(",").length;
      const tabCount = line.split("\t").length;
      return tabCount > commaCount ? "\t" : ",";
    }
  }
  // Fallback: check the header line
  for (const line of lines) {
    if (line.includes("Date") && line.includes("Symbol")) {
      const commaCount = line.split(",").length;
      const tabCount = line.split("\t").length;
      return tabCount > commaCount ? "\t" : ",";
    }
  }
  return ",";
}

/** Split a CSV/TSV line respecting quoted values */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Remove trailing empty strings from array */
function stripTrailingEmpty(arr: string[]): string[] {
  let end = arr.length;
  while (end > 0 && arr[end - 1] === "") end--;
  return arr.slice(0, end);
}

/**
 * Parse the TradeStation CSV: skip metadata, find headers, parse data rows.
 */
function parseCSVRows(text: string): {
  headers: string[];
  rows: string[][];
  accountInfo?: { account: string; dateRange: string; type: string };
} {
  const cleaned = cleanText(text);
  const delimiter = detectDelimiter(cleaned);
  const lines = cleaned.split("\n");

  let headerIdx = -1;
  let accountInfo: { account: string; dateRange: string; type: string } | undefined;

  // Extract account info from metadata and find column headers
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    // For metadata, get the first cell value (before any delimiter)
    const firstCell = raw.split(delimiter)[0].trim();

    if (firstCell.startsWith("Account:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.account = firstCell.replace("Account:", "").trim();
    }
    if (firstCell.startsWith("Dates:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.dateRange = firstCell.replace("Dates:", "").trim();
    }
    if (firstCell.startsWith("Type:")) {
      accountInfo = accountInfo || { account: "", dateRange: "", type: "" };
      accountInfo.type = firstCell.replace("Type:", "").trim();
    }

    // Detect column header row: split by delimiter and check for known column names
    const cells = splitLine(raw, delimiter);
    const cellValues = cells.map((c) => c.toLowerCase().trim());
    if (cellValues.includes("date") && cellValues.includes("symbol") && cellValues.includes("quantity")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    return { headers: [], rows: [], accountInfo };
  }

  // Parse header — strip trailing empty columns (from spreadsheet export)
  const rawHeaders = splitLine(lines[headerIdx], delimiter);
  const headers = stripTrailingEmpty(rawHeaders);

  // Parse data rows
  const rows: string[][] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const cells = splitLine(line, delimiter);

    // Only require that we have at least a date and symbol (first 2 columns)
    // Don't require matching header length — trailing columns may be missing
    if (cells.length >= 2 && cells[0]) {
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
    return {
      trades: [],
      errors: ["Could not find column headers in the CSV. Expected columns: Date, Symbol, CUSIP, Side, Quantity, Price, Principal, Commission, Other Fees, Net Amount, Order ID"],
      accountInfo,
    };
  }

  // Map column indices by normalized header name
  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/\s+/g, "");
    if (key) colIdx[key] = i;
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
    return {
      trades: [],
      errors: [`Missing required columns: Date and Symbol. Found headers: ${headers.filter(Boolean).join(", ")}`],
      accountInfo,
    };
  }

  // Parse all executions
  const executions: Execution[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const date = row[dateCol] || "";
    const symbol = row[symbolCol] || "";
    if (!date || !symbol) {
      errors.push(`Row ${rowNum}: missing date or symbol`);
      continue;
    }

    // Safely access columns — row may be shorter than header count
    const safeGet = (col: number): string => (col >= 0 && col < row.length) ? (row[col] || "") : "";

    executions.push({
      date,
      symbol,
      cusip: safeGet(colIdx["cusip"] ?? -1),
      side: safeGet(sideCol),
      quantity: quantityCol >= 0 ? parseNumber(safeGet(quantityCol)) : 0,
      price: priceCol >= 0 ? parseNumber(safeGet(priceCol)) : 0,
      principal: principalCol >= 0 ? parseNumber(safeGet(principalCol)) : 0,
      commission: commissionCol >= 0 ? parseNumber(safeGet(commissionCol)) : 0,
      otherFees: otherFeesCol >= 0 ? parseNumber(safeGet(otherFeesCol)) : 0,
      netAmount: netAmountCol >= 0 ? parseNumber(safeGet(netAmountCol)) : 0,
      orderId: safeGet(orderIdCol),
    });
  }

  if (executions.length === 0) {
    return {
      trades: [],
      errors: errors.length > 0 ? errors : [`No data rows found after headers. Found ${rows.length} rows but none had valid date/symbol.`],
      accountInfo,
    };
  }

  // Group executions by symbol, then FIFO match opens to closes
  // so each open+close pair becomes its own trade
  const openQueues = new Map<string, Execution[]>();

  for (const exec of executions) {
    if (!isCloseSide(exec.side)) {
      const queue = openQueues.get(exec.symbol) || [];
      queue.push(exec);
      openQueues.set(exec.symbol, queue);
    }
  }

  // Build round-trip trades via FIFO matching
  const trades: GroupedTrade[] = [];

  function buildTrade(rawSymbol: string, open: Execution | null, close: Execution | null): void {
    const optionInfo = parseOptionSymbol(rawSymbol);
    const assetClass = optionInfo ? "options" : "stocks";
    // Store full option symbol (e.g. "SPY 260306C6790") so the UI can parse strike/expiry
    const symbol = rawSymbol;
    const underlying = optionInfo ? optionInfo.underlying : rawSymbol;

    const isShort = open ? isShortOpen(open.side) : false;
    const side = isShort ? "short" : "long";

    const entryPrice = open?.price ?? 0;
    const exitPrice = close?.price ?? 0;
    const entryDate = open ? parseDate(open.date) : close ? parseDate(close.date) : new Date();
    const exitDate = close ? parseDate(close.date) : entryDate;
    const quantity = Math.abs(open?.quantity ?? close?.quantity ?? 0);

    const allExecs = [open, close].filter(Boolean) as Execution[];
    const totalNetAmount = allExecs.reduce((s, e) => s + e.netAmount, 0);
    const totalCommission = allExecs.reduce((s, e) => s + e.commission, 0);
    const totalFees = allExecs.reduce((s, e) => s + e.otherFees, 0);

    const noteParts: string[] = [];
    if (optionInfo) {
      noteParts.push(`${underlying} ${optionInfo.expiry.slice(0, 2)}/${optionInfo.expiry.slice(2, 4)}/${optionInfo.expiry.slice(4, 6)} ${optionInfo.type} $${optionInfo.strike}`);
    }
    if (totalCommission) noteParts.push(`Commission: $${Math.abs(totalCommission).toFixed(2)}`);
    if (totalFees) noteParts.push(`Fees: $${Math.abs(totalFees).toFixed(2)}`);

    if (quantity > 0) {
      trades.push({
        symbol,
        underlying,
        assetClass,
        side,
        entryDate,
        exitDate,
        entryPrice,
        exitPrice,
        quantity,
        pnl: totalNetAmount,
        commissions: Math.abs(totalCommission),
        fees: Math.abs(totalFees),
        notes: noteParts.join(" | "),
      });
    }
  }

  // Match closing executions to opens FIFO by symbol
  for (const exec of executions) {
    if (!isCloseSide(exec.side)) continue;

    const queue = openQueues.get(exec.symbol);
    if (queue && queue.length > 0) {
      const openExec = queue.shift()!;
      if (queue.length === 0) openQueues.delete(exec.symbol);
      buildTrade(exec.symbol, openExec, exec);
    } else {
      // Closing with no matching open — standalone
      buildTrade(exec.symbol, null, exec);
    }
  }

  // Remaining unclosed opens
  for (const [symbol, queue] of openQueues) {
    for (const openExec of queue) {
      buildTrade(symbol, openExec, null);
    }
  }

  trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

  return { trades, errors, accountInfo };
}
