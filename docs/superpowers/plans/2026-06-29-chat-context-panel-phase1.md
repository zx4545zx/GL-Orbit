# Chat Context Side Panel — Phase 1 (series) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เมื่อ AI chat bot ตอบเกี่ยวกับซีรีส์ ให้แสดง context (grid/detail) ใน panel แบบเต็มจอ (มือถือ) / drawer ขวา (desktop) โดยใช้ component ร่วมกับหน้า /explore/series และหน้า series detail

**Architecture:** Backend สกัด entity type + id จาก SQL/rows ที่มีอยู่แล้ว (ไม่เพิ่ม LLM call) แล้วส่ง `context` ใน response. Frontend สกัด card/detail เป็น component ร่วม, สร้าง panel shell, เรียบเรียง header (profile ย้ายเข้า sidebar, ปุ่ม panel ขึ้นมุมขวาบน). Phase 1 เชื่อม type='series' ครบทั้งสาย; type='artist'/'schedule' ไว้ Phase 2/3.

**Tech Stack:** SvelteKit 2, Svelte 5 Runes, TypeScript strict (NodeNext, import `.js`), Drizzle ORM via `getDb()`, vitest, Tailwind v4

## Global Constraints

- UI ภาษาไทยทั้งหมด (label/error/empty/loading)
- Svelte 5 Runes เท่านั้น (`$state`/`$derived`/`$props`/`$effect`); ห้าม `export let`
- Server files (`+page.server.ts`, `+server.ts`) ใช้ `getDb()` เท่านั้น ไม่ใช่ `db` proxy
- import ทุกไฟล์ต้องมีนามสกุล `.js`
- ทุก chat endpoint ต้องเช็ค `locals.user` (401 ถ้าไม่ login)
- ห้ามแตะ `src/routes/(chat)/+layout.svelte` (เพิ่งแก้ keyboard gap)
- Source-level regression test pattern: อ่าน source ด้วย `readFileSync` แล้ว `expect(content)...` (เหมือนไฟล์ test ที่มี)

## File Structure (Phase 1)

Create:
- `src/lib/server/chat/context-extract.ts` — pure: classify type + extract ids from SQL/rows
- `src/lib/server/chat/context-extract.test.ts`
- `src/routes/api/chat/context/+server.ts` — `POST { type, ids }` → series detail array
- `src/routes/api/chat/context/server.test.ts`
- `src/lib/components/chat/ChatContext.ts` — shared client types
- `src/lib/components/SeriesPosterCard.svelte` — reusable poster card (from explore)
- `src/lib/components/SeriesDetailPanel.svelte` — detail sections in a scroll container
- `src/lib/components/chat/ChatContextPanel.svelte` — overlay/drawer shell + content switch

Modify:
- `src/routes/api/chat-series/+server.ts` — return `context` in response
- `src/lib/server/chat/schema-context.ts` — add rule "SELECT id" to SQL_GENERATION_PROMPT
- `src/routes/api/chat-series/server.test.ts` — assert `context` field
- `src/routes/(app)/explore/series/+page.svelte` — use `SeriesPosterCard`
- `src/lib/components/chat/ChatApp.svelte` — store `context`, header reorg, wire `ChatContextPanel`

---

## Task 1: Entity extraction module (pure)

**Files:**
- Create: `src/lib/server/chat/context-extract.ts`
- Test: `src/lib/server/chat/context-extract.test.ts`

**Interfaces:**
- Produces: `ChatContext` type, `classifyContextType(sql): 'schedule'|'artist'|'series'|null`, `extractEntityIds(rows): string[]`, `buildChatContext(sql, rows): ChatContext`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/server/chat/context-extract.test.ts
import { describe, it, expect } from 'vitest';
import { classifyContextType, extractEntityIds, buildChatContext } from './context-extract.js';

const UUID = '11111111-1111-1111-1111-111111111111';

