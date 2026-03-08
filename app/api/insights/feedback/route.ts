import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightId, type } = body as {
      insightId?: string;
      type?: "thumbsUp" | "thumbsDown";
    };

    if (!insightId || !type) {
      return NextResponse.json(
        { error: "insightId and type are required" },
        { status: 400 }
      );
    }

    if (type !== "thumbsUp" && type !== "thumbsDown") {
      return NextResponse.json(
        { error: 'type must be "thumbsUp" or "thumbsDown"' },
        { status: 400 }
      );
    }

    const insight = await prisma.tradingInsight.update({
      where: { id: insightId },
      data: {
        [type]: { increment: 1 },
      },
    });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Insights feedback error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
