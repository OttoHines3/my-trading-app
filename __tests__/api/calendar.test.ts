import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

interface EconomicEvent {
  day: string;
  time: string;
  name: string;
  impact: string;
  forecast: string;
  previous: string;
  country: string;
  datetime: string;
}

interface CalendarResponse {
  events: EconomicEvent[];
  nextEvent: EconomicEvent | null;
}

interface EarningsEntry {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number | null;
  year: number | null;
}

interface EarningsResponse {
  earnings: EarningsEntry[];
}

describe("Phase 7 — Calendar API (/api/calendar)", () => {
  describe("Economic calendar (default)", () => {
    it("GET /api/calendar returns { events: [...], nextEvent }", async () => {
      const res = await fetch(`${BASE}/api/calendar`);
      expect(res.status).toBe(200);

      const data: CalendarResponse = await res.json();
      expect(data).toHaveProperty("events");
      expect(Array.isArray(data.events)).toBe(true);
      expect(data).toHaveProperty("nextEvent");
    });

    it("economic events (if any) have required shape", async () => {
      const res = await fetch(`${BASE}/api/calendar`);
      const data: CalendarResponse = await res.json();

      for (const event of data.events) {
        expect(event).toHaveProperty("day");
        expect(typeof event.day).toBe("string");

        expect(event).toHaveProperty("time");
        expect(typeof event.time).toBe("string");

        expect(event).toHaveProperty("name");
        expect(typeof event.name).toBe("string");

        expect(event).toHaveProperty("impact");
        expect(["HIGH", "MED", "LOW"]).toContain(event.impact);

        expect(event).toHaveProperty("forecast");
        expect(event).toHaveProperty("previous");
        expect(event).toHaveProperty("country");
      }
    });

    it("nextEvent is null or has impact field", async () => {
      const res = await fetch(`${BASE}/api/calendar`);
      const data: CalendarResponse = await res.json();

      if (data.nextEvent !== null) {
        expect(data.nextEvent).toHaveProperty("impact");
        expect(["HIGH", "MED", "LOW"]).toContain(data.nextEvent.impact);
        expect(data.nextEvent).toHaveProperty("name");
      }
    });
  });

  describe("Earnings calendar", () => {
    it("GET /api/calendar?type=earnings returns { earnings: [...] }", async () => {
      const res = await fetch(`${BASE}/api/calendar?type=earnings`);
      expect(res.status).toBe(200);

      const data: EarningsResponse = await res.json();
      expect(data).toHaveProperty("earnings");
      expect(Array.isArray(data.earnings)).toBe(true);
      expect(data.earnings.length).toBeGreaterThan(0);
    });

    it("each earnings entry has required fields", async () => {
      const res = await fetch(`${BASE}/api/calendar?type=earnings`);
      const data: EarningsResponse = await res.json();

      for (const entry of data.earnings.slice(0, 10)) {
        expect(entry).toHaveProperty("symbol");
        expect(typeof entry.symbol).toBe("string");
        expect(entry.symbol.length).toBeGreaterThan(0);

        expect(entry).toHaveProperty("date");
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        expect(entry).toHaveProperty("hour");
        expect(typeof entry.hour).toBe("string");

        expect(entry).toHaveProperty("epsEstimate");
        expect(entry).toHaveProperty("epsActual");
        expect(entry).toHaveProperty("revenueEstimate");
        expect(entry).toHaveProperty("revenueActual");
        expect(entry).toHaveProperty("quarter");
        expect(entry).toHaveProperty("year");
      }
    });

    it("earnings 'hour' field is mapped to readable format", async () => {
      const res = await fetch(`${BASE}/api/calendar?type=earnings`);
      const data: EarningsResponse = await res.json();
      const validHours = ["Before Open", "After Close", "\u2014", ""];

      for (const entry of data.earnings.slice(0, 10)) {
        expect(validHours).toContain(entry.hour);
      }
    });
  });
});
