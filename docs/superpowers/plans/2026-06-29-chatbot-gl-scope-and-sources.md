# Chatbot GL Scope and Related Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: User requested immediate inline execution and explicitly requested no new tests. Use verification-before-completion before claiming completion.

**Goal:** Make AI chat handle casual/general conversation while staying GL-oriented, and hide related-data controls when no displayable related data exists.

**Architecture:** Add a small server-side scope classifier before SQL generation. GL data questions continue through the existing database-backed flow; casual/general questions skip SQL and store `context: null`. Harden context extraction and UI guards so empty/invalid context does not show related-data buttons.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, MiniMax chat API, Drizzle/Neon read-only query flow.

## Global Constraints

- UI copy and user-facing errors are Thai-first.
- Do not add new automated tests for this change per user request.
- Run `npm run check` after implementation.
- Do not expose secrets or database credentials.

---

### Task 1: Add chat scope classifier and casual prompt

**Files:**
- Create: `src/lib/server/chat/scope.ts`
- Modify: `src/routes/api/chat/conversations/[id]/messages/+server.ts`

**Interfaces:**
- Produces: `classifyChatScope(message: string): 'data' | 'general'`
- Produces: `buildGeneralChatPrompt(message: string): string`

**Steps:**
- Create `scope.ts` with keyword-based classification that treats greetings and clearly non-data conversation as `general`, while preserving GL data terms such as ตอน, link, ซีรีส์, นักแสดง, ตารางฉาย, ดู, platform as `data`.
- In POST handler, after recent context is loaded, route `general` messages to `callMiniMax` with the general-chat prompt.
- Append casual exchange with `context: null`.
- Return `{ reply, suggestions: [], context: null }`.

### Task 2: Harden related context extraction

**Files:**
- Modify: `src/lib/server/chat/context-extract.ts`

**Interfaces:**
- Keep `buildChatContext(sql, rows)` return type unchanged.

**Steps:**
- For `schedule` context, extract only `series_id` first.
- For `artist` context, prefer `artist_id`, then `id`.
- For `series` context, prefer `series_id`, then `id`.
- Return `null` if no valid UUID for that context type exists.

### Task 3: Hide empty related-data controls in UI

**Files:**
- Modify: `src/lib/components/chat/ChatApp.svelte`

**Steps:**
- Add `hasContextItems(ctx)` based on `getContextCount(ctx) > 0`.
- Use it when computing `latestContext`.
- Use it before rendering header and per-message related-data buttons.
- Ignore `selectPreviewContext` calls for empty contexts.

### Task 4: Verify

**Files:**
- No source changes.

**Steps:**
- Run `npm run check`.
- Manually review changed files for TypeScript/Svelte syntax and behavior alignment.
