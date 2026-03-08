import { NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

// Maps client-facing symbols to Finnhub symbols
const FINNHUB_SYMBOL_MAP: Record<string, string> = {
  BTCUSD: "BINANCE:BTCUSDT",
  VIX: "CBOE:VIX",
  DXY: "UUP",
};

const MOCK_QUOTES: Record<string, { price: string; change: string; pct: string; up: boolean }> = {
  SPY: { price: "524.18", change: "+1.24", pct: "+0.24%", up: true },
  QQQ: { price: "448.92", change: "+2.87", pct: "+0.64%", up: true },
  DXY: { price: "104.32", change: "-0.18", pct: "-0.17%", up: false },
  VIX: { price: "14.76", change: "+0.43", pct: "+3.00%", up: true },
  BTCUSD: { price: "68,420.50", change: "-324.10", pct: "-0.47%", up: false },
  GLD: { price: "218.54", change: "+0.92", pct: "+0.42%", up: true },
};

function formatPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(2);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") ?? Object.keys(MOCK_QUOTES);

  const results: Record<string, {
    price: string;
    change: string;
    pct: string;
    up: boolean;
    raw?: { c: number; d: number; dp: number };
  }> = {};

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const finnhubSymbol = FINNHUB_SYMBOL_MAP[symbol] ?? symbol;
      try {
        const quote = await finnhub.quote(finnhubSymbol);
        if (!quote.c || quote.c === 0) throw new Error("No data");
        const change = quote.d ?? 0;
        const pct = quote.dp ?? 0;
        results[symbol] = {
          price: formatPrice(quote.c),
          change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}`,
          pct: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
          up: change >= 0,
          raw: { c: quote.c, d: quote.d, dp: quote.dp },
        };
      } catch {
        results[symbol] = MOCK_QUOTES[symbol] ?? {
          price: "0.00",
          change: "0.00",
          pct: "0.00%",
          up: true,
        };
      }
    })
  );

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=15" },
  });
}