describe('classifyContextType', () => {
	it('detects schedule when SQL touches episode_schedules', () => {
		expect(classifyContextType('SELECT * FROM series s JOIN episode_schedules e ON e.series_id = s.id')).toBe('schedule');
	});
	it('detects schedule when SQL touches series_schedules', () => {
		expect(classifyContextType('SELECT * FROM series_schedules')).toBe('schedule');
	});
	it('detects artist when SQL touches artists (and not schedules)', () => {
		expect(classifyContextType('SELECT * FROM artists a JOIN series_artists sa ON sa.artist_id = a.id')).toBe('artist');
	});
	it('detects series otherwise', () => {
		expect(classifyContextType('SELECT * FROM series WHERE deleted_at IS NULL')).toBe('series');
	});
	it('returns null when no relevant table', () => {
		expect(classifyContextType("SELECT 'OUT_OF_SCOPE' AS status")).toBeNull();
	});
});

describe('extractEntityIds', () => {
	it('collects id / series_id / artist_id uuids', () => {
		const rows = [
			{ id: UUID, title: 'A' },
			{ series_id: '22222222-2222-2222-2222-222222222222' },
			{ artist_id: 'not-a-uuid' }
		];
		expect(extractEntityIds(rows)).toEqual([UUID, '22222222-2222-2222-2222-222222222222']);
	});
	it('dedupes and ignores non-uuid', () => {
		expect(extractEntityIds([{ id: UUID }, { id: UUID }, { id: 'x' }])).toEqual([UUID]);
	});
	it('returns empty for empty rows', () => {
		expect(extractEntityIds([])).toEqual([]);
	});
});

