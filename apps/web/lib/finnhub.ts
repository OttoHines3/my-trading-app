const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY!;
const BASE_URL = "https://finnhub.io/api/v1";

async function get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("token", FINNHUB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Finnhub error: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
}

export interface FinnhubNewsItem {
  headline: string;
  url: string;
  source: string;
  datetime: number;
  summary?: string;
  image?: string;
  category?: string;
}

export interface FinnhubCalendarEvent {
  actual: number | string | null;
  country: string;
  estimate: number | string | null;
  event: string;
  impact: string;
  prev: number | string | null;
  time: string;
  unit: string;
}

export const finnhub = {
  quote: (symbol: string) =>
    get<FinnhubQuote>("/quote", { symbol }),

  news: (category = "general") =>
    get<FinnhubNewsItem[]>("/news", { category }),

  calendar: (from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return get<{ economicCalendar: FinnhubCalendarEvent[] }>("/calendar/economic", params);
  },

  earningsCalendar: (from: string, to: string) =>
    get<{ earningsCalendar: unknown[] }>("/calendar/earnings", { from, to }),
};
