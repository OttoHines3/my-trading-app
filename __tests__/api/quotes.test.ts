import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

interface QuoteResult {
  price: string;
  change: string;
  pct: string;
  up: boolean;
  raw?: { c: number; d: number; dp: number };
}

describe("Live Quotes API (/api/quotes)", () => {
  it("GET /api/quotes returns default symbols (SPY, QQQ, etc.)", async () => {
    const res = await fetch(`${BASE}/api/quotes`);
    expect(res.status).toBe(200);

    const data: Record<string, QuoteResult> = await res.json();
    expect(typeof data).toBe("object");

    const expectedSymbols = ["SPY", "QQQ", "DXY", "VIX", "BTCUSD", "GLD"];
    for (const sym of expectedSymbols) {
      expect(data).toHaveProperty(sym);
    }
  });

  it("each quote has price, change, pct, up fields", async () => {
    const res = await fetch(`${BASE}/api/quotes`);
    const data: Record<string, QuoteResult> = await res.json();

    for (const [symbol, quote] of Object.entries(data)) {
      expect(quote).toHaveProperty("price");
      expect(typeof quote.price).toBe("string");
      expect(quote.price).not.toBe("");

      expect(quote).toHaveProperty("change");
      expect(typeof quote.change).toBe("string");

      expect(quote).toHaveProperty("pct");
      expect(typeof quote.pct).toBe("string");
      expect(quote.pct).toMatch(/%$/);

      expect(quote).toHaveProperty("up");
      expect(typeof quote.up).toBe("boolean");

      // If Finnhub returned live data, raw should be present
      if (quote.raw) {
        expect(typeof quote.raw.c).toBe("number");
        expect(typeof quote.raw.d).toBe("number");
        expect(typeof quote.raw.dp).toBe("number");
      }
    }
  });

  it("GET /api/quotes?symbols=AAPL returns only AAPL", async () => {
    const res = await fetch(`${BASE}/api/quotes?symbols=AAPL`);
    expect(res.status).toBe(200);

    const data: Record<string, QuoteResult> = await res.json();
    expect(Object.keys(data)).toContain("AAPL");

    const aapl = data.AAPL;
    expect(aapl).toHaveProperty("price");
    expect(aapl).toHaveProperty("pct");
  });

  it("GET /api/quotes?symbols=AAPL,TSLA returns both", async () => {
    const res = await fetch(`${BASE}/api/quotes?symbols=AAPL,TSLA`);
    expect(res.status).toBe(200);

    const data: Record<string, QuoteResult> = await res.json();
    expect(Object.keys(data)).toContain("AAPL");
    expect(Object.keys(data)).toContain("TSLA");
  });

  it("live SPY quote has a realistic price (> $100)", async () => {
    const res = await fetch(`${BASE}/api/quotes?symbols=SPY`);
    const data: Record<string, QuoteResult> = await res.json();
    const spy = data.SPY;

    const numericPrice = parseFloat(spy.price.replace(/,/g, ""));
    expect(numericPrice).toBeGreaterThan(100);
  });
});
