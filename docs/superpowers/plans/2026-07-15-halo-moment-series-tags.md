# Halo Moment Series Tags Implementation Plan

> **For agentic workers:** Execute tasks in order. User explicitly requested no automated tests for this change.

**Goal:** Let members tag a new Halo Moment with up to three existing series and display those tags in the feed.

**Architecture:** Reuse the existing `moment_series` many-to-many table and the Moment create payload's `seriesIds` field. The feed load supplies localized, non-deleted series options to `MomentComposer`; the composer manages its compact multi-select UI. The server validates the IDs and verifies every selected series before its transactional insert.

**Tech Stack:** Svelte 5 runes, SvelteKit server load/API routes, TypeScript, Drizzle ORM, PostgreSQL.

---

## File structure

- Modify: `src/lib/server/moments/queries.ts` — add localized picker-option query.
- Modify: `src/routes/[lang=lang]/(orbit-halo)/halo/+page.server.ts` — return picker options with feed data.
- Modify: `src/routes/[lang=lang]/(orbit-halo)/halo/+page.svelte` — pass picker options into the composer.
- Modify: `src/lib/components/moments/MomentComposer.svelte` — implement searchable multi-select, chips, localized copy, and request payload.
- Modify: `src/routes/api/moments/service.ts` — require `seriesIds` to be unique UUIDs, limited to three.
- Modify: `src/lib/server/moments/mutations.ts` — verify selected series exist and are not soft-deleted before creating or updating a Moment.
- Modify: `src/routes/api/moments/+server.ts` — return `INVALID_MOMENT` for invalid series selections.
- Modify: `src/routes/api/moments/[id]/+server.ts` — return `INVALID_MOMENT` for an invalid series selection during update.

### Task 1: Supply localized series picker options

**Files:**
- Modify: `src/lib/server/moments/queries.ts`
- Modify: `src/routes/[lang=lang]/(orbit-halo)/halo/+page.server.ts`

- [ ] **Step 1: Add a focused query for public series options**

In `queries.ts`, add this export after `MomentFilter`:

```ts
export type MomentSeriesOption = { id: string; label: string };

export async function getMomentSeriesOptions(lang: string): Promise<MomentSeriesOption[]> {
	const db = await getDb();
	const rows = await db
		.select({ id: series.id, titleTh: series.titleTh, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(asc(series.titleEn));
	return rows
		.map((row) => ({ id: row.id, label: (lang === 'th' ? row.titleTh || row.titleEn : row.titleEn || row.titleTh || '').trim() }))
		.filter((row) => row.label.length > 0)
		.sort((a, b) => a.label.localeCompare(b.label, lang === 'th' ? 'th' : 'en'));
}
```

- [ ] **Step 2: Load feed and picker data concurrently**

Replace the page load with:

```ts
import { getMomentSeriesOptions, getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const filters = {
		seriesId: url.searchParams.get('seriesId'),
		artistId: url.searchParams.get('artistId'),
		shipId: url.searchParams.get('shipId')
	};
	const [feed, seriesOptions] = await Promise.all([
		getMoments({ ...filters, viewerId: locals.user?.id }),
		getMomentSeriesOptions(params.lang)
	]);
	return { ...feed, filters, seriesOptions };
};
```

- [ ] **Step 3: Verify server-load types**

Run: `npm run check`

Expected: no Svelte or TypeScript error from `+page.server.ts` or `queries.ts`.

### Task 2: Build the composer multi-select UI

**Files:**
- Modify: `src/routes/[lang=lang]/(orbit-halo)/halo/+page.svelte`
- Modify: `src/lib/components/moments/MomentComposer.svelte`

- [ ] **Step 1: Pass options through the feed page**

Replace the composer usage with:

```svelte
<MomentComposer seriesOptions={data.seriesOptions} />
```

- [ ] **Step 2: Define props and state in `MomentComposer`**

Add a prop and state near the existing state declarations:

```ts
type SeriesOption = { id: string; label: string };
let { seriesOptions }: { seriesOptions: SeriesOption[] } = $props();
let showSeriesPicker = $state(false);
let seriesSearch = $state('');
let selectedSeriesIds = $state<string[]>([]);
const selectedSeries = $derived(seriesOptions.filter((option) => selectedSeriesIds.includes(option.id)));
const filteredSeriesOptions = $derived(seriesOptions.filter((option) =>
	!selectedSeriesIds.includes(option.id) && option.label.toLocaleLowerCase().includes(seriesSearch.trim().toLocaleLowerCase())
));
```

Add helpers:

```ts
function selectSeries(id: string) {
	if (selectedSeriesIds.length < 3 && !selectedSeriesIds.includes(id)) selectedSeriesIds = [...selectedSeriesIds, id];
}

function removeSeries(id: string) {
	selectedSeriesIds = selectedSeriesIds.filter((selectedId) => selectedId !== id);
}
```

- [ ] **Step 3: Add localized labels**

Add these keys to each branch of `copy`:

```ts
series: 'แท็กซีรี่ย์',
seriesSearch: 'ค้นหาซีรี่ย์เพื่อแท็ก…',
clearSeries: 'ล้างทั้งหมด',
selectedSeries: 'เลือกซีรี่ย์แล้ว',
seriesLimit: 'เลือกได้สูงสุด 3 เรื่อง',
```

Use these English values in the non-Thai branch:

```ts
series: 'Tag series',
seriesSearch: 'Search series to tag…',
clearSeries: 'Clear all',
selectedSeries: 'Selected series',
seriesLimit: 'Choose up to 3 series',
```

- [ ] **Step 4: Render picker and chips below the textarea**

Insert this after the textarea and before the media-preview block:

```svelte
{#if showSeriesPicker || selectedSeries.length}
	<div class="mt-3 rounded-2xl border border-lavender/35 bg-[#faf8ff] p-3">
		<div class="flex items-center justify-between gap-3">
			<p class="text-xs font-bold text-plum">{copy.selectedSeries}</p>
			{#if selectedSeries.length}
				<button type="button" onclick={() => selectedSeriesIds = []} class="halo-focus-ring rounded-full px-2 py-1 text-xs font-semibold text-coral-dark" disabled={composerState === 'publishing'}>{copy.clearSeries}</button>
			{/if}
		</div>
		{#if selectedSeries.length}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each selectedSeries as option}
					<button type="button" onclick={() => removeSeries(option.id)} class="halo-focus-ring inline-flex items-center gap-1 rounded-full bg-lavender/20 px-3 py-1.5 text-xs font-semibold text-lavender-dark" disabled={composerState === 'publishing'}>{option.label} <span aria-hidden="true">×</span></button>
				{/each}
			</div>
		{/if}
		{#if selectedSeriesIds.length < 3}
			<label class="sr-only" for="moment-series-search">{copy.seriesSearch}</label>
			<input id="moment-series-search" bind:value={seriesSearch} class="mt-3 w-full rounded-xl border border-plum/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-plum-light/55" placeholder={copy.seriesSearch} disabled={composerState === 'publishing'} />
			<div class="mt-2 max-h-48 overflow-y-auto rounded-xl border border-plum/10 bg-white">
				{#each filteredSeriesOptions.slice(0, 8) as option}
					<button type="button" onclick={() => selectSeries(option.id)} class="halo-focus-ring block w-full px-3 py-2.5 text-left text-sm text-plum transition hover:bg-lavender/10" disabled={composerState === 'publishing'}>{option.label}</button>
				{/each}
			</div>
		{:else}
			<p class="mt-3 text-xs text-plum-light">{copy.seriesLimit}</p>
		{/if}
	</div>
{/if}
```

- [ ] **Step 5: Add the picker toggle and publish selected IDs**

Add a text button to the existing action controls:

```svelte
<button type="button" onclick={() => showSeriesPicker = !showSeriesPicker} disabled={composerState === 'publishing'} class={`halo-focus-ring rounded-full px-3 py-2 text-xs font-bold transition hover:bg-lavender/20 disabled:opacity-35 ${showSeriesPicker ? 'bg-lavender/20 text-lavender-dark' : 'text-plum-light'}`}>{copy.series}</button>
```

Change the create request body to include `seriesIds`:

```ts
body: JSON.stringify({ body: body.trim() || undefined, sourceUrl: url.trim() || undefined, pendingMediaCount: selectedMedia.length, seriesIds: selectedSeriesIds })
```

When publishing succeeds, reset picker state with the existing composer reset:

```ts
seriesSearch = '';
selectedSeriesIds = [];
showSeriesPicker = false;
```

- [ ] **Step 6: Verify responsive UI manually**

Open `http://localhost:5173/th/halo`. Confirm picker search, add/remove, clear, three-tag limit, disabled publish state, and mobile wrapping work. Publish a Moment with multiple tags; refresh and confirm every selected series tag renders.

### Task 3: Validate and protect Moment associations

**Files:**
- Modify: `src/routes/api/moments/service.ts`
- Modify: `src/lib/server/moments/mutations.ts`
- Modify: `src/routes/api/moments/+server.ts`
- Modify: `src/routes/api/moments/[id]/+server.ts`

- [ ] **Step 1: Make parsed entity IDs unique UUIDs**

In `service.ts`, replace the `ids` helper with:

```ts
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ids = (name: string, max: number) => {
	if (typeof body[name] === 'undefined') return [];
	if (!Array.isArray(body[name]) || body[name].length > max || !body[name].every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) return null;
	const values = body[name] as string[];
	return new Set(values).size === values.length ? values : null;
};
```

Keep `seriesIds` at its established maximum of three:

```ts
const seriesIds = ids('seriesIds', 3);
```

- [ ] **Step 2: Verify all selected series before writes**

In `mutations.ts`, import `and`, `inArray`, and `isNull` from `drizzle-orm`, plus `series` from the schema module. Add:

```ts
export class InvalidMomentSeriesError extends Error {}

async function verifyMomentSeriesIds(db: Awaited<ReturnType<typeof getDb>>, seriesIds: string[] = []) {
	if (!seriesIds.length) return;
	const rows = await db.select({ id: series.id }).from(series).where(and(inArray(series.id, seriesIds), isNull(series.deletedAt)));
	if (rows.length !== seriesIds.length) throw new InvalidMomentSeriesError();
}
```

Call it before the transaction in both mutation paths:

```ts
await verifyMomentSeriesIds(db, input.seriesIds);
```

- [ ] **Step 3: Map invalid selections to the existing invalid-request response**

In the create route, import `InvalidMomentSeriesError` and replace its catch with:

```ts
catch (error) {
	return json(
		{ error: error instanceof InvalidMomentSeriesError ? 'INVALID_MOMENT' : 'DUPLICATE_SOURCE' },
		{ status: error instanceof InvalidMomentSeriesError ? 400 : 409 }
	);
}
```

In the PATCH route, wrap `updateMoment` similarly and return `{ error: 'INVALID_MOMENT' }` with status 400 for `InvalidMomentSeriesError`; preserve its existing successful `{ success: true }` response.

- [ ] **Step 4: Run final verification**

Run: `npm run check`

Expected: exit code 0. Then repeat the manual multi-series publish flow from Task 2, including an invalid handcrafted `seriesIds` request that returns HTTP 400 without creating a Moment.