describe('buildChatContext', () => {
	it('builds schedule context with seriesIds', () => {
		const ctx = buildChatContext('SELECT series_id FROM episode_schedules', [{ series_id: UUID }]);
		expect(ctx).toEqual({ type: 'schedule', seriesIds: [UUID] });
	});
	it('builds series context', () => {
		const ctx = buildChatContext('SELECT id FROM series', [{ id: UUID }]);
		expect(ctx).toEqual({ type: 'series', seriesIds: [UUID] });
	});
	it('returns null when no type', () => {
		expect(buildChatContext("SELECT 'OUT_OF_SCOPE' AS status", [])).toBeNull();
	});
	it('returns null when type found but no valid ids', () => {
		expect(buildChatContext('SELECT id FROM series', [{ id: 'bad' }])).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/server/chat/context-extract.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/server/chat/context-extract.ts
export type ChatContext =
	| { type: 'schedule'; seriesIds: string[] }
	| { type: 'artist'; artistIds: string[] }
	| { type: 'series'; seriesIds: string[] }
	| null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_KEYS = new Set(['id', 'series_id', 'artist_id']);

export function classifyContextType(sql: string): 'schedule' | 'artist' | 'series' | null {
	const lower = sql.toLowerCase();
	if (/\b(episode_schedules|series_schedules)\b/.test(lower)) return 'schedule';
	if (/\bartists\b/.test(lower)) return 'artist';
	if (/\bseries\b/.test(lower)) return 'series';
	return null;
}

export function extractEntityIds(rows: Record<string, unknown>[]): string[] {
	const ids = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			if (ID_KEYS.has(key.toLowerCase())) {
				const val = row[key];
				if (typeof val === 'string' && UUID_RE.test(val)) ids.add(val);
			}
		}
	}
	return [...ids];
}

export function buildChatContext(sql: string, rows: Record<string, unknown>[]): ChatContext {
	const type = classifyContextType(sql);
	if (!type) return null;
	const ids = extractEntityIds(rows);
	if (ids.length === 0) return null;
	if (type === 'schedule') return { type: 'schedule', seriesIds: ids };
	if (type === 'artist') return { type: 'artist', artistIds: ids };
	return { type: 'series', seriesIds: ids };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/server/chat/context-extract.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/chat/context-extract.ts src/lib/server/chat/context-extract.test.ts
git commit -m "feat(chat): add entity context extraction module"
```

---

## Task 2: Wire context into chat-series response

**Files:**
- Modify: `src/routes/api/chat-series/+server.ts` (success return ~line 84, out-of-scope return ~line 71)
- Modify: `src/lib/server/chat/schema-context.ts` (`SQL_GENERATION_PROMPT` rules)
- Test: `src/routes/api/chat-series/server.test.ts` (assert `context` field exists)

**Interfaces:**
- Consumes: `buildChatContext(sql, rows)` from Task 1
- Produces: response now `{ reply, conversationId, context }`

- [ ] **Step 1: Add SQL prompt rule (TDD-ish: prompt change, hard to unit test — verified by endpoint behavior)**

In `src/lib/server/chat/schema-context.ts`, add a new rule after rule 8 (the LIMIT rule):

```
8.5. ถ้าคำถามเกี่ยวกับซีรีส์/ศิลปิน/ตารางฉาย ให้ SELECT คอลัมน์ id ของ entity หลักด้วยเสมอ (series.id / artists.id) โดยใช้ชื่อ alias เป็น "id" ถ้าทำได้ เพื่อให้ระบบแสดงข้อมูลเพิ่มเติมได้
```

- [ ] **Step 2: Update the failing endpoint test**

Add a test to `src/routes/api/chat-series/server.test.ts` asserting the success response includes a `context` field. If the existing test for "stores a conversation exchange" already mocks the safe-SQL path, add:

```ts
it('includes a context field in the success response', async () => {
	// reuse the existing "runs safe SQL" test setup; assert the resolved body has `context`
	// context may be null or an object — assert the key exists
	const body = await resolvedResponseBody; // from existing test harness
	expect(body).toHaveProperty('context');
});
```

If the existing test mocks SQL returning a row with a UUID `id`, strengthen to:
```ts
expect(body.context).not.toBeNull();
expect(body.context.type).toBe('series');
```

Run: `npx vitest run src/routes/api/chat-series/server.test.ts`
Expected: FAIL (no `context` field returned yet).

- [ ] **Step 3: Implement — add context to response**

In `src/routes/api/chat-series/+server.ts`:

1. Add import at top:
```ts
import { buildChatContext } from '$lib/server/chat/context-extract.js';
```

2. Out-of-scope return (~line 71) — add `context: null`:
```ts
return json({ reply: OUT_OF_SCOPE_REPLY, conversationId: conversation.id, context: null });
```

3. Success block — compute context before `appendChatExchange`:
```ts
const rows = convertUtcTimestamps(await runReadOnlyQuery(safeSql.sql));
const context = buildChatContext(safeSql.sql, rows as Record<string, unknown>[]);
const reply = await callMiniMax([ /* unchanged */ ]);

await appendChatExchange(locals.user.id, conversation.id, message, reply);
return json({ reply, conversationId: conversation.id, context });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/routes/api/chat-series/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Type check**

Run: `npm run check`
Expected: `svelte-check found 0 errors` (warnings pre-existing, OK).

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/chat-series/+server.ts src/lib/server/chat/schema-context.ts src/routes/api/chat-series/server.test.ts
git commit -m "feat(chat): return entity context in chat response"
```

---

## Task 3: Context endpoint (series branch)

**Files:**
- Create: `src/routes/api/chat/context/+server.ts`
- Test: `src/routes/api/chat/context/server.test.ts`

**Interfaces:**
- Consumes: `getSeriesDetail(id)` from `$lib/server/queries/series-detail.js`
- Produces: `POST { type:'series', ids } → { type:'series', items: SeriesDetail[] }`

- [ ] **Step 1: Write the failing test**

```ts
// src/routes/api/chat/context/server.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/queries/series-detail.js', () => ({
	getSeriesDetail: vi.fn()
}));

const { GET_NOT_NEEDED, POST } = await import('./+server.js');
const { getSeriesDetail } = await import('$lib/server/queries/series-detail.js');

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

