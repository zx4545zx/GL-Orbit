<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import type { SeriesDetail } from '$lib/server/queries/series-detail.js';
	import { localizeSeries } from '$lib/i18n/series.js';
	import { languageTag } from '$lib/i18n/paraglide.js';

	let { detail }: { detail: SeriesDetail } = $props();

	const localized = $derived(localizeSeries(detail, languageTag()));

	const statusConfig: Record<string, { text: string; class: string; bg: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'text-mint-dark', bg: 'bg-mint/20' },
		UPCOMING: { text: m.status_upcoming(), class: 'text-lavender-dark', bg: 'bg-lavender/20' },
		ENDED: { text: m.status_ended(), class: 'text-coral-dark', bg: 'bg-coral/10' }
	};

	const s = $derived(statusConfig[detail.status] ?? null);

	let expandedEpisodes = $state(new Set<number>());
	let initializedId = $state<string | null>(null);

	const episodeHasContent = $derived(
		new Set(
			detail.schedule
				.filter((item) => {
					const hasSchedules = item.schedules.length > 0 && item.schedules.some((s) => s.platform !== 'TBA');
					return hasSchedules || Boolean(item.trailerUrl);
				})
				.map((item) => item.episode)
		)
	);

	const allExpanded = $derived(
		episodeHasContent.size > 0 && episodeHasContent.size === expandedEpisodes.size
	);

	function toggleAll() {
		expandedEpisodes = allExpanded ? new Set() : new Set(episodeHasContent);
	}

	function toggleEpisode(ep: number) {
		if (expandedEpisodes.has(ep)) {
			expandedEpisodes.delete(ep);
		} else {
			expandedEpisodes.add(ep);
		}
		expandedEpisodes = new Set(expandedEpisodes);
	}

	$effect(() => {
		if (initializedId !== detail.id) {
			const next = new Set<number>();
			for (const item of detail.schedule) {
				const hasSchedules = item.schedules.length > 0 && item.schedules.some((s) => s.platform !== 'TBA');
				const hasMedia = Boolean(item.trailerUrl);
				if (hasSchedules || hasMedia) next.add(item.episode);
			}
			expandedEpisodes = next;
			initializedId = detail.id;
		}
	});

	function scheduleSummary(item: typeof detail.schedule[number]): string {
		const valid = item.schedules.filter((s) => s.platform !== 'TBA');
		if (valid.length === 0) return 'TBA';
		if (valid.length === 1) return valid[0].platform;
		return m.series_platform_count({ count: valid.length });
	}

	function isToday(schedules: { airDate: string }[]): boolean {
		const today = new Date().toISOString().split('T')[0];
		return schedules.some((s) => s.airDate === today);
	}

	function firstAirDate(item: typeof detail.schedule[number]): string {
		if (item.schedules.length === 0) return 'TBA';
		return item.schedules[0].airDate;
	}

	function hasUncut(schedules: { isUncut: boolean }[]): boolean {
		return schedules.some((s) => s.isUncut);
	}

	function youtubeEmbedUrl(rawUrl: string | null): string | null {
		if (!rawUrl) return null;
		try {
			const parsed = new URL(rawUrl);
			const host = parsed.hostname.replace(/^www\.|^m\./, '');
			let videoId: string | null = null;
			if (host === 'youtu.be') {
				videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
			} else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
				if (parsed.pathname === '/watch') {
					videoId = parsed.searchParams.get('v');
				} else {
					const parts = parsed.pathname.split('/').filter(Boolean);
					if (['embed', 'shorts', 'live'].includes(parts[0])) videoId = parts[1] ?? null;
				}
			}
			if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return null;
			return `https://www.youtube-nocookie.com/embed/${videoId}`;
		} catch { return null; }
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3">
		<h2 class="truncate text-sm font-bold text-plum">{detail.titleTh || detail.titleEn}</h2>
		<a href={`/series/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">
			{m.common_full_page()}
		</a>
	</header>

	<div class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 space-y-6">
		<!-- Hero -->
		<div class="flex flex-col gap-4">
			<div class="flex items-start gap-4">
				<div class="w-24 shrink-0">
					<Picture src={detail.poster} type="posters" sizes="(max-width: 768px) 50vw, 320px" alt={detail.titleEn} width={200} height={300} loading="lazy" class="w-full rounded-xl shadow-md" />
				</div>
				<div class="min-w-0">
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<span class="rounded-full px-2.5 py-1 text-xs font-bold {s?.bg} {s?.class}">{s?.text}</span>
						<span class="rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-xs font-semibold text-plum-light">{detail.studio}{#if detail.year} • {detail.year}{/if}</span>
					</div>
					<h3 class="font-[family-name:var(--font-display)] text-lg font-extrabold leading-tight text-plum">{detail.titleEn}</h3>
					{#if detail.titleTh}<p class="mt-1 text-sm text-plum-light">{detail.titleTh}</p>{/if}
				</div>
			</div>

			{#if localized.description}
				<p class="rounded-xl border border-white/60 bg-white/45 p-3 text-sm leading-relaxed text-plum-light">{localized.description}</p>
			{/if}

			{#if detail.genres.length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each detail.genres as genre}
						<span class="rounded-full border border-lavender/20 bg-gradient-to-r from-lavender/15 to-coral/10 px-2.5 py-1 text-xs font-semibold text-plum">{genre}</span>
					{/each}
				</div>
			{/if}

			<div class="grid grid-cols-3 gap-2">
				<div class="rounded-xl border border-coral/15 bg-gradient-to-br from-white/70 to-coral/10 p-2 text-center">
					<div class="text-xl font-extrabold text-coral-dark">{detail.episodes}</div>
					<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_episodes()}</div>
				</div>
				{#if detail.year}
					<div class="rounded-xl border border-lavender/20 bg-gradient-to-br from-white/70 to-lavender/15 p-2 text-center">
						<div class="text-xl font-extrabold text-lavender-dark">{detail.year}</div>
						<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_year()}</div>
					</div>
				{/if}
				<div class="rounded-xl border border-mint/20 bg-gradient-to-br from-white/70 to-mint/10 p-2 text-center">
					<div class="text-xl font-extrabold text-mint-dark">{detail.artists.length}</div>
					<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_cast()}</div>
				</div>
			</div>

			{#if detail.platforms.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each detail.platforms as platform}
						<span class="rounded-xl border border-white/70 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-plum shadow-sm flex items-center gap-1.5 max-w-full min-w-0">
							{#if platform.logo}
								<img src={platform.logo} alt={platform.name} width={16} height={16} loading="lazy" class="w-4 h-4 rounded-full object-cover border border-lavender/30" />
							{/if}
							<span class="truncate">{platform.name}</span>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Artists -->
		{#if detail.artists.length > 0}
			<section>
				<h3 class="mb-3 text-base font-bold text-plum">{m.common_cast()}</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each detail.artists as artist}
						<a href={`/artists/${artist.id}`} class="glass-card relative overflow-hidden rounded-xl p-2.5 transition hover:-translate-y-1 hover:shadow-md hover:shadow-lavender/20">
							<div class="flex items-center gap-2.5">
								<Picture src={artist.image} type="profiles" sizes="96px" alt={artist.name} width={44} height={44} loading="lazy" class="h-10 w-10 shrink-0 rounded-xl border border-white/70 object-cover shadow-sm" />
								<div class="min-w-0">
									<div class="truncate text-sm font-bold text-plum">{artist.name}</div>
									<div class="truncate text-xs font-medium text-plum-light">{artist.role}</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Schedule -->
		{#if detail.schedule.length > 0}
			<section>
				<div class="mb-3 flex items-center justify-between gap-3">
					<h3 class="text-base font-bold text-plum">{m.common_schedule()}</h3>
					<button onclick={toggleAll} class="rounded-full border border-coral/30 bg-coral/5 px-3 py-1 text-xs font-semibold text-coral-dark hover:bg-coral/15 transition touch-target">
						{allExpanded ? m.common_collapse_all() : m.common_expand_all()}
					</button>
				</div>
				<div class="glass-card-strong overflow-hidden rounded-xl">
					<div class="divide-y divide-lavender/10">
						{#each detail.schedule as item}
							{@const hasSchedules = item.schedules.length > 0 && item.schedules.some((s) => s.platform !== 'TBA')}
							{@const hasEpisodeMedia = Boolean(item.trailerUrl)}
							{@const hasEpisodeContent = hasSchedules || hasEpisodeMedia}
							{@const trailerEmbedUrl = youtubeEmbedUrl(item.trailerUrl)}
							<div class="transition-all {hasEpisodeContent ? 'hover:bg-white/45 cursor-pointer' : ''}"
								role="button"
								tabindex={hasEpisodeContent ? 0 : undefined}
								onclick={hasEpisodeContent ? () => toggleEpisode(item.episode) : undefined}
								aria-expanded={hasEpisodeContent ? expandedEpisodes.has(item.episode) : undefined}
							>
								<div class="flex items-center justify-between px-3 py-2.5">
									<div class="flex items-center gap-2.5 min-w-0">
										{#if item.coverUrl}
											<div class="relative h-10 w-14 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-lavender/10">
												<Picture src={item.coverUrl} type="posters" sizes="(max-width: 768px) 50vw, 200px" alt={m.series_episode_cover_alt({ episode: item.episode })} width={112} height={63} loading="lazy" class="h-full w-full object-cover" />
												<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/70 to-transparent px-1.5 py-0.5">
													<span class="text-[9px] font-bold text-white">{item.episode}</span>
												</div>
											</div>
										{:else}
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20">
												<span class="text-xs font-bold text-coral-dark">{item.episode}</span>
											</div>
										{/if}
										<div class="min-w-0">
											<div class="truncate text-sm font-bold text-plum">{item.title}</div>
											<div class="truncate text-xs text-plum-light">{scheduleSummary(item)}</div>
										</div>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										{#if isToday(item.schedules)}
											<span class="px-1.5 py-0.5 rounded-full bg-coral/15 text-coral-dark text-[9px] font-bold">{m.common_today()}</span>
										{/if}
										<span class="text-xs font-medium text-coral-dark whitespace-nowrap">{firstAirDate(item)}</span>
										{#if hasEpisodeContent}
											<svg class="w-3.5 h-3.5 text-plum-light transition-transform {expandedEpisodes.has(item.episode) ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
										{/if}
									</div>
								</div>
								{#if hasEpisodeContent && expandedEpisodes.has(item.episode)}
									<div class="px-3 pb-2.5 space-y-2">
										{#if item.trailerUrl && trailerEmbedUrl}
											<div class="overflow-hidden rounded-xl border border-lavender/20">
												<iframe src={trailerEmbedUrl} title={`Trailer ${item.title}`} class="aspect-video w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
											</div>
										{/if}
										{#each item.schedules as sch}
											<div class="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-2.5 py-2">
												<div class="flex items-center gap-2 min-w-0">
													{#if sch.platformLogo}
														<img src={sch.platformLogo} alt={sch.platform} width={24} height={24} loading="lazy" class="w-5 h-5 rounded-full object-cover shrink-0 border border-lavender/30" />
													{:else}
														<div class="w-5 h-5 rounded-full bg-lavender/20 flex items-center justify-center shrink-0 border border-lavender/30">
															<span class="text-[9px] font-bold text-lavender-dark">{sch.platform.charAt(0)}</span>
														</div>
													{/if}
													<div class="min-w-0">
														<div class="flex items-center gap-1">
															<span class="text-sm font-medium text-plum truncate">{sch.platform}</span>
															{#if sch.isUncut}
																<span class="shrink-0 px-1 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[8px] font-bold">Uncut</span>
															{/if}
														</div>
														<div class="text-xs text-plum-light">{sch.airDate}</div>
													</div>
												</div>
												{#if sch.streamLink}
													<a href={sch.streamLink} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-coral to-coral-dark hover:from-coral-dark hover:to-coral transition shrink-0 touch-target">
														{m.series_detail_watch_now()}
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
													</a>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</div>
</div>
