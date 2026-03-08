import { NextRequest, NextResponse } from "next/server";
import { analyzeNewTrade, regenerateAnalysis } from "@/lib/auto-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tradeId } = await params;
  const userId = "default"; // Auth not wired yet

  const { searchParams } = new URL(request.url);
  const regenerate = searchParams.get("regenerate") === "true";

  try {
    const autoNote = regenerate
      ? await regenerateAnalysis(tradeId, userId)
      : await analyzeNewTrade(tradeId, userId);

    return NextResponse.json({
      success: true,
      autoNote,
      autoNoteAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