function makeRequest(body: unknown) {
	return new Request('http://localhost/api/chat/context', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

describe('POST /api/chat/context', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 401 when not logged in', async () => {
		const res = await POST({ locals: { user: null }, request: makeRequest({ type: 'series', ids: [VALID_UUID] }) } as never);
		expect(res.status).toBe(401);
	});

	it('returns 400 for invalid type', async () => {
		const res = await POST({ locals: { user: { id: 'u' } }, request: makeRequest({ type: 'movie', ids: [VALID_UUID] }) } as never);
		expect(res.status).toBe(400);
	});

	it('returns 400 for invalid uuid', async () => {
		const res = await POST({ locals: { user: { id: 'u' } }, request: makeRequest({ type: 'series', ids: ['not-a-uuid'] }) } as never);
		expect(res.status).toBe(400);
	});

	it('returns series items for valid request', async () => {
		(getSeriesDetail as any).mockResolvedValue({ id: VALID_UUID, titleEn: 'X' });
		const res = await POST({ locals: { user: { id: 'u' } }, request: makeRequest({ type: 'series', ids: [VALID_UUID] }) } as never);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.type).toBe('series');
		expect(body.items).toHaveLength(1);
		expect(getSeriesDetail).toHaveBeenCalledWith(VALID_UUID);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes/api/chat/context/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/routes/api/chat/context/+server.ts
import { json } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import type { RequestHandler } from './$types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 20;

function parseBody(body: unknown): { type: string; ids: string[] } | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as { type?: unknown; ids?: unknown };
	if (typeof b.type !== 'string' || !Array.isArray(b.ids)) return null;
	const ids = b.ids.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x));
	return { type: b.type, ids };
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const parsed = parseBody(body);
	if (!parsed || parsed.ids.length === 0 || parsed.ids.length > MAX_IDS) {
		return json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
	}

	if (parsed.type === 'series') {
		const items = (await Promise.all(parsed.ids.map((id) => getSeriesDetail(id)))).filter((x): x is NonNullable<typeof x> => x !== null);
		return json({ type: 'series', items });
	}

	// artist + schedule branches ship in Phase 2 / Phase 3
	return json({ error: 'ยังไม่รองรับประเภทนี้' }, { status: 400 });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/routes/api/chat/context/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/chat/context/+server.ts src/routes/api/chat/context/server.test.ts
git commit -m "feat(chat): add context endpoint (series branch)"
```

---

## Task 4: Extract SeriesPosterCard

**Files:**
- Create: `src/lib/components/SeriesPosterCard.svelte`
- Modify: `src/routes/(app)/explore/series/+page.svelte` (replace inline card ~lines 167-188)
- Test: `src/lib/components/SeriesPosterCard.test.ts`

**Interfaces:**
- Consumes: `SeriesListItem` from `$lib/server/series/listing.js`
- Produces: `<SeriesPosterCard {item} />` (href defaults to `/series/{item.id}`)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/SeriesPosterCard.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/lib/components/SeriesPosterCard.svelte', 'utf-8');

describe('SeriesPosterCard', () => {
	it('accepts a SeriesListItem prop via runes', () => {
		expect(source).toContain('let { item');
		expect(source).toContain('$props()');
	});
	it('links to the series detail page', () => {
		expect(source).toContain('/series/');
	});
});
```

Also add to explore regression:
```ts
// src/routes/(app)/explore/series/series-card.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const page = readFileSync('src/routes/(app)/explore/series/+page.svelte', 'utf-8');
describe('explore/series uses SeriesPosterCard', () => {
	it('imports and renders SeriesPosterCard instead of inline card', () => {
		expect(page).toContain('SeriesPosterCard');
	});
});
```

Run: `npx vitest run src/lib/components/SeriesPosterCard.test.ts src/routes/(app)/explore/series/series-card.test.ts`
Expected: FAIL.

- [ ] **Step 2: Create the component**

