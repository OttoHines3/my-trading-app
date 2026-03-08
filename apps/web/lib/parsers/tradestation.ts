/**
 * TradeStation Historical Activity Report CSV Parser
 *
 * CSV structure:
 *   - Metadata rows at top (# --- lines, report info, account info)
 *   - Columns: Date | Symbol | CUSIP | Side | Quantity | Price |
 *     Principal | Commission | Other Fees | Net Amount | Order ID
 *   - NO Time column — only Date in MM/DD/YYYY format
 *   - Each row maps 1:1 to a trade (no grouping/pairing)
 *   - Order ID is the unique identifier (e.g. "1222082534LEG1")
 *   - Symbol format for options: "SPY 260107C693" (ticker YYMMDD C/P strike)
 */

export interface ParsedTrade {
  externalId: string;
  rawSymbol: string;
  symbol: string;        // underlying ticker
  instrument: string;    // formatted option description
  assetClass: "stocks" | "options" | "futures";
  side: "long" | "short";
  isClosingTrade: boolean;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  netAmount: number;
  fees: number;
  commission: number;
  orderId: string;
  status: "win" | "loss" | "breakeven" | "open";
  entryDate: Date;
  exitDate: Date;
  notes: string;
}

export interface ParsedTradeResult {
  trades: ParsedTrade[];
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

/** Parse MM/DD/YYYY to Date (noon, no fake time) */
function parseDate(val: string): Date {
  const parts = val.trim().split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts.map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(val);
}

/** Format MM/DD/YYYY to YYYY-MM-DD */
function formatDateISO(dateStr: string): string {
  const [mm, dd, yyyy] = dateStr.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/** Parse TradeStation options symbol like "SPY 260107C693" */
function parseOptionSymbol(sym: string): { underlying: string; expiry: string; type: string; strike: string } | null {
  const match = sym.match(/^([A-Z/]+)\s+(\d{6})([CP])(\d+)$/i);
  if (!match) return null;
  return {
    underlying: match[1],
    expiry: match[2],
    type: match[3].toUpperCase() === "C" ? "Call" : "Put",
    strike: match[4],
  };
}

/** Format raw symbol to human-readable instrument: "01-07-2026 693 CALL" */
function formatInstrument(rawSymbol: string): string {
  const match = rawSymbol.trim().match(/^([A-Z/]+)\s+(\d{2})(\d{2})(\d{2})(C|P)(\d+)$/i);
  if (!match) return rawSymbol;
  const [, , yy, mm, dd, type, strikeRaw] = match;
  const expiry = `${mm}-${dd}-20${yy}`;
  let strike = parseInt(strikeRaw, 10);
  if (strike > 10000) strike = Math.round(strike / 100);
  else if (strike > 1000) strike = Math.round(strike / 10);
  const optionType = type.toUpperCase() === "C" ? "CALL" : "PUT";
  return `${expiry} ${strike} ${optionType}`;
}

/** Extract underlying ticker from raw symbol */
function extractUnderlying(rawSymbol: string): string {
  const match = rawSymbol.match(/^([A-Z/]+)\s+/);
  return match ? match[1] : rawSymbol;
}

/** Normalize strike price from TradeStation encoding */
function normalizeStrike(strikeRaw: string): number {
  const strike = parseInt(strikeRaw, 10);
  if (strike > 10000) return Math.round(strike / 100);
  if (strike > 1000) return Math.round(strike / 10);
  return strike;
}

function isCloseSide(side: string): boolean {
  const s = side.toLowerCase().trim();
  return s === "selltoclose" || s === "buytoclose";
}

/** Strip BOM and normalize line endings */
function cleanText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Detect delimiter: tab vs comma */
function detectDelimiter(text: string): string {
  const lines = text.split("\n");
  for (const line of lines) {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim())) {
      const commaCount = line.split(",").length;
      const tabCount = line.split("\t").length;
      return tabCount > commaCount ? "\t" : ",";
    }
  }
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

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
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

  const rawHeaders = splitLine(lines[headerIdx], delimiter);
  const headers = stripTrailingEmpty(rawHeaders);

