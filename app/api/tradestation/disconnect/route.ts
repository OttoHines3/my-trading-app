import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/tradestation";

export async function POST() {
  await clearTokens();
  return NextResponse.json({ disconnected: true });
}
