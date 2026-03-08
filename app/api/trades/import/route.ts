import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTradeStationCSV } from "@/lib/parsers/tradestation";

interface ParsedTrade {
  symbol: string;
  side: string;
  assetClass: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  pnl: number;
  notes?: string;
  tags?: string[];
}

// Common column name mappings (case-insensitive)
const COLUMN_MAP: Record<string, string> = {
  symbol: "symbol", ticker: "symbol", instrument: "symbol",
  side: "side", direction: "side", "long/short": "side", longshort: "side",
  assetclass: "assetClass", "asset class": "assetClass", asset_class: "assetClass", "asset type": "assetClass", assettype: "assetClass",
  entryprice: "entryPrice", entry_price: "entryPrice", "entry price": "entryPrice", avgprice: "entryPrice", "avg price": "entryPrice", open: "entryPrice", "open price": "entryPrice",
  exitprice: "exitPrice", exit_price: "exitPrice", "exit price": "exitPrice", close: "exitPrice", "close price": "exitPrice",
  quantity: "quantity", qty: "quantity", shares: "quantity", contracts: "quantity", size: "quantity", amount: "quantity",
  entrydate: "entryDate", entry_date: "entryDate", "entry date": "entryDate", "open date": "entryDate", opendate: "entryDate", date: "entryDate",
  exitdate: "exitDate", exit_date: "exitDate", "exit date": "exitDate", "close date": "exitDate", closedate: "exitDate",
  pnl: "pnl", "p&l": "pnl", "p/l": "pnl", pl: "pnl", profit: "pnl", "profit/loss": "pnl", profitloss: "pnl", "profit loss": "pnl", "net p&l": "pnl", "net pnl": "pnl", "realized p&l": "pnl", "realized pnl": "pnl",
  notes: "notes", note: "notes", comment: "notes", comments: "notes",
  tags: "tags", tag: "tags", strategy: "tags",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(current.trim()); current = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(current.trim());
        if (row.some((c) => c !== "")) rows.push(row);
        row = []; current = "";
      } else { current += ch; }
    }
  }
  row.push(current.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function mapColumns(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().trim().replace(/[^a-z0-9/&\s]/g, "");
    if (COLUMN_MAP[key]) mapping[i] = COLUMN_MAP[key];
  });
  return mapping;
}

function parseSide(val: string): string {
  const lower = val.toLowerCase().trim();
  if (["long", "buy", "b"].includes(lower)) return "long";
  if (["short", "sell", "s"].includes(lower)) return "short";
  return "long";
}

function parseAssetClass(val: string): string {
  const lower = val.toLowerCase().trim();
  if (["stock", "stocks", "equity", "equities"].includes(lower)) return "stocks";
  if (["option", "options"].includes(lower)) return "options";
  if (["crypto", "cryptocurrency"].includes(lower)) return "crypto";
  if (["forex", "fx", "currency"].includes(lower)) return "forex";
  if (["future", "futures"].includes(lower)) return "futures";
  return "stocks";
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const parts = val.split(/[/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 100) return new Date(c, a - 1, b);
    if (a > 100) return new Date(a, b - 1, c);
  }
  return null;
}

function parseNumber(val: string): number {
  return parseFloat(val.replace(/[$,\s]/g, "")) || 0;
}

// ── TradeStation broker-specific import ─────────────────────────────
async function handleTradeStationImport(text: string, accountId: string) {
  const userId = accountId || "csv-import";
  const result = parseTradeStationCSV(text);

  if (result.trades.length === 0) {
    return NextResponse.json(
      { error: `No valid trades found.${result.errors.length > 0 ? ` ${result.errors.length} rows had errors.` : ""} Make sure this is a TradeStation Historical Activity Report CSV.`, errors: result.errors },
      { status: 400 }
    );
  }

  const created = await prisma.trade.createMany({
    data: result.trades.map((t) => ({
      userId,
      symbol: t.symbol,
      side: t.side,
      assetClass: t.assetClass,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      quantity: t.quantity,
      entryDate: t.entryDate,
      exitDate: t.exitDate,
      pnl: t.pnl,
      notes: t.notes || null,
      tags: [],
    })),
  });

  const accountNote = result.accountInfo
    ? ` (Account: ${result.accountInfo.account}, ${result.accountInfo.dateRange})`
    : "";

  return NextResponse.json({
    imported: created.count,
    errors: result.errors.length > 0 ? result.errors : undefined,
    message: `Successfully imported ${created.count} trade${created.count !== 1 ? "s" : ""} from TradeStation${accountNote}${result.errors.length > 0 ? `. ${result.errors.length} row(s) skipped.` : "."}`,
  });
}