```svelte
<!-- src/lib/components/SeriesPosterCard.svelte -->
<script lang="ts">
	import type { SeriesListItem } from '$lib/server/series/listing.js';

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	let { item, href = `/series/${item.id}` }: { item: SeriesListItem; href?: string } = $props();
	const badge = $derived(statusConfig[item.status] ?? statusConfig.ENDED);
</script>

<a {href} class="group">
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
		<div class="relative aspect-[3/4] overflow-hidden">
			<img src={item.poster} alt={item.title} width={400} height={533} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
			<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
			<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
				<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {badge.class}">{badge.text}</span>
			</div>
			<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
				<p class="text-white/70 text-xs sm:text-sm mb-1">{item.studio}</p>
				<h3 class="text-white font-bold text-lg sm:text-xl mb-1 line-clamp-1">{item.title}</h3>
				{#if item.subtitle}<p class="text-white/80 text-xs sm:text-sm line-clamp-1">{item.subtitle}</p>{/if}
			</div>
		</div>
	</div>
</a>
```

- [ ] **Step 3: Swap into explore/series**

In `src/routes/(app)/explore/series/+page.svelte`:
- Add import: `import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';`
- Replace the inline `<a href="/series/{s.id}" class="group"> ... </a>` block (the `{#each allSeries as s}` card) with:
```svelte
{#each allSeries as s (s.id)}
	<SeriesPosterCard item={s} />
{/each}
```
- Remove the now-unused `statusConfig` from the page (it moved into the component).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/components/SeriesPosterCard.test.ts src/routes/(app)/explore/series/series-card.test.ts`
Expected: PASS.

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SeriesPosterCard.svelte src/lib/components/SeriesPosterCard.test.ts src/routes/(app)/explore/series/+page.svelte src/routes/(app)/explore/series/series-card.test.ts
git commit -m "refactor(explore): extract SeriesPosterCard component"
```

---

## Task 5: Extract SeriesDetailPanel

**Files:**
- Create: `src/lib/components/SeriesDetailPanel.svelte`
- Test: `src/lib/components/SeriesDetailPanel.test.ts`

**Interfaces:**
- Consumes: `SeriesDetail` from `$lib/server/queries/series-detail.js`
- Produces: `<SeriesDetailPanel {detail} />` — scrollable Hero+Artists+Schedule, with a `fullHref` link button

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/SeriesDetailPanel.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/lib/components/SeriesDetailPanel.svelte', 'utf-8');

describe('SeriesDetailPanel', () => {
	it('accepts a SeriesDetail prop', () => {
		expect(source).toContain('SeriesDetail');
		expect(source).toContain('$props()');
	});
	it('renders a "ดูหน้าเต็ม" link to the series page', () => {
		expect(source).toContain('ดูหน้าเต็ม');
		expect(source).toContain('detail.id');
	});
});
```

Run: `npx vitest run src/lib/components/SeriesDetailPanel.test.ts`
Expected: FAIL.

- [ ] **Step 2: Create the component**

Copy the Hero + Artists grid + Schedule sections from `src/routes/(app)/series/[id]/+page.svelte` into `src/lib/components/SeriesDetailPanel.svelte`. The component contract:

```svelte
<!-- src/lib/components/SeriesDetailPanel.svelte -->
<script lang="ts">
	import type { SeriesDetail } from '$lib/server/queries/series-detail.js';

	let { detail }: { detail: SeriesDetail } = $props();
	let expandedEpisodes = $state<Set<number>>(new Set());

	function toggleEpisode(n: number) {
		const next = new Set(expandedEpisodes);
		next.has(n) ? next.delete(n) : next.add(n);
		expandedEpisodes = next;
	}
</script>

