<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types.js';

	type EntityKind = 'series' | 'artist' | 'ship';
	type EntityOption = { id: string; label: string; subtitle?: string; imageUrl?: string };
	type MediaItem =
		| { kind: 'existing'; id: string; url: string }
		| { kind: 'staged'; key: string; url: string; token: string };

	let { data }: { data: PageData } = $props();
	const moment = data.moment;

	let body = $state(moment.body ?? '');
	let sourceUrl = $state(moment.sourceUrl ?? '');
	let mediaItems = $state<MediaItem[]>(
		moment.media.map((media) => ({ kind: 'existing', id: media.id, url: media.externalUrl ?? '' }))
	);
	let stagedMedia = $derived(
		mediaItems
			.filter((media): media is Extract<MediaItem, { kind: 'staged' }> => media.kind === 'staged')
			.map(({ key, url, token }) => ({ key, url, token }))
	);
	let mediaIds = $derived(
		mediaItems
			.filter((media): media is Extract<MediaItem, { kind: 'existing' }> => media.kind === 'existing')
			.map((media) => media.id)
	);

	let selectedSeries = $state<EntityOption[]>(initialSelected('series', moment.seriesIds));
	let selectedArtists = $state<EntityOption[]>(initialSelected('artist', moment.artistIds));
	let selectedShips = $state<EntityOption[]>(initialSelected('ship', moment.shipIds));
	let seriesQuery = $state('');
	let artistQuery = $state('');
	let shipQuery = $state('');
	let seriesResults = $state<EntityOption[]>([]);
	let artistResults = $state<EntityOption[]>([]);
	let shipResults = $state<EntityOption[]>([]);
	let searching = $state<EntityKind | ''>('');
	let saving = $state(false);
	let error = $state('');
	let imageInput = $state<HTMLInputElement>();

	const thai = $derived(page.data.lang === 'th');
	const mediaCount = $derived(mediaItems.length);

	function initialSelected(kind: EntityKind, ids: string[]): EntityOption[] {
		return ids.map((id) => {
			const tag = moment.entityTags?.find((item) => item.kind === kind && item.id === id);
			return { id, label: tag?.label ?? id };
		});
	}

	function mediaKey(media: MediaItem): string {
		return media.kind === 'existing' ? `existing:${media.id}` : `staged:${media.key}`;
	}

	function removeMedia(key: string) {
		mediaItems = mediaItems.filter((media) => mediaKey(media) !== key);
	}

	function moveMedia(index: number, direction: -1 | 1) {
		const next = index + direction;
		if (next < 0 || next >= mediaItems.length) return;
		const copy = [...mediaItems];
		[copy[index], copy[next]] = [copy[next], copy[index]];
		mediaItems = copy;
	}

	async function selectMedia(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || mediaItems.length >= 4) return;
		const form = new FormData();
		form.set('file', file);
		const response = await fetch(`/api/moments/${encodeURIComponent(moment.id)}/media`, {
			method: 'POST',
			headers: { 'x-moment-media-stage': 'edit' },
			body: form
		});
		input.value = '';
		if (!response.ok) {
			error = thai ? 'อัปโหลดรูปไม่สำเร็จ' : 'Image upload failed.';
			return;
		}
		const media = (await response.json()) as Extract<MediaItem, { kind: 'staged' }>;
		mediaItems = [...mediaItems, { kind: 'staged', key: media.key, url: media.url, token: media.token }];
	}

	function selectedFor(kind: EntityKind): EntityOption[] {
		if (kind === 'series') return selectedSeries;
		if (kind === 'artist') return selectedArtists;
		return selectedShips;
	}

	function setSelected(kind: EntityKind, value: EntityOption[]) {
		if (kind === 'series') selectedSeries = value;
		else if (kind === 'artist') selectedArtists = value;
		else selectedShips = value;
	}

	function addEntity(kind: EntityKind, option: EntityOption, max: number) {
		const selected = selectedFor(kind);
		if (selected.length >= max || selected.some((item) => item.id === option.id)) return;
		setSelected(kind, [...selected, option]);
	}

	function removeEntity(kind: EntityKind, id: string) {
		setSelected(kind, selectedFor(kind).filter((item) => item.id !== id));
	}

	function entityIds(items: EntityOption[]): string[] {
		return items.map((item) => item.id);
	}

	function normalizeSeries(item: { id: string; title?: string; subtitle?: string; poster?: string }): EntityOption {
		return { id: item.id, label: item.title ?? item.id, subtitle: item.subtitle, imageUrl: item.poster };
	}

	function normalizeArtist(item: { id: string; nickname?: string; fullNameEn?: string; fullNameTh?: string | null; profileImageUrl?: string }): EntityOption {
		return { id: item.id, label: item.nickname ?? item.fullNameEn ?? item.id, subtitle: item.fullNameTh ?? item.fullNameEn, imageUrl: item.profileImageUrl };
	}

	function normalizeShip(item: { id: string; name?: string; imageUrl?: string; artist1?: { name: string }; artist2?: { name: string } }): EntityOption {
		const subtitle = [item.artist1?.name, item.artist2?.name].filter(Boolean).join(' × ');
		return { id: item.id, label: item.name ?? item.id, subtitle, imageUrl: item.imageUrl };
	}

	async function searchEntities(kind: EntityKind) {
		const query = kind === 'series' ? seriesQuery : kind === 'artist' ? artistQuery : shipQuery;
		searching = kind;
		try {
			const endpoint = kind === 'series' ? '/api/series' : kind === 'artist' ? '/api/artists' : '/api/ships';
			const response = await fetch(`${endpoint}?search=${encodeURIComponent(query)}&page=1`);
			if (!response.ok) return;
			const result = (await response.json()) as { items?: unknown[] };
			const items = result.items ?? [];
			if (kind === 'series') seriesResults = items.map((item) => normalizeSeries(item as Parameters<typeof normalizeSeries>[0]));
			else if (kind === 'artist') artistResults = items.map((item) => normalizeArtist(item as Parameters<typeof normalizeArtist>[0]));
			else shipResults = items.map((item) => normalizeShip(item as Parameters<typeof normalizeShip>[0]));
		} finally {
			searching = '';
		}
	}

	async function save() {
		if (saving) return;
		saving = true;
		error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(moment.id)}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					body,
					sourceUrl,
					mediaIds,
					stagedMedia,
					seriesIds: entityIds(selectedSeries),
					artistIds: entityIds(selectedArtists),
					shipIds: entityIds(selectedShips)
				})
			});
			if (!response.ok) throw new Error();
			await goto(`/${page.data.lang}/halo/moments/${encodeURIComponent(moment.id)}`);
		} catch {
			error = thai ? 'บันทึกไม่สำเร็จ โปรดลองอีกครั้ง' : 'Unable to save. Please try again.';
		} finally {
			saving = false;
		}
	}
