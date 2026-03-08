# AI Agent System Upgrades

Completed: 2026-03-08

## Summary

Upgraded the AI trading coach from basic context injection to a full agentic system with Claude tool use, persistent memory, proactive insights, post-trade auto-analysis, and an improved chat UI.

---

## Upgrade 1 — Claude Tool Use (10 New Tools)

**Created:** `lib/ai-tools.ts`

10 new tool definitions with executor functions:

| Tool | Description |
|------|-------------|
| `get_trades_by_filter` | Dynamic trade queries with date range, status, symbol, side, pattern, time-of-day, day-of-week, sorting |
| `calculate_metrics` | Performance metrics with groupBy (day/week/month/dayOfWeek/hour/pattern/symbol) |
| `get_pattern_performance` | Win rate, avg P&L, trade count by tag/pattern |
| `get_vix_correlation` | VIX correlation analysis (notes data limitation) |
| `get_time_of_day_analysis` | Performance by hour of day with configurable bucket size |
| `get_live_market_data` | Live quotes via Finnhub for any symbols |
| `get_day_detail` | Full stats + trades for a specific date |
| `get_recent_performance_trend` | Compare recent period vs previous/all-time |
| `flag_trade_for_review` | Mark trade for review with reason |
| `save_insight` | Save a TradingInsight to the database |

**Updated:** `lib/agents/tools.ts` — merged new tools into existing AGENT_TOOLS, updated executeTool to route to ai-tools fallback.

---

## Upgrade 2 — Persistent Agent Memory

**Created:** `lib/agent-memory.ts`

- `AgentMemoryData` interface — tracks strengths, weaknesses, patterns, findings, trader profile
- `loadMemory()` — fetches from AgentMemory table, formats for system prompt injection
- `updateMemory()` — uses Claude to extract learnings from conversation, upserts to DB
- Memory is loaded at start of every conversation and updated after every conversation

**Updated:** `app/api/agents/chat/route.ts` and `app/api/agents/stream/route.ts` — both now load memory into system prompt and save memory after conversation.

---

## Upgrade 3 — Daily Morning Briefing

**Created:**
- `lib/daily-briefing.ts` — generates AI briefing using day-of-week performance, recent 7-day stats, live VIX/SPY
- `app/api/daily-briefing/route.ts` — GET endpoint with caching per user+date, `?regenerate=true` support
- `components/dashboard/morning-briefing.tsx` — collapsible card with market data pills, dismiss, regenerate

**Updated:** `app/(dashboard)/page.tsx` — added MorningBriefing component at top of dashboard.

---

## Upgrade 4 — Post-Trade Auto Analysis

**Created:**
- `lib/auto-analysis.ts` — `analyzeNewTrade()` and `regenerateAnalysis()` using Claude to compare trade vs history
- `app/api/trades/[id]/auto-analysis/route.ts` — POST endpoint to trigger/regenerate analysis

**Updated:** `app/(dashboard)/trades/[id]/page.tsx` — added AutoNoteSection component with generate/regenerate buttons, loading state, timestamp.

---

## Upgrade 5 — Upgraded Chat UI

**Updated:** `components/agents/AgentChat.tsx`
- Markdown rendering via `react-markdown` + `remark-gfm` with dark theme components
- Tool call visualization — animated pill badges with friendly labels for 18 tool types
- Feedback buttons — thumbs up/down, save insight, regenerate (appear on hover)
- Per-role conversation starters (4 per agent type, 6 agent types)

**Updated:** `lib/stores/agent-chat.ts`
- Added `activeToolCalls` state for real-time tool tracking
- Rewrote `useSendMessage` to use streaming endpoint with SSE parsing
- Handles `text`, `tool_start`, `tool_end`, `done`, `error` events

---

## Upgrade 6 — Insights Page

**Created:**
- `app/(dashboard)/insights/page.tsx` — filterable card grid with category tabs, expand/collapse, feedback, delete
- `app/api/insights/route.ts` — GET/POST/DELETE for insights
- `app/api/insights/feedback/route.ts` — POST for thumbs up/down

**Updated:** `components/dashboard/sidebar.tsx` — added Insights nav link with Lightbulb icon.

---

## Upgrade 7 — Updated System Prompts

**Updated:** `lib/agents/prompts.ts`
- All 6 agent roles have new, more directive system prompts
- Added per-role conversation starters for the chat UI

---

## Database Schema Changes

**Updated:** `prisma/schema.prisma`

New models:
- `AgentMemory` — persistent memory per user+agent type
- `TradingInsight` — saved insights with feedback counters
- `DailyBriefing` — cached daily briefings per user+date

New fields on `Trade`:
- `autoNote` (String?) — AI-generated trade analysis
- `autoNoteAt` (DateTime?) — when analysis was generated
- `flaggedForReview` (Boolean) — flag for deeper review
- `flagReason` (String?) — reason for flagging

---

## New Dependencies

- `react-markdown` — markdown rendering in chat
- `remark-gfm` — GitHub Flavored Markdown support (tables, etc.)

---

## Files Changed/Created

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Updated (3 new models, 4 new Trade fields) |
| `types/index.ts` | Updated (new Trade fields) |
| `lib/ai-tools.ts` | **Created** (10 tool definitions + executors) |
| `lib/agent-memory.ts` | **Created** (persistent memory system) |
| `lib/daily-briefing.ts` | **Created** (morning briefing generator) |
| `lib/auto-analysis.ts` | **Created** (post-trade auto analysis) |
| `lib/agents/tools.ts` | Updated (merged new tools) |
| `lib/agents/prompts.ts` | Updated (new prompts + starters) |
| `lib/stores/agent-chat.ts` | Updated (streaming + tool tracking) |
| `components/agents/AgentChat.tsx` | Updated (markdown, tools, feedback, starters) |
| `components/dashboard/morning-briefing.tsx` | **Created** (briefing card) |
| `components/dashboard/sidebar.tsx` | Updated (Insights link) |
| `app/(dashboard)/page.tsx` | Updated (morning briefing) |
| `app/(dashboard)/insights/page.tsx` | **Created** (insights page) |
| `app/(dashboard)/trades/[id]/page.tsx` | Updated (auto-note section) |
| `app/api/agents/chat/route.ts` | Updated (memory integration) |
| `app/api/agents/stream/route.ts` | Updated (memory integration) |
| `app/api/agents/quick/route.ts` | Updated (type fix for new prompts) |
| `app/api/daily-briefing/route.ts` | **Created** |
| `app/api/insights/route.ts` | **Created** |
| `app/api/insights/feedback/route.ts` | **Created** |
| `app/api/trades/[id]/auto-analysis/route.ts` | **Created** |
