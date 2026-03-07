import { NextRequest, NextResponse } from "next/server";
import { finnhub, type FinnhubCalendarEvent } from "@/lib/finnhub";

function formatImpact(impact: string): string {
  switch (impact.toLowerCase()) {
    case "high": return "HIGH";
    case "medium": return "MED";
    case "low": return "LOW";
    default: return "LOW";
  }
}

function formatValue(val: number | string | null, unit: string): string {
  if (val === null || val === undefined) return "\u2014";
  return `${val}${unit ? unit : ""}`;
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const dayAfter = new Date(now.getTime() + 2 * 86_400_000).toISOString().split("T")[0];
    const weekOut = new Date(now.getTime() + 7 * 86_400_000).toISOString().split("T")[0];

    // ── Earnings calendar ──────────────────────────────────────────────
    if (type === "earnings") {
      const data = await finnhub.earningsCalendar(today, weekOut);
      const earnings = handleEarnings(
        Array.isArray(data.earningsCalendar) ? data.earningsCalendar : []
      );

      return NextResponse.json(
        { earnings },
        { headers: { "Cache-Control": "public, max-age=300" } }
      );
    }

    // ── Economic calendar (default) ────────────────────────────────────
    const tomorrow = new Date(now.getTime() + 86_400_000).toISOString().split("T")[0];

    const data = await finnhub.calendar(today, dayAfter);
    const rawEvents: FinnhubCalendarEvent[] = data.economicCalendar ?? [];

    // Filter to US events and format
    const usEvents = rawEvents
      .filter((e) => e.country === "US" || e.country === "us")
      .map((e) => {
        const eventDate = e.time?.split(" ")[0] ?? e.time;
        const eventTime = e.time?.includes(" ") ? e.time.split(" ")[1]?.slice(0, 5) : "\u2014";

        let day = "Today";
        if (eventDate === tomorrow) day = "Tomorrow";
        else if (eventDate !== today) day = eventDate;

        return {
          day,
          time: eventTime,
          name: e.event,
          impact: formatImpact(e.impact),
          forecast: formatValue(e.estimate, e.unit),
          previous: formatValue(e.prev, e.unit),
          country: e.country,
          datetime: e.time,
        };
      });

    // Find next upcoming event (for the NextEventCard)
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
