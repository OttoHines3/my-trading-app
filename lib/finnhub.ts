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

export const finnhub = {
  quote: (symbol: string) => get<{ c: number; d: number; dp: number }>("/quote", { symbol }),
  news: (category = "general") => get<{ headline: string; url: string; source: string; datetime: number }[]>("/news", { category }),
  calendar: () => get<{ economicCalendar: unknown[] }>("/calendar/economic"),
  earningsCalendar: (from: string, to: string) => get<{ earningsCalendar: unknown[] }>("/calendar/earnings", { from, to }),
};
