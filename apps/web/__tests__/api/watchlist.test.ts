import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
  createdAt: string;
  quote: {
    price: string;
    change: string;
    pct: string;
    up: boolean;
  } | null;
}

interface WatchlistGetResponse {
  items: WatchlistItem[];
}

interface WatchlistPostResponse {
  item: {
    id: string;
    userId: string;
    symbol: string;
    notes: string | null;
    alertPrice: number | null;
    createdAt: string;
  };
}

describe("Phase 6 — Watchlist API (/api/watchlist)", () => {
  let createdId: string | null = null;

  it("GET /api/watchlist returns { items: [...] }", async () => {
    const res = await fetch(`${BASE}/api/watchlist`);
    expect(res.status).toBe(200);

    const data: WatchlistGetResponse = await res.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  it("POST /api/watchlist creates a new item", async () => {
    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "MSFT",
        notes: "Test entry",
        alertPrice: 450,
      }),
    });
    expect(res.status).toBe(201);

    const data: WatchlistPostResponse = await res.json();
    expect(data).toHaveProperty("item");
    expect(data.item.symbol).toBe("MSFT");
    expect(data.item.notes).toBe("Test entry");
    expect(data.item.alertPrice).toBe(450);
    expect(data.item).toHaveProperty("id");
    expect(typeof data.item.id).toBe("string");

    createdId = data.item.id;
  });

  it("POST /api/watchlist uppercases and trims symbol", async () => {
    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: " goog " }),
    });
    expect(res.status).toBe(201);

    const data: WatchlistPostResponse = await res.json();
    expect(data.item.symbol).toBe("GOOG");

    // Clean up
    await fetch(`${BASE}/api/watchlist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.item.id }),
    });
  });

  it("POST /api/watchlist rejects missing symbol", async () => {
    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "no symbol" }),
    });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("Symbol is required");
  });

  it("POST /api/watchlist rejects duplicate symbol", async () => {
    // MSFT was already added above
    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: "MSFT" }),
    });
    expect(res.status).toBe(409);

    const data = await res.json();
    expect(data.error).toBe("Symbol already in watchlist");
  });

  it("GET /api/watchlist includes newly added item with quote data", async () => {
    const res = await fetch(`${BASE}/api/watchlist`);
    expect(res.status).toBe(200);

    const data: WatchlistGetResponse = await res.json();
    const msft = data.items.find((i) => i.symbol === "MSFT");
    expect(msft).toBeDefined();
    expect(msft!.notes).toBe("Test entry");
    expect(msft!.alertPrice).toBe(450);

    // quote should be populated (live price from Finnhub)
    if (msft!.quote) {
      expect(msft!.quote).toHaveProperty("price");
      expect(msft!.quote).toHaveProperty("change");
      expect(msft!.quote).toHaveProperty("pct");
      expect(typeof msft!.quote.up).toBe("boolean");
    }
  });

  it("DELETE /api/watchlist removes item", async () => {
    expect(createdId).not.toBeNull();

    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: createdId }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify it's gone
    const listRes = await fetch(`${BASE}/api/watchlist`);
    const listData: WatchlistGetResponse = await listRes.json();
    const found = listData.items.find((i) => i.id === createdId);
    expect(found).toBeUndefined();
  });

  it("DELETE /api/watchlist rejects missing id", async () => {
    const res = await fetch(`${BASE}/api/watchlist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("ID is required");
  });
});
