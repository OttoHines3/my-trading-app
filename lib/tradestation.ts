import { cookies } from "next/headers";
import type {
  TSAccount,
  TSBalance,
  TSPosition,
  TSOrder,
  TSTokens,
} from "@/types/tradestation";

// --- Configuration ---
const TS_CLIENT_ID = process.env.TRADESTATION_CLIENT_ID!;
const TS_CLIENT_SECRET = process.env.TRADESTATION_CLIENT_SECRET!;
const TS_REDIRECT_URI = process.env.TRADESTATION_REDIRECT_URI || "http://localhost:3000/api/tradestation/callback";

// Toggle between sim and live
const TS_ENV = (process.env.TRADESTATION_ENV || "sim") as "sim" | "live";

const AUTH_URL = "https://signin.tradestation.com";
const API_BASE = TS_ENV === "live"
  ? "https://api.tradestation.com"
  : "https://sim-api.tradestation.com";

// --- Cookie-based token storage ---
const TOKEN_COOKIE = "ts_tokens";

export async function storeTokens(tokens: TSTokens) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year (refresh token is non-expiring)
  });
}

export async function getStoredTokens(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null> {
  const jar = await cookies();
  const raw = jar.get(TOKEN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
}

// --- OAuth helpers ---
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TS_CLIENT_ID,
    audience: "https://api.tradestation.com",
    redirect_uri: TS_REDIRECT_URI,
    scope: "openid profile offline_access MarketData ReadAccount Trade",
  });
  if (state) params.set("state", state);
  return `${AUTH_URL}/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<TSTokens> {
  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: TS_CLIENT_ID,
      client_secret: TS_CLIENT_SECRET,
      code,
      redirect_uri: TS_REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TSTokens>;
}

async function refreshAccessToken(refreshToken: string): Promise<TSTokens> {
  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: TS_CLIENT_ID,
      client_secret: TS_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TSTokens>;
}

// --- Authenticated fetch ---
async function getAccessToken(): Promise<string> {
  const stored = await getStoredTokens();
  if (!stored) throw new Error("Not connected to TradeStation");

  // Refresh if token expires within 2 minutes
  if (Date.now() > stored.expires_at - 120_000) {
    const newTokens = await refreshAccessToken(stored.refresh_token);
    await storeTokens(newTokens);
    return newTokens.access_token;
  }

  return stored.access_token;
}

async function tsGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TradeStation API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// --- API methods ---
export const tradestation = {
  isConnected: async (): Promise<boolean> => {
    const tokens = await getStoredTokens();
    return tokens !== null;
  },

  accounts: () =>
    tsGet<{ Accounts: TSAccount[] }>("/v3/brokerage/accounts")
      .then((r) => r.Accounts),

  balances: (accountIds: string[]) =>
    tsGet<{ Balances: TSBalance[] }>(
      `/v3/brokerage/accounts/${accountIds.join(",")}/balances`
    ).then((r) => r.Balances),

  positions: (accountIds: string[]) =>
    tsGet<{ Positions: TSPosition[] }>(
      `/v3/brokerage/accounts/${accountIds.join(",")}/positions`
    ).then((r) => r.Positions),

  orders: (accountIds: string[]) =>
    tsGet<{ Orders: TSOrder[] }>(
      `/v3/brokerage/accounts/${accountIds.join(",")}/orders`
    ).then((r) => r.Orders),
};
