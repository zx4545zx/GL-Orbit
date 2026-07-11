<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';
	import SeriesDetailPanel from '$lib/components/SeriesDetailPanel.svelte';
	import ArtistDetailPanel from '$lib/components/ArtistDetailPanel.svelte';
	import ScheduleContextPanel from '$lib/components/ScheduleContextPanel.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import type { ChatContextPayload } from './ChatContext.js';

	// Local type aliases keep this client component from importing server modules at runtime.
	type SeriesDetail = import('$lib/server/queries/series-detail.js').SeriesDetail;
	type ArtistDetail = import('$lib/server/queries/artist-detail.js').ArtistDetail;
	type SeriesListItem = import('$lib/server/series/listing.js').SeriesListItem;
	type CalendarApiResponse = import('$lib/types/calendar.js').CalendarApiResponse;

	let { context, onClose }: { context: ChatContextPayload; onClose?: () => void } = $props();

	let loading = $state(false);
	let error = $state('');
	let seriesItems = $state<SeriesDetail[]>([]);
	let artistItems = $state<ArtistDetail[]>([]);
	let scheduleCalendar = $state<CalendarApiResponse | null>(null);
	let view = $state<'list' | 'series-detail' | 'artist-detail' | 'schedule'>('list');
	let selectedSeriesId = $state<string | null>(null);
	let selectedArtistId = $state<string | null>(null);

	const selectedSeriesDetail = $derived(seriesItems.find((s) => s.id === selectedSeriesId) ?? null);
	const selectedArtistDetail = $derived(artistItems.find((a) => a.id === selectedArtistId) ?? null);

	const cardItems = $derived(seriesItems.map((s): SeriesListItem => ({
		id: s.id,
		title: s.titleTh || s.titleEn,
		subtitle: s.titleTh ? s.titleEn : '',
		poster: s.poster,
		status: s.status as SeriesListItem['status'],
		studio: s.studio,
		genres: s.genres.map((g) => ({ id: '', name: g }))
	})));

	const title = $derived(context?.type === 'artist' ? m.chat_context_artists() : context?.type === 'schedule' ? m.chat_context_schedule() : m.chat_context_series());

	function payloadForContext(ctx: NonNullable<ChatContextPayload>): { type: string; ids: string[] } {
		if (ctx.type === 'artist') return { type: 'artist', ids: ctx.artistIds };
		return { type: ctx.type, ids: ctx.seriesIds };
	}

	async function fetchContext() {
		if (!context) return;
		loading = true;
		error = '';
		seriesItems = [];
		artistItems = [];
		scheduleCalendar = null;
		selectedSeriesId = null;
		selectedArtistId = null;
		try {
			const payload = payloadForContext(context);
			const res = await fetch('/api/chat/context', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('fetch failed');
			const body = await res.json();
			if (body.type === 'artist') {
				artistItems = body.items ?? [];
				view = artistItems.length === 1 ? 'artist-detail' : 'list';
				selectedArtistId = artistItems.length === 1 ? artistItems[0].id : null;
			} else if (body.type === 'schedule') {
				scheduleCalendar = body.calendar ?? null;
				view = 'schedule';
			} else {
				seriesItems = body.items ?? [];
				view = seriesItems.length === 1 ? 'series-detail' : 'list';
				selectedSeriesId = seriesItems.length === 1 ? seriesItems[0].id : null;
			}
		} catch {
			error = m.chat_context_load_error();
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (context) void fetchContext();
	});

	function openSeriesDetail(id: string) {
		selectedSeriesId = id;
		view = 'series-detail';
	}

	function openArtistDetail(id: string) {
		selectedArtistId = id;
		view = 'artist-detail';
	}
</script>

<section class="flex h-full min-h-0 w-full flex-col bg-[#f7f7f8]" aria-label={title}>
	<header class="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-4">
		{#if (view === 'series-detail' || view === 'artist-detail') && seriesItems.length > 1 || view === 'artist-detail' && artistItems.length > 1}
			<button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-plum-light transition hover:bg-lavender/10" aria-label={m.chat_context_back_aria()} onclick={() => (view = 'list')}>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
			</button>
			<div class="min-w-0">
				<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-coral-dark/70">Preview</p>
				<h2 class="truncate text-sm font-bold text-plum">
					{#if view === 'series-detail' && selectedSeriesDetail}
						{selectedSeriesDetail.titleTh || selectedSeriesDetail.titleEn}
					{:else if view === 'artist-detail' && selectedArtistDetail}
						{selectedArtistDetail.nickname}
					{/if}
				</h2>
			</div>
		{:else}
			<div class="min-w-0">
				<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-coral-dark/70">Preview</p>
				<h2 class="truncate text-sm font-bold text-plum">{title}</h2>
			</div>
		{/if}
		{#if onClose}
			<button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-plum-light transition hover:bg-lavender/10" aria-label={m.chat_context_close_aria()} onclick={onClose}>×</button>
		{/if}
	</header>

	<div class="relative min-h-0 flex-1 overflow-hidden">
			{#if loading}
				<div class="flex h-full items-center justify-center">
					<div class="h-7 w-7 animate-spin rounded-full border-2 border-coral/20 border-t-coral"></div>
				</div>
			{:else if error}
				<div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
					<p class="text-sm text-coral-dark">{error}</p>
					<button type="button" class="rounded-full border border-lavender/30 bg-white px-4 py-2 text-xs font-bold text-plum" onclick={() => fetchContext()}>{m.chat_context_retry()}</button>
				</div>
			{:else if view === 'series-detail' && selectedSeriesDetail}
				<SeriesDetailPanel detail={selectedSeriesDetail} />
			{:else if view === 'artist-detail' && selectedArtistDetail}
				<ArtistDetailPanel detail={selectedArtistDetail} />
			{:else if view === 'schedule' && scheduleCalendar}
				<ScheduleContextPanel calendar={scheduleCalendar} />
			{:else if context?.type === 'series'}
				<div class="h-full overflow-y-auto overscroll-y-contain p-4">
					<div class="grid grid-cols-2 gap-3">
						{#each cardItems as c (c.id)}
							<button type="button" class="text-left" onclick={() => openSeriesDetail(c.id)}>
								<SeriesPosterCard item={c} href="#" />
							</button>
						{/each}
					</div>
				</div>
			{:else if context?.type === 'artist'}
				<div class="h-full overflow-y-auto overscroll-y-contain p-4">
					<div class="grid gap-3">
						{#each artistItems as artist (artist.id)}
							<button type="button" class="group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-3 text-left shadow-sm shadow-lavender/10 transition hover:-translate-y-0.5 hover:border-coral/25 hover:bg-white" onclick={() => openArtistDetail(artist.id)}>
								<Picture src={artist.profileImageUrl} type="profiles" sizes="128px" alt={artist.nickname} width={64} height={64} loading="lazy" class="h-16 w-16 rounded-2xl object-cover shadow-sm" />
								<span class="min-w-0 flex-1">
									<span class="block truncate text-base font-bold text-plum">{artist.nickname}</span>
									{#if artist.fullNameEn}<span class="block truncate text-xs text-plum-light">{artist.fullNameEn}</span>{/if}
									<span class="mt-1 block text-xs font-semibold text-coral-dark">{artist.series.length} {m.chat_context_works()}</span>
								</span>
								<svg class="h-4 w-4 shrink-0 text-plum-light transition group-hover:translate-x-0.5 group-hover:text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex h-full items-center justify-center px-6 text-center">
					<p class="text-sm text-plum-light">{m.chat_context_no_data()}</p>
				</div>
			{/if}
	</div>
</section>
