import { NextRequest, NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

function formatImpact(impact: string): string {
  switch (impact.toLowerCase()) {
    case "high": return "HIGH";
    case "medium": return "MED";
    case "low": return "LOW";
    default: return "LOW";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleEarnings(raw: any[]) {
  return raw.map((e) => ({
    symbol: e.symbol ?? "—",
    date: e.date ?? "—",
    hour: e.hour === "bmo" ? "Before Open" : e.hour === "amc" ? "After Close" : e.hour ?? "—",
    epsEstimate: e.epsEstimate != null ? Number(e.epsEstimate) : null,
    epsActual: e.epsActual != null ? Number(e.epsActual) : null,
    revenueEstimate: e.revenueEstimate != null ? Number(e.revenueEstimate) : null,
    revenueActual: e.revenueActual != null ? Number(e.revenueActual) : null,
    quarter: e.quarter ?? null,
    year: e.year ?? null,
  }));
}

// ── ForexFactory / FairEconomy free economic calendar ───────────────────────
// Finnhub's /calendar/economic requires a paid plan.
// This free API provides this-week data from ForexFactory.
interface FFEvent {
  title: string;
  country: string;
  date: string;     // ISO 8601 e.g. "2026-03-10T10:00:00-05:00"
  impact: string;   // "High" | "Medium" | "Low" | "Holiday"
  forecast: string;
  previous: string;
}

const FF_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

// In-memory cache to avoid rate limiting (10 min TTL)
let cachedEvents: FFEvent[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchEconomicEvents(): Promise<FFEvent[]> {
  if (cachedEvents && Date.now() - cacheTime < CACHE_TTL) {
    return cachedEvents;
  }

  const res = await fetch(FF_CALENDAR_URL, {
    headers: { "User-Agent": "TradeDesk/1.0" },
    cache: "no-store",
  });
  if (!res.ok) {
    // Return stale cache if available, otherwise throw
    if (cachedEvents) return cachedEvents;
    throw new Error(`FairEconomy API error: ${res.status}`);
  }

  cachedEvents = await res.json() as FFEvent[];
  cacheTime = Date.now();
  return cachedEvents;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 86_400_000).toISOString().split("T")[0];

    // Use query params if provided, otherwise default to today-based ranges
    const from = searchParams.get("from") || today;
    const to = searchParams.get("to") || new Date(new Date(from).getTime() + 7 * 86_400_000).toISOString().split("T")[0];

    // ── Earnings calendar (Finnhub — free tier) ────────────────────────
    if (type === "earnings") {
      const data = await finnhub.earningsCalendar(from, to);
      const earnings = handleEarnings(
        Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
      );

      return NextResponse.json(
        { earnings },
        { headers: { "Cache-Control": "public, max-age=300" } }
      );
    }

    // ── Economic calendar (FairEconomy — free) ─────────────────────────
    const allEvents = await fetchEconomicEvents();

    // Filter to USD events within the requested date range
    const usEvents = allEvents
      .filter((e) => e.country === "USD")
      .filter((e) => {
        const eventDate = e.date.split("T")[0];
        return eventDate >= from && eventDate <= to;
      })
      .filter((e) => e.impact.toLowerCase() !== "holiday")
      .map((e) => {
        const dt = new Date(e.date);
        const eventDate = dt.toISOString().split("T")[0];
        const eventTime = dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        let day: string;
        if (eventDate === today) day = "Today";
        else if (eventDate === tomorrow) day = "Tomorrow";
        else {
          day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        }

        return {
          day,
          time: eventTime,
          name: e.title,
          impact: formatImpact(e.impact),
          forecast: e.forecast || "\u2014",
          previous: e.previous || "\u2014",
          country: "US",
          datetime: e.date,
        };
      });

    const nextEvent = usEvents.find((e) => e.impact === "HIGH") ?? usEvents[0] ?? null;

    return NextResponse.json(
      { events: usEvents, nextEvent },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch {
    if (type === "earnings") {
      return NextResponse.json({ earnings: [] });
    }
    return NextResponse.json({ events: [], nextEvent: null });
  }
}
