import { NextResponse } from "next/server";
import { tradestation } from "@/lib/tradestation";
import type { PortfolioSummary } from "@/types/tradestation";

export async function GET() {
  const connected = await tradestation.isConnected();
  if (!connected) {
    return NextResponse.json({
      connected: false,
      accounts: [],
      balances: [],
      positions: [],
      totalEquity: 0,
      totalPnL: 0,
      totalUnrealizedPnL: 0,
    } satisfies PortfolioSummary);
  }

  try {
    const accounts = await tradestation.accounts();
    const activeIds = accounts
      .filter((a) => a.Status === "Active")
      .map((a) => a.AccountID);

    if (activeIds.length === 0) {
      return NextResponse.json({
        connected: true,
        accounts,
        balances: [],
        positions: [],
        totalEquity: 0,
        totalPnL: 0,
        totalUnrealizedPnL: 0,
      } satisfies PortfolioSummary);
    }

    const [balances, positions] = await Promise.all([
      tradestation.balances(activeIds),
      tradestation.positions(activeIds),
    ]);

    const totalEquity = balances.reduce((sum, b) => sum + (b.Equity || 0), 0);
    const totalPnL = balances.reduce((sum, b) => sum + (b.TodaysProfitLoss || 0), 0);
    const totalUnrealizedPnL = positions.reduce(
      (sum, p) => sum + (p.UnrealizedProfitLoss || 0),
      0
    );

    return NextResponse.json({
      connected: true,
      accounts,
      balances,
      positions,
      totalEquity,
      totalPnL,
      totalUnrealizedPnL,
    } satisfies PortfolioSummary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
