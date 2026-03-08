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
- [x] API route: `GET /api/trades/[id]` — single trade
- [ ] API route: `PATCH /api/trades/[id]` — update trade
- [ ] API route: `DELETE /api/trades/[id]` — delete trade
- [ ] Trade form fields: symbol, side, asset class, entry/exit price, quantity, dates, P&L auto-calc, tags, notes
- [ ] Screenshot upload (Supabase Storage)
- [x] Trade list with sorting and filtering (by date, symbol, side, asset class)
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
- [x] Two-section dashboard layout: top stat cards row (5 equal columns) + bottom medium widgets area, separated by dashed divider (TradeZella-style)
- [x] Section-aware widget library modal (top section → stats only, bottom section → charts/composite/market)
- [x] Drag-and-drop widget reordering in edit mode (HTML5 DnD, visual drop indicators)
- [x] Grid auto-rows with minimum heights (`minmax(140px, auto)`) for consistent widget sizing
- [x] 36 widgets: 17 stats, 8 charts, 5 composite, 4 market (all self-contained with mock fallbacks)
- [x] Widget registry with lazy loading via `next/dynamic`
- [x] Zustand store for dashboard layout with localStorage persist (v4 migration)
- [x] Advanced calculation utilities (expectancy, streaks, drawdown, distribution, etc.)

---

## Phase 5 — Analytics & Reports (merged)
- [x] Combined analytics + reports into single `/reports` page ("Analytics & Reports")
- [x] Performance Calendar moved to dashboard widget (`performance-calendar`, 7-col chart widget, compact size fits beside medium widget)
- [x] Widget data API endpoint (`/api/widget-data`) — serves stats, daily P&L, by-weekday, by-hour, by-asset-class, by-symbol, drawdown, distribution via `?fields=` param; mock fallback on error
- [x] Tabbed layout (Performance, Overview, Compare, Calendar)
- [x] Report calculation utilities (`lib/utils/report-calculations.ts`)
- [x] Performance tab: Cumulative P&L chart, Avg Daily Win/Loss chart, Performance Summary Grid
- [x] Overview tab: summary stats + Monthly P&L bar chart
- [x] Compare tab: first-half vs second-half period comparison
- [x] Calendar tab: daily P&L grouped by month with color-coded cells
- [x] Export PDF button component (html2canvas + jsPDF)
- [x] FilterBar integration for all report tabs

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
- [x] CSV trade import (`/api/trades/import`) — auto-detects common broker column names, bulk creates Trade records
- [x] TradeStation CSV parser (`lib/parsers/tradestation.ts`) — 1:1 row-to-trade mapping, Order ID as externalId, handles options symbols, normalized strike prices, no fake times
- [x] CSV upload UI on portfolio page (drag-and-drop, file picker, broker selector) as alternative to TradeStation sync
- [x] Duplicate import prevention via `externalId` (Order ID) upsert
- [x] Multi-account system — Zustand store (`lib/stores/trading-accounts.ts`), account naming modal after import, account switcher dropdown with checkboxes (All accounts / individual), manage/rename/delete accounts
- [ ] Trade history sync (import closed trades from TradeStation to Trade Journal)

---

## Phase 11 — Shared Filters & Trade View
- [x] Global filter store (`lib/stores/trade-filters.ts`) — Zustand + persist, filters across all pages
- [x] Filter UI components: FilterBar (inline dropdown), FilterPanel (dropdown with categories), DateRangePicker (custom dark dual-calendar)
- [x] Filter parsing utility (`lib/utils/parse-filters.ts`) — Prisma `where` + JS time filters
- [x] API routes updated with filter/pagination/sorting support (`/api/trades`, `/api/widget-data`, `/api/dashboard-stats`)
- [x] Widget fetch hook (`lib/hooks/use-widget-fetch.ts`)
- [x] Trade View page (`/trades`) with summary cards, sortable table, pagination
- [x] Enhanced trade summary cards (Net P&L sparkline, Profit Factor gauge, Win % semicircle, Avg Win/Loss bar)
- [x] Configurable trade table columns with Zustand store + localStorage persistence
- [x] Column Selector modal (checkbox grid, All/None/Default quick select)
- [x] Checkbox column for bulk selection, gear icon, row click navigation to `/trades/[id]`
- [x] Single Trade Detail page (`/trades/[id]`) with header, tabs, stats panel, chart placeholder
- [x] Prev/next trade navigation arrows on trade detail page
- [x] AG Charts Enterprise candlestick chart on trade detail page (entry/exit markers, timeframe selector, dark theme)
- [x] AG Charts sparkline on trade stats panel (replaced Recharts)
- [x] Finnhub candle data API route (`/api/candles`) with resolution support
- [x] Sidebar "Trade View" nav link
- [x] DayDetailModal rows clickable → navigate to `/trades/[id]`
- [x] Dashboard templates (create, rename, duplicate, delete, switch) with v1→v2 store migration
- [x] Trade model extended: `strategy`, `commissions`, `reviewed`, `tradeRating` fields

---

## Phase 12 — Polish & Quality
- [x] Display Mode Switcher (dollar, %, privacy, R-multiple, ticks, pips, points) with Zustand persist
- [ ] Loading skeletons for all data-fetching pages
- [ ] Error states and empty states throughout
- [ ] Mobile responsiveness audit
- [x] Page titles / metadata (TradeDesk — Command Center)
- [ ] Toast notifications for CRUD actions
- [ ] Confirmation dialogs for destructive actions (delete trade, etc.)
- [x] Dark mode — full v0 command center theme applied