// ── Generic CSV import ──────────────────────────────────────────────
async function handleGenericImport(text: string, accountId: string) {
  const rows = parseCSV(text);

  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  const [headers, ...dataRows] = rows;
  const colMap = mapColumns(headers);
  const mappedFields = new Set(Object.values(colMap));

  if (!mappedFields.has("symbol")) {
    return NextResponse.json(
      { error: "Could not find a 'Symbol' column. Expected columns: Symbol, Side, Entry Price, Exit Price, Quantity, Entry Date, Exit Date, P&L" },
      { status: 400 }
    );
  }

  const hasEntryPrice = mappedFields.has("entryPrice");
  const trades: ParsedTrade[] = [];
  const errors: string[] = [];
  const userId = accountId || "csv-import";

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2;
    const record: Record<string, string> = {};

    for (const [colIdx, fieldName] of Object.entries(colMap)) {
      record[fieldName] = row[Number(colIdx)] || "";
    }

    if (!record.symbol) { errors.push(`Row ${rowNum}: missing symbol`); continue; }

    const entryPrice = hasEntryPrice ? parseNumber(record.entryPrice) : 0;
    const exitPrice = parseNumber(record.exitPrice || "0");
    const quantity = parseNumber(record.quantity || "1");
    const entryDate = parseDate(record.entryDate || "") || new Date();
    const exitDate = parseDate(record.exitDate || "") || entryDate;

    let pnl: number;
    if (record.pnl) {
      pnl = parseNumber(record.pnl);
    } else if (entryPrice && exitPrice) {
      const side = parseSide(record.side || "long");
      pnl = side === "long" ? (exitPrice - entryPrice) * quantity : (entryPrice - exitPrice) * quantity;
    } else {
      pnl = 0;
    }

    trades.push({
      symbol: record.symbol.toUpperCase().trim(),
      side: parseSide(record.side || "long"),
      assetClass: parseAssetClass(record.assetClass || "stocks"),
      entryPrice, exitPrice, quantity,
      entryDate: entryDate.toISOString(),
      exitDate: exitDate.toISOString(),
      pnl,
      notes: record.notes || undefined,
      tags: record.tags ? record.tags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [],
    });
  }

  if (trades.length === 0) {
    return NextResponse.json(
      { error: `No valid trades found. ${errors.length} rows had errors.`, errors },
      { status: 400 }
    );
  }

  const created = await prisma.trade.createMany({
    data: trades.map((t) => ({
      userId,
      symbol: t.symbol,
      side: t.side,
      assetClass: t.assetClass,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      quantity: t.quantity,
      entryDate: new Date(t.entryDate),
      exitDate: new Date(t.exitDate),
      pnl: t.pnl,
      notes: t.notes || null,
      tags: t.tags || [],
    })),
  });

  return NextResponse.json({
    imported: created.count,
    errors: errors.length > 0 ? errors : undefined,
    message: `Successfully imported ${created.count} trade${created.count !== 1 ? "s" : ""}${errors.length > 0 ? `. ${errors.length} row(s) skipped.` : "."}`,
  });
}

// ── POST handler ────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const accountId = (formData.get("accountId") as string | null) || "csv-import";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    // Auto-detect TradeStation format by looking for their report header
    const isTradeStation = text.includes("TradeStation Historical Activity Report")
      || (text.includes("Order ID") && text.includes("Principal") && text.includes("Net Amount"));

    if (isTradeStation) {
      return handleTradeStationImport(text, accountId);
    }
    return handleGenericImport(text, accountId);
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 });
  }
}
