import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

export async function GET() {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
    });

    // Batch-fetch live quotes for all symbols
    let quotes: Record<
      string,
      { price: string; change: string; pct: string; up: boolean; raw?: { c: number; d: number; dp: number } }
    > = {};

    if (items.length > 0) {
      const symbols = items.map((i) => i.symbol).join(",");
      try {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const res = await fetch(`${base}/api/quotes?symbols=${symbols}`, {
          cache: "no-store",
        });
        if (res.ok) {
          quotes = await res.json();
        }
      } catch (e) {
        console.error("Quote fetch error:", e);
      }
    }

    const enriched = items.map((item) => ({
      ...item,
      quote: quotes[item.symbol] ?? null,
    }));

    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, notes, alertPrice } = body as {
      symbol?: string;
      notes?: string;
      alertPrice?: number;
    };

    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId: USER_ID,
        symbol: symbol.toUpperCase().trim(),
        notes: notes ?? null,
        alertPrice: alertPrice ?? null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate symbol)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Symbol already in watchlist" },
        { status: 409 }
      );
    }
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.watchlistItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Watchlist DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
