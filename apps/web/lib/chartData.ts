const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_KEY || "";

export interface CandleData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch intraday candle data from Finnhub for a given symbol and date.
 * Resolution: "1" = 1min, "5" = 5min, "15" = 15min, "60" = 1hr, "D" = daily
 */
export async function getIntradayCandles(
  symbol: string,
  date: string, // YYYY-MM-DD
  resolution: string = "1"
): Promise<CandleData[]> {
  const dayStart = new Date(date + "T09:30:00");
  const dayEnd = new Date(date + "T16:00:00");

  const from = Math.floor(dayStart.getTime() / 1000);
  const to = Math.floor(dayEnd.getTime() / 1000);

  const url =
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${resolution}&from=${from}&to=${to}` +
    `&token=${FINNHUB_API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();

  if (data.s === "no_data" || !data.t) return [];

  return data.t.map((timestamp: number, i: number) => ({
    date: new Date(timestamp * 1000),
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}
