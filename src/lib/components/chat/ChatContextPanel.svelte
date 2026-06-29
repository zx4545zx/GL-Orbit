<script lang="ts">
	import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';
	import SeriesDetailPanel from '$lib/components/SeriesDetailPanel.svelte';
	import type { ChatContextPayload } from './ChatContext.js';

	// Local types mirroring server types (avoid import of server modules in client)
	type SeriesDetail = import('$lib/server/queries/series-detail.js').SeriesDetail;
	type SeriesListItem = import('$lib/server/series/listing.js').SeriesListItem;

	let { context, onClose }: { context: ChatContextPayload; onClose: () => void } = $props();

	let loading = $state(false);
	let error = $state('');
	let seriesItems = $state<SeriesDetail[]>([]);
	let view = $state<'list' | 'detail'>('list');
	let selectedId = $state<string | null>(null);

	const selectedDetail = $derived(seriesItems.find((s) => s.id === selectedId) ?? null);

	// Map SeriesDetail → SeriesListItem for the card grid
	const cardItems = $derived(seriesItems.map((s): SeriesListItem => ({
	id: s.id,
	title: s.titleTh || s.titleEn,
	subtitle: s.titleTh ? s.titleEn : '',
	poster: s.poster,
	status: s.status as SeriesListItem['status'],
	studio: s.studio,
	genres: s.genres.map((g) => ({ id: '', name: g }))
})));

	async function fetchContext() {
		if (!context) return;
		loading = true;
		error = '';
		try {
			const payload: { type: string; ids: string[] } = { type: 'series', ids: (context as { seriesIds?: string[] }).seriesIds ?? [] };
			const res = await fetch('/api/chat/context', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
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
						{#each cardItems as c (c.id)}
							<button type="button" class="text-left" onclick={() => openDetail(c.id)}>
								<SeriesPosterCard item={c} href="#" />
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
