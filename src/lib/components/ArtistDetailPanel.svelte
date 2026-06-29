<script lang="ts">
	import SeriesPosterCard from '$lib/components/SeriesPosterCard.svelte';

	type ArtistDetail = import('$lib/server/queries/artist-detail.js').ArtistDetail;
	type SeriesListItem = import('$lib/server/series/listing.js').SeriesListItem;

	let { detail }: { detail: ArtistDetail } = $props();

	const workCards = $derived(detail.series.map((s) => ({
		item: {
			id: s.id,
			title: s.titleTh || s.titleEn,
			subtitle: s.titleTh ? s.titleEn : '',
			poster: s.posterUrl,
			status: s.status,
			studio: s.studio ?? 'GL-Orbit',
			genres: []
		} satisfies SeriesListItem,
		roleName: s.roleName
	})));

	function socialLabel(platform: string): string {
		const p = platform.toLowerCase();
		if (p.includes('instagram')) return 'Instagram';
		if (p.includes('twitter') || p === 'x') return 'X (Twitter)';
		if (p.includes('youtube') || p.includes('yt')) return 'YouTube';
		if (p.includes('tiktok')) return 'TikTok';
		if (p.includes('facebook') || p.includes('fb')) return 'Facebook';
		if (p.includes('line')) return 'LINE';
		return platform;
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
		<h2 class="truncate text-sm font-bold text-plum">{detail.nickname}</h2>
		<a href={`/artists/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">
			ดูหน้าเต็ม
		</a>
	</header>

	<div class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 space-y-6">
		<section class="glass-card-strong overflow-hidden rounded-[1.5rem]">
			<div class="relative h-28 bg-gradient-to-br from-coral/25 via-lavender/25 to-mint/20">
				<div class="absolute inset-0 bg-gradient-mesh opacity-80"></div>
				<div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent"></div>
			</div>
			<div class="relative -mt-14 px-4 pb-5 text-center">
				<div class="mx-auto h-28 w-28 rounded-full bg-gradient-to-br from-coral/35 via-cream to-lavender/35 p-1.5 shadow-xl shadow-lavender/25">
					<img src={detail.profileImageUrl} alt={detail.nickname} width={112} height={112} loading="lazy" class="h-full w-full rounded-full object-cover bg-cream" />
				</div>
				<p class="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-coral-dark/70">Artist orbit</p>
				<h3 class="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight text-gradient">{detail.nickname}</h3>
				{#if detail.fullNameEn}<p class="mt-1 text-sm font-medium text-plum-light">{detail.fullNameEn}</p>{/if}
				{#if detail.fullNameTh}<p class="text-sm font-medium text-plum-light/85">{detail.fullNameTh}</p>{/if}

				<div class="mt-4 flex flex-wrap justify-center gap-2">
					<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-lavender-dark">{detail.series.length} ผลงาน</span>
					{#if detail.socials.length > 0}
						<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-mint-dark">{detail.socials.length} ช่องทาง</span>
					{/if}
				</div>
			</div>
		</section>

		{#if detail.socials.length > 0}
			<section>
				<h3 class="mb-3 text-base font-bold text-plum">โซเชียลมีเดีย</h3>
				<div class="grid gap-2">
					{#each detail.socials as social (social.id)}
						<a href={social.url} target="_blank" rel="noopener noreferrer" class="group flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 px-3 py-3 shadow-sm shadow-lavender/10 transition hover:-translate-y-0.5 hover:border-coral/25 hover:bg-white">
							<span class="flex min-w-0 items-center gap-3">
								{#if social.iconUrl}
									<img src={social.iconUrl} alt={social.platform} width={36} height={36} loading="lazy" class="h-9 w-9 rounded-xl object-cover" />
								{:else}
									<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-lavender text-xs font-black text-white">{socialLabel(social.platform).charAt(0)}</span>
								{/if}
								<span class="min-w-0">
									<span class="block truncate text-sm font-bold text-plum">{socialLabel(social.platform)}</span>
									<span class="block truncate text-xs text-plum-light">เปิดลิงก์ภายนอก</span>
								</span>
							</span>
							<svg class="h-4 w-4 shrink-0 text-plum-light transition group-hover:translate-x-0.5 group-hover:text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if workCards.length > 0}
			<section>
				<h3 class="mb-3 text-base font-bold text-plum">ผลงานซีรีส์</h3>
				<div class="grid grid-cols-2 gap-3">
					{#each workCards as work (work.item.id)}
						<div class="space-y-1">
							<SeriesPosterCard item={work.item} />
							{#if work.roleName}
								<p class="px-1 text-xs font-medium text-plum-light">รับบท: {work.roleName}</p>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>