<div class="flex h-full flex-col">
	<!-- header with title + "ดูหน้าเต็ม" button -->
	<div class="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
		<h2 class="truncate text-sm font-bold text-plum">{detail.titleTh || detail.titleEn}</h2>
		<a href={`/series/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">
			ดูหน้าเต็ม
		</a>
	</div>

	<!-- scrollable body: paste Hero + Artists grid + Schedule markup from series/[id]/+page.svelte here -->
	<div class="flex-1 overflow-y-auto overscroll-y-contain">
		<!-- Hero: poster + status + studio/year + title/desc + genres + stats + platform chips -->
		<!-- Artists grid (links remain /artists/{id}) -->
		<!-- Schedule: collapsible per-episode rows, wired to toggleEpisode/expandedEpisodes -->
	</div>
</div>
```

Action: open `src/routes/(app)/series/[id]/+page.svelte`, copy the three section markup blocks verbatim into the `<!-- ... -->` area, keep all class names and bindings, keep internal `<a href="/artists/{a.id}">` links as full-page links (they navigate out of the panel — acceptable in Phase 1).

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/lib/components/SeriesDetailPanel.test.ts`
Expected: PASS.
Run: `npm run check` → 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/SeriesDetailPanel.svelte src/lib/components/SeriesDetailPanel.test.ts
git commit -m "feat(chat): extract SeriesDetailPanel component"
```

---

## Task 6: ChatContextPanel shell

**Files:**
- Create: `src/lib/components/chat/ChatContext.ts` (shared client types)
- Create: `src/lib/components/chat/ChatContextPanel.svelte`
- Test: `src/lib/components/chat/ChatContextPanel.test.ts`

**Interfaces:**
- Consumes (props): `{ context: ChatContextPayload | null; onClose: () => void }` where `ChatContextPayload` mirrors server `context`
- Produces: overlay (mobile) / drawer (lg+) that fetches `/api/chat/context` and renders series (Phase 1)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/chat/ChatContextPanel.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/lib/components/chat/ChatContextPanel.svelte', 'utf-8');

describe('ChatContextPanel', () => {
	it('accepts context + onClose props', () => {
		expect(source).toContain('context');
		expect(source).toContain('onClose');
		expect(source).toContain('$props()');
	});
	it('is full-screen on mobile and a right drawer on desktop', () => {
		expect(source).toContain('fixed inset-0');
		expect(source).toContain('lg:w-');
	});
	it('fetches from /api/chat/context', () => {
		expect(source).toContain('/api/chat/context');
	});
	it('renders a close button', () => {
		expect(source).toContain('ปิด');
	});
});
```

- [ ] **Step 2: Create shared types**

```ts
// src/lib/components/chat/ChatContext.ts
export type ChatContextPayload =
	| { type: 'schedule'; seriesIds: string[] }
	| { type: 'artist'; artistIds: string[] }
	| { type: 'series'; seriesIds: string[] }
	| null;
```

- [ ] **Step 3: Create the panel component (Phase 1: series branch only)**

```svelte
<!-- src/lib/components/chat/ChatContextPanel.svelte -->
<script lang="ts">
	import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';
	import SeriesDetailPanel from '$lib/components/SeriesDetailPanel.svelte';
	import type { ChatContextPayload } from './ChatContext.js';

	type SeriesDetail = {
		id: string; titleEn: string; titleTh: string; status: string; studio: string;
		poster: string; description: string; genres: string[]; episodes: number;
		year?: number; platforms: { name: string; logo: string | null }[];
		artists: { id: string; name: string; role: string; image: string }[];
		schedule: { episode: number; title: string; coverUrl: string | null; trailerUrl: string | null; schedules: { airDate: string; platform: string; platformLogo: string | null; streamLink: string | null; isUncut: boolean }[] }[];
	};

	let { context, onClose }: { context: ChatContextPayload; onClose: () => void } = $props();

	let loading = $state(false);
	let error = $state('');
	let seriesItems = $state<SeriesDetail[]>([]);
	let view = $state<'list' | 'detail'>('list');
	let selectedId = $state<string | null>(null);

	const selectedDetail = $derived(seriesItems.find((s) => s.id === selectedId) ?? null);

	async function fetchContext() {
		if (!context) return;
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/chat/context', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type: context.type, ids: context.type === 'series' ? context.seriesIds : [] })
			});
			if (!res.ok) throw new Error('fetch failed');
			const body = await res.json();
			seriesItems = body.items ?? [];
			view = seriesItems.length === 1 ? 'detail' : 'list';
			selectedId = seriesItems.length === 1 ? seriesItems[0].id : null;
		} catch {
			error = 'โหลดข้อมูลไม่สำเร็จ ลองอีกครั้ง';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (context) void fetchContext();
	});

	function openDetail(id: string) {
		selectedId = id;
		view = 'detail';
	}
</script>

