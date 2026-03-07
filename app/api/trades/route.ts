import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  try {
    // TODO: filter by userId once auth is implemented
    const trades = await prisma.trade.findMany({
      orderBy: { exitDate: "desc" },
      take: limit,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error("Trades fetch error:", error);
    return NextResponse.json({ trades: [] });
  }
}
