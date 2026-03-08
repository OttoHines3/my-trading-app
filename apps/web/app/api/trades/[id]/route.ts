import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const trade = await prisma.trade.findUnique({ where: { id } });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...trade,
      entryDate: trade.entryDate.toISOString(),
      exitDate: trade.exitDate.toISOString(),
      createdAt: trade.createdAt.toISOString(),
      updatedAt: trade.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Trade fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 });
  }
}
