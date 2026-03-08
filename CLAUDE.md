# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal trading dashboard for tracking and analyzing trades. Features:

- **Dashboard** — summary stats (P&L, win rate, trades this week, open positions)
- **Trade Journal** — log trades with entry/exit prices, P&L, tags, notes, screenshots
- **Analytics** — performance charts (Recharts + lightweight-charts)
- **Watchlist** — track symbols with notes and price alerts
- **Calendar** — economic and earnings calendar via Finnhub
- **News** — market news feed via Finnhub
- **Portfolio** — live TradeStation brokerage integration (positions, balances, P&L via OAuth2)
- **Psychology** — mood journaling (1–5 scale) with market bias notes

The app is early-stage — pages are scaffolded but most don't have real data wired up yet.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open Prisma DB GUI
npx prisma generate      # Regenerate Prisma client after schema changes
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Supabase pooled connection string (for Prisma)
- `DIRECT_URL` — Supabase direct connection string (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `FINNHUB_API_KEY` — Finnhub market data API key
- `TRADESTATION_CLIENT_ID` — TradeStation API key (from developer portal)
- `TRADESTATION_CLIENT_SECRET` — TradeStation API secret
- `TRADESTATION_REDIRECT_URI` — OAuth callback URL (default: `http://localhost:3000/api/tradestation/callback`)
- `TRADESTATION_ENV` — `sim` or `live` (default: `sim`)

## Architecture

**Stack**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma (PostgreSQL via Supabase), Zustand, Recharts + lightweight-charts.

**Routing**: All main app pages live under `app/(dashboard)/` and share a layout (`Sidebar` + `Header`). The root `app/page.tsx` is a landing/redirect page separate from the dashboard group.

**Dashboard routes**: `/` (home), `/journal`, `/journal/new`, `/journal/[id]`, `/reports` (Analytics & Reports), `/calendar`, `/news`, `/watchlist`, `/portfolio`, `/psychology`.

**Data layer**:
- `lib/prisma.ts` — singleton `PrismaClient` (standard dev hot-reload guard)
- `lib/supabase.ts` — browser Supabase client via `@supabase/ssr` (used for auth)
- `lib/finnhub.ts` — typed wrapper around the Finnhub REST API with 60s Next.js revalidation; exposes `finnhub.quote()`, `finnhub.news()`, `finnhub.calendar()`, `finnhub.earningsCalendar()`
- `lib/tradestation.ts` — TradeStation API v3 wrapper with OAuth2 token management; stores tokens in httpOnly cookies; exposes `tradestation.accounts()`, `.balances()`, `.positions()`, `.orders()`
- `lib/utils/formatters.ts` and `lib/utils/calculations.ts` — shared utilities

**Database models** (see `prisma/schema.prisma`): `Trade`, `WatchlistItem`, `JournalEntry`. All rows are scoped by `userId` (Supabase auth UID). `Trade.side` is `"long" | "short"`, `Trade.assetClass` is `"stocks" | "options" | "crypto" | "forex" | "futures"`.

**Shared types**: `types/index.ts` — `Trade`, `WatchlistItem`, `JournalEntry` interfaces plus `TradeSide` and `AssetClass` type aliases. These mirror the Prisma models but use `string` for dates (API serialization).

**UI conventions**: Dark theme (`bg-gray-950` base, `bg-gray-900` cards, `border-gray-800` borders). `clsx` + `tailwind-merge` for conditional class merging. `lucide-react` for icons.
