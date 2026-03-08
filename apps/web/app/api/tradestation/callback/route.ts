import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, storeTokens } from "@/lib/tradestation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const desc = request.nextUrl.searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/portfolio?error=${encodeURIComponent(desc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/portfolio?error=No+authorization+code+received", request.url)
    );
  }

  try {
    const tokens = await exchangeCode(code);
    await storeTokens(tokens);
    return NextResponse.redirect(new URL("/portfolio", request.url));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(
      new URL(`/portfolio?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
