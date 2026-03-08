import { NextRequest, NextResponse } from "next/server";
import { finnhub } from "@/lib/finnhub";

const VALID_CATEGORIES = ["general", "forex", "crypto", "merger"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawCategory = searchParams.get("category") ?? "general";
    const category = VALID_CATEGORIES.includes(
      rawCategory as (typeof VALID_CATEGORIES)[number]
    )
      ? rawCategory
      : "general";

    const articles = await finnhub.news(category);
    return NextResponse.json(
      { articles: articles.slice(0, 30) },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
