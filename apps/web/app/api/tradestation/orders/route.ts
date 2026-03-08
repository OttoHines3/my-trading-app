import { NextResponse } from "next/server";
import { tradestation } from "@/lib/tradestation";

export async function GET() {
  const connected = await tradestation.isConnected();
  if (!connected) {
    return NextResponse.json({ orders: [], connected: false });
  }

  try {
    const accounts = await tradestation.accounts();
    const activeIds = accounts
      .filter((a) => a.Status === "Active")
      .map((a) => a.AccountID);

    if (activeIds.length === 0) {
      return NextResponse.json({ orders: [], connected: true });
    }

    const orders = await tradestation.orders(activeIds);
    return NextResponse.json({ orders, connected: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
