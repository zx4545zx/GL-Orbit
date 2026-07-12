<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';

	type Filter = 'all' | 'series' | 'artists' | 'ships';
	type SearchResult = { kind: 'series' | 'artist' | 'ship'; id: string; label: string; subtitle: string; imageUrl: string };

	let { data }: { data: PageData } = $props();
	let active = $state<Filter>('all');
	let query = $state(page.url.searchParams.get('search') ?? '');
	let results = $state<SearchResult[]>([]);
	let searching = $state(false);
	let searchError = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let searchRevision = 0;
	const isThai = $derived(page.data.lang === 'th');
	const moments = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
	const filters = $derived([
		{ id: 'all' as const, label: isThai ? 'ทั้งหมด' : 'All' },
		{ id: 'series' as const, label: isThai ? 'ซีรีส์' : 'Series' },
		{ id: 'artists' as const, label: isThai ? 'นักแสดง' : 'Artists' },
		{ id: 'ships' as const, label: isThai ? 'คู่จิ้น' : 'Ships' }
	]);

	function queueSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => void searchEntities(), 300);
	}

	async function searchEntities() {
		const value = query.trim().slice(0, 100);
		const revision = ++searchRevision;
		if (!value) {
			results = [];
			searchError = '';
			searching = false;
			return;
		}

		searching = true;
		searchError = '';
		try {
			const kinds = active === 'all' ? ['series', 'artists', 'ships'] as const : [active] as const;
			const responses = await Promise.all(kinds.map(async (kind) => {
				const response = await fetch(`/api/${kind}?search=${encodeURIComponent(value)}`);
				if (!response.ok) throw new Error('search-failed');
				return { kind, payload: await response.json() as { items?: Array<Record<string, unknown>> } };
			}));
			if (revision !== searchRevision) return;

			results = responses.flatMap(({ kind, payload }) => (payload.items ?? []).slice(0, 8).map((item) => {
				if (kind === 'series') return { kind: 'series' as const, id: String(item.id), label: String(item.title), subtitle: String(item.subtitle || ''), imageUrl: String(item.poster || '') };
				if (kind === 'artists') return { kind: 'artist' as const, id: String(item.id), label: String(item.nickname), subtitle: String(item.fullNameEn || item.fullNameTh || ''), imageUrl: String(item.profileImageUrl || '') };
				return { kind: 'ship' as const, id: String(item.id), label: String(item.name), subtitle: String(item.description || ''), imageUrl: String(item.imageUrl || '') };
			}));
		} catch {
			if (revision === searchRevision) {
				results = [];
				searchError = isThai ? 'ค้นหาไม่สำเร็จ โปรดลองอีกครั้ง' : 'Search failed. Please try again.';
			}
		} finally {
			if (revision === searchRevision) searching = false;
		}
	}

	function selectFilter(filter: Filter) {
		active = filter;
		void searchEntities();
	}

	function resultHref(result: SearchResult) {
		return `/${page.data.lang}/halo?${result.kind}Id=${encodeURIComponent(result.id)}`;
	}

	onMount(() => {
		if (query.trim()) void searchEntities();
		return () => clearTimeout(searchTimer);
	});
</script>

<svelte:head><title>{m.halo_explore_title()} · Orbit Halo</title></svelte:head>

<HaloPageHeader kicker="Discover" title={m.halo_explore_title()} description={isThai ? 'ค้นหาซีรีส์ นักแสดง และคู่จิ้น' : 'Find series, artists and ships.'} icon="explore" />
<div class="border-b border-[#eee9ef] p-3">
	<label class="flex h-11 items-center gap-3 rounded-full bg-[#f7f7f8] px-4 text-plum-light focus-within:ring-1 focus-within:ring-coral"><HaloIcon name="explore" size={17} /><span class="sr-only">Search</span><input bind:value={query} oninput={queueSearch} type="search" placeholder={isThai ? 'ค้นหา Orbit Halo' : 'Search Orbit Halo'} class="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
</div>
<div class="halo-scrollbar flex gap-2 overflow-x-auto border-b border-[#eee9ef] px-4 py-3">
	{#each filters as filter}<button type="button" onclick={() => selectFilter(filter.id)} class="halo-focus-ring shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium {active === filter.id ? 'border-plum bg-plum text-white' : 'border-[#ded8df] bg-white text-plum'}">{filter.label}</button>{/each}
</div>

{#if query.trim()}
	<section class="border-b border-[#eee9ef] px-4 py-4" aria-live="polite">
		<h2 class="font-display text-lg font-bold">{isThai ? 'ผลการค้นหา' : 'Search results'}</h2>
		{#if searching}<p class="py-8 text-center text-sm text-plum-light">{isThai ? 'กำลังค้นหา…' : 'Searching…'}</p>
		{:else if searchError}<p class="py-8 text-center text-sm text-coral-dark">{searchError}</p>
		{:else if results.length === 0}<p class="py-8 text-center text-sm text-plum-light">{isThai ? 'ไม่พบผลลัพธ์' : 'No results found'}</p>
		{:else}<div class="mt-3 divide-y divide-[#f2eef3]">{#each results as result (result.kind + result.id)}<a href={resultHref(result)} class="halo-focus-ring flex items-center gap-3 py-3"><img src={result.imageUrl || '/placeholders/avatar.svg'} alt="" class="h-11 w-11 rounded-xl bg-[#f4edf4] object-cover" /><span class="min-w-0"><span class="block text-[11px] capitalize text-plum-light">{result.kind}</span><strong class="block truncate text-sm">{result.label}</strong>{#if result.subtitle}<span class="block truncate text-xs text-plum-light">{result.subtitle}</span>{/if}</span></a>{/each}</div>{/if}
	</section>
{:else}
	<section class="border-b border-[#eee9ef] px-4 py-4">
		<h2 class="font-display text-lg font-bold">{isThai ? 'กำลังได้รับความสนใจ' : 'Trending now'}</h2>
		<div class="mt-3 divide-y divide-[#f2eef3]">
			{#each data.haloDiscovery as item}<a href={`/${page.data.lang}/halo?${item.kind}Id=${encodeURIComponent(item.id)}`} class="block py-2.5"><span class="text-[11px] capitalize text-plum-light">{item.kind}</span><strong class="block text-sm">#{item.label}</strong><span class="text-[11px] text-plum-light">{item.momentCount} moments</span></a>{:else}<p class="py-6 text-center text-sm text-plum-light">{isThai ? 'ยังไม่มีหัวข้อที่กำลังได้รับความสนใจ' : 'Nothing is trending yet.'}</p>{/each}
		</div>
	</section>
{/if}

<div id="feed"><MomentFeed {moments} initialCursor={data.nextCursor} paginationQuery="" /></div>
