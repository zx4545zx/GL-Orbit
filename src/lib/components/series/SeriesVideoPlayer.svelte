<script lang="ts">
	import type { PublicSeriesVideo } from '$lib/server/queries/series-detail.js';
	import {
		SERIES_VIDEO_TYPES,
		seriesVideoTypeLabel,
		type SeriesVideoType
	} from '$lib/series-videos/registry.js';
	import { m } from '$lib/i18n/paraglide.js';

	let { videos, lang }: { videos: PublicSeriesVideo[]; lang: 'th' | 'en' } = $props();
	const groups = $derived(
		SERIES_VIDEO_TYPES.map((entry) => ({
			type: entry.key,
			videos: videos.filter((video) => video.type === entry.key)
		})).filter((group) => group.videos.length > 0)
	);
	let activeType = $state<SeriesVideoType | null>(null);
	let activeVideoId = $state<string | null>(null);
	const availableKey = $derived(groups.map((group) => `${group.type}:${group.videos.map(({ id }) => id).join(',')}`).join('|'));
	const activeGroup = $derived(groups.find((group) => group.type === activeType) ?? groups[0]);
	const selected = $derived(activeGroup?.videos.find((video) => video.id === activeVideoId) ?? activeGroup?.videos[0]);
	const selectedTitle = $derived(selected ? (lang === 'th' ? selected.titleTh : selected.titleEn) : '');
	const embedSrc = $derived(selected ? `https://www.youtube-nocookie.com/embed/${selected.youtubeVideoId}?playsinline=1&rel=0` : '');

	$effect(() => {
		availableKey;
		const matchingGroup = groups.find((group) => group.type === activeType);
		if (!matchingGroup) {
			activeType = groups[0]?.type ?? null;
			activeVideoId = groups[0]?.videos[0]?.id ?? null;
		} else if (!matchingGroup.videos.some((video) => video.id === activeVideoId)) {
			activeVideoId = matchingGroup.videos[0]?.id ?? null;
		}
	});

	function selectType(type: SeriesVideoType) {
		const group = groups.find((item) => item.type === type);
		if (!group) return;
		activeType = type;
		activeVideoId = group.videos[0].id;
	}

	function selectVideo(id: string) {
		if (activeGroup?.videos.some((video) => video.id === id)) activeVideoId = id;
	}
</script>

{#if groups.length > 0 && activeGroup && selected}
	<section aria-labelledby="series-video-heading" class="border-y border-[var(--orbit-line)] py-6">
		<header class="mb-4 flex items-center gap-3">
			<span class="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orbit-accent)]">VID</span>
			<h2 id="series-video-heading" class="text-2xl font-bold text-[var(--orbit-ink)]">{m.series_video_player_heading()}</h2>
		</header>

		<div class="mb-4 flex border border-[var(--orbit-line)]" role="tablist" aria-label={m.series_video_player_type_tabs()}>
			{#each groups as group}
				<button
					type="button"
					role="tab"
					id={`video-tab-${group.type}`}
					aria-controls={`video-panel-${group.type}`}
					aria-selected={activeGroup.type === group.type}
					onclick={() => selectType(group.type)}
					class="min-h-11 border-r border-[var(--orbit-line)] px-4 font-semibold focus-visible:outline focus-visible:outline-2 aria-selected:bg-[var(--orbit-accent)] aria-selected:text-white"
				>{seriesVideoTypeLabel(group.type, lang)}</button>
			{/each}
		</div>

		<div role="tabpanel" id={`video-panel-${activeGroup.type}`} aria-labelledby={`video-tab-${activeGroup.type}`}>
			<div class="aspect-video w-full overflow-hidden border border-[var(--orbit-line-strong)] bg-black">
				<iframe
					class="h-full w-full"
					src={embedSrc}
					title={m.series_video_player_iframe_title({ title: selectedTitle })}
					loading="lazy"
					referrerpolicy="strict-origin-when-cross-origin"
					allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowfullscreen
				></iframe>
			</div>
			<div class="mt-3 grid gap-2 sm:grid-cols-2" aria-label={m.series_video_player_clip_list({ type: seriesVideoTypeLabel(activeGroup.type, lang) })}>
				{#each activeGroup.videos as video, index (video.id)}
					{@const clipTitle = lang === 'th' ? video.titleTh : video.titleEn}
					<button
						type="button"
						aria-pressed={selected.id === video.id}
						onclick={() => selectVideo(video.id)}
						class="min-h-11 border border-[var(--orbit-line)] px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 aria-pressed:border-[var(--orbit-accent)] aria-pressed:bg-[var(--orbit-surface)]"
					>
						{m.series_video_player_clip_position({ title: clipTitle, position: String(index + 1) })}
					</button>
				{/each}
			</div>
		</div>
	</section>
{/if}
