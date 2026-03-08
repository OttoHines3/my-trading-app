# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal trading dashboard for tracking and analyzing trades. This is a **monorepo** containing:

- **apps/web** — Next.js 16 web dashboard (main application)
- **apps/api** — Python FastAPI backend (data processing, ML, external integrations)
- **apps/mobile** — Expo/React Native mobile app
- **packages/shared** — Shared TypeScript types and utilities

### Features

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

### Root (runs across all apps via Turborepo)
```bash
npm install           # Install all dependencies
npm run dev           # Start all apps in dev mode
npm run dev:web       # Start only web app (localhost:3000)
npm run dev:api       # Start only Python API (localhost:8000)
npm run dev:mobile    # Start only mobile app
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run test          # Test all apps
```

### Web App (apps/web)
```bash
cd apps/web
npm run dev                    # Start dev server (localhost:3000)
npx prisma migrate dev         # Run DB migrations
npx prisma studio              # Open Prisma DB GUI
npx prisma generate            # Regenerate Prisma client
```

### Python API (apps/api)
```bash
cd apps/api
pip install -e ".[dev]"        # Install dependencies
uvicorn src.main:app --reload  # Start dev server (localhost:8000)
pytest                         # Run tests
ruff check src                 # Lint
```

### Mobile App (apps/mobile)
```bash
cd apps/mobile
npm run dev           # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
```

## Environment Variables

### Web App (apps/web/.env.local)
- `DATABASE_URL` — Supabase pooled connection string (for Prisma)
- `DIRECT_URL` — Supabase direct connection string (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `FINNHUB_API_KEY` — Finnhub market data API key
- `TRADESTATION_CLIENT_ID` — TradeStation API key
- `TRADESTATION_CLIENT_SECRET` — TradeStation API secret
- `TRADESTATION_REDIRECT_URI` — OAuth callback URL
- `TRADESTATION_ENV` — `sim` or `live`

## Architecture

### Monorepo Structure
```
my-trading-app/
├── apps/
│   ├── web/           # Next.js dashboard
│   ├── api/           # Python FastAPI
│   └── mobile/        # Expo/React Native
├── packages/
│   └── shared/        # Shared types & utilities
├── package.json       # Root workspace config
└── turbo.json         # Turborepo config
```

### Web App Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma (PostgreSQL via Supabase), Zustand, Recharts + lightweight-charts.

**Routing**: All main app pages live under `apps/web/app/(dashboard)/` and share a layout (`Sidebar` + `Header`).

**Dashboard routes**: `/` (home), `/journal`, `/journal/new`, `/journal/[id]`, `/reports`, `/calendar`, `/news`, `/watchlist`, `/portfolio`, `/psychology`.

**Data layer**:
- `lib/prisma.ts` — singleton `PrismaClient`
- `lib/supabase.ts` — browser Supabase client via `@supabase/ssr`
- `lib/finnhub.ts` — typed Finnhub REST API wrapper
- `lib/tradestation.ts` — TradeStation API v3 wrapper with OAuth2

**Database models** (see `apps/web/prisma/schema.prisma`): `Trade`, `WatchlistItem`, `JournalEntry`. All scoped by `userId`.

### Shared Package
`packages/shared` exports types (`Trade`, `WatchlistItem`, `JournalEntry`) and utilities (`formatCurrency`, `calculatePnl`, `calculateWinRate`). Import as `@trading/shared`.

### Python API Stack
FastAPI, Pydantic, uvicorn. Use for data processing, ML models, or external API integrations.

### Mobile App Stack
Expo SDK 53, React Native 0.79, Expo Router v5. Shares types with web via `@trading/shared`.

**UI conventions**: Dark theme (`bg-gray-950` base, `bg-gray-900` cards, `border-gray-800` borders). `clsx` + `tailwind-merge` for class merging. `lucide-react` for icons.
