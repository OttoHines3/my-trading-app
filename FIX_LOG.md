# AI Agent Fix Log

## Fix Date: 2026-03-08

---

## Issue 1 — AI Chat stops after first message (CRITICAL)

**Root Cause:** `streamAgent()` in `lib/agents/executor.ts` had no agentic loop. It made a single streaming API call, executed tools at `content_block_stop`, but **never fed tool results back to Claude**. After executing tools, it simply yielded `{ type: "done" }` — Claude never got to see the tool results and generate its final text response.

Additionally, the `partial_json` accumulation was a no-op comment (line 231), so tool inputs were always `{}`, causing tools to run with empty parameters even if the loop had worked.

**Fix:** Rewrote `streamAgent()` to use a proper agentic while-loop (matching the pattern already used in `executeAgent()`):
1. Makes a non-streaming API call per iteration
2. If response has tool_use blocks: yields `tool_start` events, executes tools, yields `tool_end` events, appends assistant+tool_result messages to conversation, loops
3. If response is `end_turn`: streams the final text word-by-word, yields `done` with the full message
4. Max 10 iterations safety limit

Each `tool_start` and `tool_end` event now includes `name` at the top level (not just nested in `toolCall`) so the client can parse it directly.

**File changed:** `lib/agents/executor.ts`

---

## Issue 2 — Insights page is empty

**Root Cause:** Two API mismatches:

1. **Save Insight button** in `AgentChat.tsx` sent `{ content: messageContent }` but `POST /api/insights` requires `{ title, content, category, agentType }`. The API returned 400 every time.

2. **Feedback buttons** sent `{ type, content }` but `POST /api/insights/feedback` requires `{ insightId, type }`. There's no insightId available on a chat message, so feedback on chat messages was always failing.

**Fix:**
- Updated `handleSaveInsight` to extract a title from the first non-empty line (stripped of markdown), and send all required fields: `{ title, content, category: "recommendation", agentType }`.
- Updated `FeedbackButtons` to accept `agentType` prop and pass it through.
- Made `handleFeedback` a no-op for chat messages (feedback makes sense on saved insights, not raw messages). The thumbs up/down on the insights page itself already works correctly.

**Files changed:** `components/agents/AgentChat.tsx`

---

## Issue 3 — Tool call badges not showing in UI

**Root Cause:** The client-side SSE parser in `lib/stores/agent-chat.ts` checked for `event.name` on `tool_start` and `tool_end` events, but the server was emitting `{ type: "tool_start", toolCall: { name } }` — the name was nested inside `toolCall`, not at the top level.

**Fix:** Two changes:
1. Updated `streamAgent()` to include `name` at the top level of both `tool_start` and `tool_end` events.
2. Updated the client parser to check `event.name || event.toolCall?.name` as a fallback for both formats.

Also simplified the loading indicator logic in `AgentChat.tsx` — the previous condition using `.some()` was overly complex and could incorrectly hide the loading state.

**Files changed:** `lib/stores/agent-chat.ts`, `components/agents/AgentChat.tsx`

---

## Summary of all files changed

| File | Changes |
|------|---------|
| `lib/agents/executor.ts` | Rewrote `streamAgent()` with agentic tool loop, proper tool result feedback, word-by-word text streaming, top-level `name` on events |
| `lib/stores/agent-chat.ts` | Fixed SSE event parsing to read `event.name \|\| event.toolCall?.name` |
| `components/agents/AgentChat.tsx` | Fixed save insight to send required fields, simplified loading indicator, passed agentType to feedback buttons |