  const rows: string[][] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const cells = splitLine(line, delimiter);
    if (cells.length >= 2 && cells[0]) {
      rows.push(cells);
    }
  }

  return { headers, rows, accountInfo };
}

/**
 * Main parser: takes raw CSV text, returns 1:1 mapped trades.
 * Every CSV data row becomes exactly one trade. No pairing/grouping.
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

  // Filter to only rows where Date matches MM/DD/YYYY (skip metadata rows that leaked through)
  const dataRows = rows.filter((row) => {
    const date = (row[dateCol] || "").trim();
    return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date);
  });

  console.log(`[TS Parser] CSV rows found: ${dataRows.length}`);

  if (dataRows.length === 0) {
    return {
      trades: [],
      errors: errors.length > 0 ? errors : [`No data rows found after headers. Found ${rows.length} rows but none had valid MM/DD/YYYY dates.`],
      accountInfo,
    };
  }

  // Map each row 1:1 to a trade
  const trades: ParsedTrade[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 1;

    const safeGet = (col: number): string => (col >= 0 && col < row.length) ? (row[col] || "") : "";

    const dateStr = (row[dateCol] || "").trim();
    const rawSymbol = (row[symbolCol] || "").trim();
    const side = safeGet(sideCol).trim();
    const orderId = safeGet(orderIdCol).trim();
    const qty = Math.abs(parseNumber(safeGet(quantityCol)));
    const price = Math.abs(parseNumber(safeGet(priceCol)));
    const netAmount = parseNumber(safeGet(netAmountCol));
    const fees = Math.abs(parseNumber(safeGet(otherFeesCol)));
    const commission = Math.abs(parseNumber(safeGet(commissionCol)));

    if (!dateStr || !rawSymbol) {
      errors.push(`Row ${rowNum}: missing date or symbol`);
      continue;
    }

    const isClose = isCloseSide(side);
    const tradeSide: "long" | "short" = side.toLowerCase().includes("buy") ? "long" : "short";

    // Only closing trades have realized P&L
    const pnl = isClose ? netAmount : 0;
    const status: "win" | "loss" | "breakeven" | "open" = !isClose
      ? "open"
      : pnl > 0 ? "win"
      : pnl < 0 ? "loss"
      : "breakeven";

    const optionInfo = parseOptionSymbol(rawSymbol);
    const assetClass = optionInfo ? "options" : "stocks";
    const underlying = extractUnderlying(rawSymbol);
    const instrument = formatInstrument(rawSymbol);
    const tradeDate = parseDate(dateStr);

    const noteParts: string[] = [];
    if (optionInfo) {
      noteParts.push(`${optionInfo.underlying} ${optionInfo.expiry.slice(0, 2)}/${optionInfo.expiry.slice(2, 4)}/${optionInfo.expiry.slice(4, 6)} ${optionInfo.type} $${normalizeStrike(optionInfo.strike)}`);
    }
    noteParts.push(`Side: ${side}`);
    if (commission) noteParts.push(`Commission: $${commission.toFixed(2)}`);
    if (fees) noteParts.push(`Fees: $${fees.toFixed(2)}`);
    if (orderId) noteParts.push(`Order: ${orderId}`);

    trades.push({
      externalId: orderId,
      rawSymbol,
      symbol: underlying,
      instrument,
      assetClass,
      side: tradeSide,
      isClosingTrade: isClose,
      quantity: qty,
      entryPrice: isClose ? 0 : price,
      exitPrice: isClose ? price : 0,
      pnl,
      netAmount,
      fees,
      commission,
      orderId,
      status,
      entryDate: tradeDate,
      exitDate: tradeDate,
      notes: noteParts.join(" | "),
    });
  }

  console.log(`[TS Parser] Trades parsed: ${trades.length}`);
  // These two numbers MUST match
  if (trades.length !== dataRows.length) {
    const msg = `MISMATCH: ${dataRows.length} CSV rows but ${trades.length} trades parsed. ${dataRows.length - trades.length} rows were lost.`;
    console.error(`[TS Parser] ${msg}`);
    errors.push(msg);
  }

  trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

  return { trades, errors, accountInfo };
}
