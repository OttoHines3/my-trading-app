import { NextResponse } from "next/server";
import { getIntradayCandles } from "@/lib/chartData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const date = searchParams.get("date");
  const resolution = searchParams.get("resolution") || "1";

  if (!symbol || !date) {
    return NextResponse.json({ error: "symbol and date required" }, { status: 400 });
  }

  try {
    const candles = await getIntradayCandles(symbol, date, resolution);
    return NextResponse.json({ candles });
  } catch (error) {
    console.error("Candle fetch error:", error);
    return NextResponse.json({ candles: [] });
  }
}
