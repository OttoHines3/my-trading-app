# Trading App Roadmap

## Legend
- [x] Done
- [-] In progress / scaffolded but not wired up
- [ ] Not started

---

## Phase 1 — Foundation
- [x] Next.js 16 App Router project setup (TypeScript, Tailwind CSS v4)
- [x] Supabase integration (`lib/supabase.ts`)
- [x] Prisma schema with `Trade`, `WatchlistItem`, `JournalEntry` models
- [x] Finnhub API wrapper (`lib/finnhub.ts`) with typed `quote()`, `news()`, `calendar()`, `earningsCalendar()`
- [x] Shared utilities: `formatters.ts`, `calculations.ts`, `lib/utils.ts` (cn helper)
- [x] Shared types (`types/index.ts`) mirroring Prisma models
- [x] Dashboard layout: collapsible `Sidebar` + `TickerBar` (v0 command center design)
- [x] All routes scaffolded under `app/(dashboard)/`
- [x] GitHub Actions CI setup
- [x] v0 Trading Command Center UI integrated (dark theme, CSS variables, card-glow, dot pattern)

---

## Phase 2 — Authentication
- [ ] Supabase Auth — sign up / sign in / sign out
- [ ] Auth middleware to protect dashboard routes
- [ ] User session in header (avatar, logout button)
- [ ] Redirect unauthenticated users to login page

---

## Phase 3 — Trade Journal (Core Feature)
- [-] Journal list page (`/journal`) — UI shell exists, no data fetching
- [-] New trade form (`/journal/new`) — route exists, form not built
- [-] Trade detail page (`/journal/[id]`) — route exists, not built
- [ ] API route: `POST /api/trades` — create trade
- [x] API route: `GET /api/trades` — list trades for user
- [ ] API route: `GET /api/trades/[id]` — single trade
- [ ] API route: `PATCH /api/trades/[id]` — update trade
- [ ] API route: `DELETE /api/trades/[id]` — delete trade
- [ ] Trade form fields: symbol, side, asset class, entry/exit price, quantity, dates, P&L auto-calc, tags, notes
- [ ] Screenshot upload (Supabase Storage)
- [ ] Trade list with sorting and filtering (by date, symbol, side, asset class)
- [ ] Trade detail view with full info and screenshot

---

## Phase 4 — Dashboard (Real Data)
- [x] v0 Trading Command Center dashboard UI with stat cards, charts, ticker bar
- [x] Wire up Total P&L from real trade data (via `/api/dashboard-stats`)
- [x] Wire up Win Rate from real trade data (via `/api/dashboard-stats`)
- [x] Wire up Trades Today from real trade data (via `/api/dashboard-stats`)
- [-] Open Positions count (widget exists, needs TradeStation wiring)
- [x] Recent trades table on dashboard (fetches from `/api/trades`)
- [x] P&L sparkline mini chart (cumulative, from Prisma data)
- [x] Live ticker bar with Finnhub quotes (auto-refreshes every 30s)
- [x] Market overview with SPY quote + mini market row (QQQ, DXY, VIX, BTC)
- [x] SPY candlestick chart (demo data — needs premium API for live intraday)
- [x] Economic calendar on dashboard (FairEconomy/ForexFactory API, with dynamic day grouping)
- [x] News feed on dashboard (from Finnhub, linked to articles)
- [x] Mock data fallbacks for all components when API is unavailable
- [x] Editable widget-based dashboard (12-column CSS grid, edit mode, widget library modal, localStorage persistence)
- [x] 35 widgets: 17 stats, 7 charts, 5 composite, 4 market (all self-contained with mock fallbacks)
- [x] Widget registry with lazy loading via `next/dynamic`
- [x] Zustand store for dashboard layout with localStorage persist
- [x] Advanced calculation utilities (expectancy, streaks, drawdown, distribution, etc.)

---

## Phase 5 — Analytics
- [-] Page scaffolded, PerformanceCalendar component wired up
- [x] Trading Performance Calendar (monthly grid with daily P&L, win rate, weekly summaries)
- [x] Widget data API endpoint (`/api/widget-data`) — serves stats, daily P&L, by-weekday, by-hour, by-asset-class, by-symbol, drawdown, distribution via `?fields=` param; mock fallback on error
- [ ] Cumulative P&L curve chart (Recharts or lightweight-charts)
- [ ] P&L by day / week / month bar chart
- [ ] Win/loss ratio breakdown
- [ ] Performance by asset class
- [ ] Performance by symbol (top gainers / losers)
- [ ] Average winner vs average loser
- [ ] Date range filter

---

## Phase 6 — Watchlist
- [x] Page scaffolded, shows "Coming soon"
- [x] API route: `GET/POST/DELETE /api/watchlist`
- [x] Display watchlist with live prices via Finnhub `quote()`
- [x] Add/remove symbols
- [x] Notes per symbol
- [x] Price alert field — highlight when price hits alert level
- [x] Auto-refresh prices on interval

---

## Phase 7 — Calendar
- [x] Page scaffolded, shows "Coming soon"
- [x] Economic calendar API route (`/api/calendar`) via FairEconomy (free), with date range params and in-memory cache
- [x] Earnings calendar feed via `finnhub.earningsCalendar()`
- [x] Full-page calendar grid or list view with event details
- [x] Filter by impact level (high / medium / low)

---

## Phase 8 — News
- [x] Page scaffolded, shows "Coming soon"
- [x] News API route (`/api/news`) via Finnhub — enhanced with `?category=` param, returns up to 30 articles
- [x] Full-page news feed with headline, source, timestamp, and link
- [x] Filter by category (general, forex, crypto, merger)
- [x] Auto-refresh on interval (every 2 minutes)

---

## Phase 9 — Psychology Journal
- [-] Page scaffolded, shows "Coming soon"
- [ ] API route: `GET/POST/PATCH /api/psychology`
- [ ] Daily mood entry form (1-5 scale + notes + market bias)
- [ ] History list of past entries
- [ ] Mood trend chart over time (correlate mood score with P&L)
- [ ] Prevent duplicate entries per day (schema already enforces `@unique` on date)

---

## Phase 10 — Brokerage Integration (TradeStation)
- [x] TradeStation API v3 typed wrapper (`lib/tradestation.ts`)
- [x] OAuth2 authorization code flow (auth + callback + disconnect routes)
- [x] Token management via httpOnly cookies (auto-refresh)
- [x] Portfolio API route — aggregated accounts, balances, positions
- [x] Orders API route
- [x] Portfolio page — connect prompt, account cards, positions table
- [x] Sidebar nav link for Portfolio
- [x] Sim/Live environment toggle via `TRADESTATION_ENV`
- [ ] Stream real-time position updates (WebSocket)
- [ ] Wire TradeStation open positions count into dashboard stat cards
- [ ] Order placement UI
- [ ] Trade history sync (import closed trades to Trade Journal)

---

## Phase 11 — Polish & Quality
- [x] Display Mode Switcher (dollar, %, privacy, R-multiple, ticks, pips, points) with Zustand persist
- [ ] Loading skeletons for all data-fetching pages
- [ ] Error states and empty states throughout
- [ ] Mobile responsiveness audit
- [x] Page titles / metadata (TradeDesk — Command Center)
- [ ] Toast notifications for CRUD actions
- [ ] Confirmation dialogs for destructive actions (delete trade, etc.)
- [x] Dark mode — full v0 command center theme applied