<!-- overlay: mobile = full screen, lg+ = right drawer -->
<div class="fixed inset-0 z-50 flex justify-end bg-black/20 lg:bg-transparent" role="dialog" aria-modal="true">
	<div class="flex h-full w-full flex-col bg-[#f7f7f8] shadow-2xl lg:w-[420px]">
		<header class="flex h-14 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4">
			<h2 class="text-sm font-bold text-plum">ข้อมูลที่เกี่ยวข้อง</h2>
			<button type="button" class="flex h-9 w-9 items-center justify-center rounded-xl text-plum-light transition hover:bg-lavender/10" aria-label="ปิด" onclick={onClose}>×</button>
		</header>

		<div class="relative flex-1 overflow-hidden">
			{#if loading}
				<div class="flex h-full items-center justify-center">
					<div class="h-7 w-7 animate-spin rounded-full border-2 border-coral/20 border-t-coral"></div>
				</div>
			{:else if error}
				<div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
					<p class="text-sm text-coral-dark">{error}</p>
					<button type="button" class="rounded-full border border-lavender/30 bg-white px-4 py-2 text-xs font-bold text-plum" onclick={() => fetchContext()}>ลองใหม่</button>
				</div>
			{:else if view === 'detail' && selectedDetail}
				<button type="button" class="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-plum shadow-sm" onclick={() => (view = 'list')}>← ย้อนกลับ</button>
				<SeriesDetailPanel detail={selectedDetail} />
			{:else if context?.type === 'series'}
				<div class="h-full overflow-y-auto overscroll-y-contain p-4">
					<div class="grid grid-cols-2 gap-3">
						{#each seriesItems as s (s.id)}
							<button type="button" class="text-left" onclick={() => openDetail(s.id)}>
								<SeriesPosterCard item={s} href="#" />
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex h-full items-center justify-center px-6 text-center">
					<p class="text-sm text-plum-light">ยังไม่รองรับการแสดงผลประเภทนี้ (Phase 2/3)</p>
				</div>
			{/if}
		</div>
	</div>
</div>
```

Note: in grid view the card is wrapped in a `<button onclick=openDetail>`; pass `href="#"` to neutralize the inner `<a>` (or in Task 4 allow `href` to be omitted → render a `<div>` instead of `<a>`. Recommended: in Task 4, when `href` is falsy render the card body without the `<a>` wrapper — adjust Task 4 accordingly if preferred.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/chat/ChatContextPanel.test.ts`
Expected: PASS.
Run: `npm run check` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/chat/ChatContext.ts src/lib/components/chat/ChatContextPanel.svelte src/lib/components/chat/ChatContextPanel.test.ts
git commit -m "feat(chat): add ChatContextPanel shell (series)"
```

---

## Task 7: ChatApp header reorg + wire panel

**Files:**
- Modify: `src/lib/components/chat/ChatApp.svelte` (header ~lines 296-331, aside footer ~lines 282-290, add context state)
- Test: `src/lib/components/chat/ChatApp.svelte` source assertions (add to existing chat-keyboard-gap.test.ts or new file)

**Interfaces:**
- Consumes: `ChatContextPanel` from Task 6, `ChatContextPayload` type
- Produces: header has context button (right) + hamburger (left, unchanged); profile moved into sidebar footer

- [ ] **Step 1: Write the failing source-level tests**

```ts
// src/lib/components/chat/chat-context-panel-wiring.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/lib/components/chat/ChatApp.svelte', 'utf-8');

describe('ChatApp context panel wiring', () => {
	it('renders a context panel button in the header (not a profile link)', () => {
		expect(source).not.toContain('href="/profile"');
		expect(source).toMatch(/context|panel|ข้อมูลที่เกี่ยวข้อง/i);
	});
	it('moves the profile into the sidebar', () => {
		// profile block (avatarUrl || initial) must be inside <aside>
		expect(source).toContain('currentUser?.avatarUrl');
	});
	it('imports and renders ChatContextPanel', () => {
		expect(source).toContain('ChatContextPanel');
	});
});
```

Run: `npx vitest run src/lib/components/chat/chat-context-panel-wiring.test.ts`
Expected: FAIL.

- [ ] **Step 2: Add context state + track from sendMessage**

In `srcApp` `<script>`:
- import: `import ChatContextPanel from './ChatContextPanel.svelte';` and `import type { ChatContextPayload } from './ChatContext.js';`
- new state: `let context = $state<ChatContextPayload>(null);` and `let panelOpen = $state(false);`
- in `sendMessage()` success block, after building messages, capture context:
```ts
const body = await res.json();
// existing: messages = [...]; followupSuggestions = ...;
context = body.context ?? null;
```
- on error/reset: set `context = null`.

- [ ] **Step 3: Reorg header markup**

In the `<header class="flex h-16 ... justify-between ...">`:
- LEFT: keep the hamburger button (unchanged) + title.
- RIGHT: replace the `<a href="/profile">...</a>` block with a context button:
```svelte
{#if context}
	<button type="button" class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-lavender/30 text-plum transition hover:bg-lavender/10" aria-label="ดูข้อมูลที่เกี่ยวข้อง" onclick={() => panelOpen = true}>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
		</svg>
		<span class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
			{context.type === 'series' ? context.seriesIds.length : context.type === 'artist' ? context.artistIds.length : context.seriesIds.length}
		</span>
	</button>
{/if}
```
- Move the profile `<a href="/profile">` block into the `<aside>` footer (replacing or above the "กลับหน้าเว็บ" link).

- [ ] **Step 4: Render the panel**

At the end of the component (inside the root `<div class="flex h-full overflow-hidden">`, after `</section>`):
```svelte
{#if panelOpen && context}
	<ChatContextPanel {context} onClose={() => (panelOpen = false)} />
{/if}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/components/chat/chat-context-panel-wiring.test.ts`
Expected: PASS.
Run: `npm run check` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/chat/ChatApp.svelte src/lib/components/chat/chat-context-panel-wiring.test.ts
git commit -m "feat(chat): wire context panel + reorg header"
```

---

## Task 8: Full verification & integration

**Files:** none new

- [ ] **Step 1: Run full chat-related test suite**

Run: `npx vitest run src/lib/server/chat src/routes/api/chat src/lib/components/chat src/routes/api/chat-series`
Expected: all PASS.

- [ ] **Step 2: Type check whole project**

Run: `npm run check`
Expected: `svelte-check found 0 errors`.

- [ ] **Step 3: Manual smoke (documented in commit body)**

Flow: ถาม "แนะนำซีรีส์แนวโรแมนติก" → bot ตอบ → ปุ่ม panel ปรากฏ (badge จำนวน) → กด → grid → กดการ์ด → detail ใน panel → "ดูหน้าเต็ม" ไป /series/[id].

- [ ] **Step 4: Final commit (if any check-fixes) + push**

```bash
git push origin main
```

---

## Phase 2 / Phase 3 (follow-on plans, out of scope here)

- **Phase 2 (artist):** extract `ArtistCard` from explore/artists; extract `ArtistDetailPanel`; add `type==='artist'` branch in `/api/chat/context`; enable panel gate for artist.
- **Phase 3 (schedule):** extract `CalendarViews` (3 view modes) from calendar page; add `type==='schedule'` branch (filter `CalendarApiResponse.events` by `seriesId`); enable panel gate for schedule.

## Self-Review Notes

- Spec coverage: extraction ✓ (T1), response.context ✓ (T2), context endpoint series ✓ (T3), shared card ✓ (T4), detail panel ✓ (T5), panel shell ✓ (T6), header reorg + profile move ✓ (T7). Artist/schedule intentionally deferred to P2/P3 per spec phasing.
- Type consistency: `ChatContext` (server) and `ChatContextPayload` (client) intentionally same shape; `SeriesDetail` reused from series-detail.ts; `SeriesListItem` from listing.ts.
- No placeholders: every code step contains runnable code. (Task 5 markup copy references a concrete source file + sections; the engineer copies real markup, not invented content.)