</script>

<header class="sticky top-[var(--pwa-safe-top)] z-30 flex items-center gap-5 border-b border-[#eee9ef] bg-white/95 px-3 py-2 backdrop-blur-md">
	<a href={`/${page.data.lang}/halo/moments/${moment.id}`} class="halo-focus-ring grid h-9 w-9 place-items-center rounded-full hover:bg-plum/[.05]" aria-label={thai ? 'กลับ' : 'Back'}>←</a>
	<h1 class="font-display text-lg font-extrabold">{thai ? 'แก้ไข Moment' : 'Edit Moment'}</h1>
</header>

<main class="bg-white px-4 py-5 sm:px-5">
	<label class="sr-only" for="body">{thai ? 'ข้อความ' : 'Message'}</label>
	<textarea id="body" bind:value={body} maxlength="2000" rows="6" class="w-full resize-none rounded-2xl border border-[#ded8df] p-3 text-sm outline-none focus:border-coral"></textarea>

	<label class="mt-4 block text-xs font-bold text-plum" for="source">{thai ? 'ลิงก์' : 'Link'}</label>
	<input id="source" bind:value={sourceUrl} type="url" class="mt-1 w-full rounded-xl border border-[#ded8df] px-3 py-2.5 text-sm outline-none focus:border-coral" />

	<section class="mt-4" aria-label={thai ? 'รูปภาพ' : 'Images'}>
		<div class="grid grid-cols-2 gap-2">
			{#each mediaItems as media, index (mediaKey(media))}
				<div class="relative overflow-hidden rounded-xl border border-[#eee9ef] bg-cream/50">
					<img src={media.url} alt="" class="aspect-square w-full object-cover" />
					{#if media.kind === 'staged'}
						<span class="absolute left-2 top-2 rounded-full bg-mint px-2 py-1 text-[10px] font-bold text-plum">{thai ? 'รูปใหม่' : 'New'}</span>
					{/if}
					<div class="absolute inset-x-1 bottom-1 flex justify-between gap-1">
						<button type="button" onclick={() => moveMedia(index, -1)} disabled={index === 0} class="rounded bg-white/90 px-2 disabled:opacity-40">←</button>
						<button type="button" onclick={() => removeMedia(mediaKey(media))} class="rounded bg-white/90 px-2 font-bold text-coral-dark" aria-label={thai ? 'ลบรูป' : 'Remove image'}>×</button>
						<button type="button" onclick={() => moveMedia(index, 1)} disabled={index === mediaItems.length - 1} class="rounded bg-white/90 px-2 disabled:opacity-40">→</button>
					</div>
				</div>
			{/each}
		</div>
		<input bind:this={imageInput} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onchange={selectMedia} />
		<div class="mt-3 flex items-center justify-between gap-3">
			<button type="button" onclick={() => imageInput?.click()} disabled={mediaCount >= 4} class="halo-focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-mint/35 bg-mint/10 px-4 text-sm font-bold text-mint-dark transition hover:bg-mint/20 disabled:cursor-not-allowed disabled:opacity-45">
				<span aria-hidden="true">▧</span>{thai ? 'เพิ่มรูปภาพ' : 'Add images'}
			</button>
			<p class="text-xs text-plum-light">{mediaCount}/4</p>
		</div>
	</section>

	<section class="mt-5 space-y-4">
		<div>
			<label class="block text-xs font-bold text-plum" for="seriesSearch">{thai ? 'ซีรีส์' : 'Series'}</label>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each selectedSeries as item (item.id)}
					<button type="button" onclick={() => removeEntity('series', item.id)} class="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-plum">{item.label} ×</button>
				{/each}
			</div>
			<div class="mt-2 flex gap-2">
				<input id="seriesSearch" bind:value={seriesQuery} oninput={() => searchEntities('series')} class="w-full rounded-xl border border-[#ded8df] px-3 py-2 text-sm outline-none focus:border-coral" placeholder={thai ? 'ค้นหาชื่อซีรีส์' : 'Search series'} />
				<button type="button" onclick={() => searchEntities('series')} class="rounded-xl bg-plum px-3 text-sm font-bold text-white">{thai ? 'ค้นหา' : 'Search'}</button>
			</div>
			<div class="mt-2 grid gap-2">
				{#each seriesResults as item (item.id)}
					<button type="button" onclick={() => addEntity('series', item, 3)} class="flex items-center gap-3 rounded-xl border border-[#eee9ef] p-2 text-left hover:border-coral">
						<img src={item.imageUrl ?? '/placeholders/poster.svg'} alt="" class="h-11 w-11 rounded-lg object-cover" />
						<span><span class="block text-sm font-bold text-plum">{item.label}</span><span class="block text-xs text-plum-light">{item.subtitle}</span></span>
					</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="block text-xs font-bold text-plum" for="artistSearch">{thai ? 'ศิลปิน' : 'Artists'}</label>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each selectedArtists as item (item.id)}
					<button type="button" onclick={() => removeEntity('artist', item.id)} class="rounded-full bg-lavender/20 px-3 py-1 text-xs font-bold text-plum">{item.label} ×</button>
				{/each}
			</div>
			<div class="mt-2 flex gap-2">
				<input id="artistSearch" bind:value={artistQuery} oninput={() => searchEntities('artist')} class="w-full rounded-xl border border-[#ded8df] px-3 py-2 text-sm outline-none focus:border-coral" placeholder={thai ? 'ค้นหาชื่อศิลปิน' : 'Search artists'} />
				<button type="button" onclick={() => searchEntities('artist')} class="rounded-xl bg-plum px-3 text-sm font-bold text-white">{thai ? 'ค้นหา' : 'Search'}</button>
			</div>
			<div class="mt-2 grid gap-2">
				{#each artistResults as item (item.id)}
					<button type="button" onclick={() => addEntity('artist', item, 6)} class="flex items-center gap-3 rounded-xl border border-[#eee9ef] p-2 text-left hover:border-coral">
						<img src={item.imageUrl ?? '/placeholders/avatar.svg'} alt="" class="h-11 w-11 rounded-full object-cover" />
						<span><span class="block text-sm font-bold text-plum">{item.label}</span><span class="block text-xs text-plum-light">{item.subtitle}</span></span>
					</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="block text-xs font-bold text-plum" for="shipSearch">Ships</label>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each selectedShips as item (item.id)}
					<button type="button" onclick={() => removeEntity('ship', item.id)} class="rounded-full bg-mint/25 px-3 py-1 text-xs font-bold text-plum">{item.label} ×</button>
				{/each}
			</div>
			<div class="mt-2 flex gap-2">
				<input id="shipSearch" bind:value={shipQuery} oninput={() => searchEntities('ship')} class="w-full rounded-xl border border-[#ded8df] px-3 py-2 text-sm outline-none focus:border-coral" placeholder={thai ? 'ค้นหา Ship' : 'Search ships'} />
				<button type="button" onclick={() => searchEntities('ship')} class="rounded-xl bg-plum px-3 text-sm font-bold text-white">{thai ? 'ค้นหา' : 'Search'}</button>
			</div>
			<div class="mt-2 grid gap-2">
				{#each shipResults as item (item.id)}
					<button type="button" onclick={() => addEntity('ship', item, 3)} class="flex items-center gap-3 rounded-xl border border-[#eee9ef] p-2 text-left hover:border-coral">
						<img src={item.imageUrl ?? '/placeholders/poster.svg'} alt="" class="h-11 w-11 rounded-lg object-cover" />
						<span><span class="block text-sm font-bold text-plum">{item.label}</span><span class="block text-xs text-plum-light">{item.subtitle}</span></span>
					</button>
				{/each}
			</div>
		</div>
		{#if searching}
			<p class="text-xs text-plum-light">{thai ? 'กำลังค้นหา…' : 'Searching…'}</p>
		{/if}
	</section>

	{#if error}<p class="mt-4 text-sm font-bold text-coral-dark">{error}</p>{/if}
	<button type="button" onclick={save} disabled={saving} class="mt-5 w-full rounded-2xl bg-plum py-3 font-bold text-white disabled:opacity-60">{saving ? (thai ? 'กำลังบันทึก…' : 'Saving…') : (thai ? 'บันทึก' : 'Save')}</button>
</main>
