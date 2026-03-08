import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const USER_ID = "default";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");

    const where: { userId: string; category?: string } = { userId: USER_ID };
    if (category) {
      where.category = category;
    }

    const insights = await prisma.tradingInsight.findMany({
      where,
      orderBy: { savedAt: "desc" },
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights GET error:", error);
    return NextResponse.json({ insights: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, agentType, relatedTradeIds } = body as {
      title?: string;
      content?: string;
      category?: string;
      agentType?: string;
      relatedTradeIds?: string[];
    };

    if (!title || !content || !category || !agentType) {
      return NextResponse.json(
        { error: "title, content, category, and agentType are required" },
        { status: 400 }
      );
    }

    const insight = await prisma.tradingInsight.create({
      data: {
        userId: USER_ID,
        title,
        content,
        category,
        agentType,
        relatedTrades: relatedTradeIds ?? [],
      },
    });

    return NextResponse.json({ insight }, { status: 201 });
  } catch (error) {
    console.error("Insights POST error:", error);
    return NextResponse.json(
      { error: "Failed to create insight" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.tradingInsight.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Insights DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete insight" },
      { status: 500 }
    );
  }
}
