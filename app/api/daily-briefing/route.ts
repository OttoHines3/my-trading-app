import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDailyBriefing } from "@/lib/daily-briefing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const userId = "default";
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const regenerate = request.nextUrl.searchParams.get("regenerate") === "true";

    // Check for cached briefing
    if (!regenerate) {
      const existing = await prisma.dailyBriefing.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (existing) {
        return NextResponse.json({
          briefing: {
            content: existing.content,
            date: existing.date,
            vixLevel: existing.vixLevel,
            spyPrice: existing.spyPrice,
            createdAt: existing.createdAt,
          },
        });
      }
    }

    // Generate a new briefing
    const { content, vixLevel, spyPrice } =
      await generateDailyBriefing(userId);

    // Upsert so regenerate overwrites the existing row
    const saved = await prisma.dailyBriefing.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, content, vixLevel, spyPrice },
      update: { content, vixLevel, spyPrice },
    });

    return NextResponse.json({
      briefing: {
        content: saved.content,
        date: saved.date,
        vixLevel: saved.vixLevel,
        spyPrice: saved.spyPrice,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error("Daily briefing error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily briefing" },
      { status: 500 }
    );
  }
}
