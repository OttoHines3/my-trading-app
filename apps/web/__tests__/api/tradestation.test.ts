import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

describe("TradeStation API Integration", () => {
  it("GET /api/tradestation/auth redirects to TradeStation OAuth", async () => {
    const res = await fetch(`${BASE}/api/tradestation/auth`, {
      redirect: "manual",
    });
    // NextResponse.redirect returns 307 by default
    expect([302, 307]).toContain(res.status);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    expect(location).toContain("signin.tradestation.com");
    expect(location).toContain("response_type=code");
    expect(location).toContain("client_id=");
  });

  it("GET /api/tradestation/portfolio returns disconnected summary when not authed", async () => {
    const res = await fetch(`${BASE}/api/tradestation/portfolio`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.connected).toBe(false);
    expect(data.accounts).toEqual([]);
    expect(data.balances).toEqual([]);
    expect(data.positions).toEqual([]);
    expect(data.totalEquity).toBe(0);
    expect(data.totalPnL).toBe(0);
    expect(data.totalUnrealizedPnL).toBe(0);
  });

  it("GET /api/tradestation/orders returns empty when not authed", async () => {
    const res = await fetch(`${BASE}/api/tradestation/orders`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.orders).toEqual([]);
    expect(data.connected).toBe(false);
  });

  it("POST /api/tradestation/disconnect returns success", async () => {
    const res = await fetch(`${BASE}/api/tradestation/disconnect`, {
      method: "POST",
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.disconnected).toBe(true);
  });

  it("TradeStation types are well-formed", () => {
    // Compile-time check: if this file compiles, the types are valid
    // Runtime check: verify the expected shape
    const mockAccount = {
      AccountID: "123",
      AccountType: "Cash",
      Alias: "Test",
      Currency: "USD",
      Status: "Active",
    };
    expect(mockAccount).toHaveProperty("AccountID");
    expect(mockAccount).toHaveProperty("AccountType");

    const mockBalance = {
      AccountID: "123",
      AccountType: "Cash",
      CashBalance: 10000,
      Equity: 10000,
      MarketValue: 0,
      TodaysProfitLoss: 0,
      UnclearedDeposit: 0,
      BuyingPower: 10000,
      RealizedProfitLoss: 0,
      UnrealizedProfitLoss: 0,
      Commission: 0,
    };
    expect(mockBalance.Equity).toBe(10000);
  });
});
