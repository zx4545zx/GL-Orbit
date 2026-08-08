<script lang="ts">
	import { onMount } from 'svelte';
	import type { PublicSeriesVideo } from '$lib/server/queries/series-detail.js';
	import { SERIES_VIDEO_TYPES } from '$lib/series-videos/registry.js';
	import { m } from '$lib/i18n/paraglide.js';
	import '@splidejs/splide/css/core';

	let { videos, lang }: { videos: PublicSeriesVideo[]; lang: 'th' | 'en' } = $props();
	const playableVideos = $derived(
		SERIES_VIDEO_TYPES.flatMap((entry) => videos.filter((video) => video.type === entry.key))
	);

	type SplideInstance = InstanceType<typeof import('@splidejs/splide').default>;

	let splideEl = $state<HTMLElement | undefined>();

	onMount(() => {
		let disposed = false;
		let splide: SplideInstance | undefined;

		(async () => {
			const { Splide } = await import('@splidejs/splide');
			if (disposed || !splideEl || playableVideos.length === 0) return;

			splide = new Splide(splideEl, {
				type: 'slide',
				rewind: true,
				arrows: false,
				pagination: true,
				perPage: 3,
				perMove: 1,
				gap: '16px',
				drag: 'free',
				snap: true,
				speed: 500,
				breakpoints: {
					1099: { perPage: 2 },
					759: { perPage: 1 }
				},
				i18n: {
					prev: m.series_detail_slider_prev(),
					next: m.series_detail_slider_next()
				},
				reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' }
			}).mount();
		})();

		return () => {
			disposed = true;
			splide?.destroy();
		};
	});
</script>

{#if playableVideos.length > 0}
	<section aria-labelledby="series-video-heading" class="pt-6">
		<header class="sd-sec-head">
			<span class="sd-tag">VID</span>
			<h2 id="series-video-heading">{m.series_video_player_heading()}</h2>
			<span class="sd-line"></span>
		</header>

		<div
			class="series-video-splide splide mt-4 px-4"
			bind:this={splideEl}
			role="region"
			aria-labelledby="series-video-heading"
			aria-roledescription="carousel"
		>
			<div class="splide__track">
				<div class="splide__list">
					{#each playableVideos as video (video.id)}
						{@const clipTitle = lang === 'th' ? video.titleTh : video.titleEn}
						<div class="splide__slide">
							<article class="overflow-hidden border border-[var(--orbit-line-strong)] bg-[var(--orbit-surface)]">
								<div class="aspect-video bg-black">
									<iframe
										class="h-full w-full"
										src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?playsinline=1&rel=0`}
										title={m.series_video_player_iframe_title({ title: clipTitle })}
										loading="lazy"
										referrerpolicy="strict-origin-when-cross-origin"
										allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
										allowfullscreen
									></iframe>
								</div>
								<h3 class="box-border h-[59px] line-clamp-2 border-t border-[var(--orbit-line)] px-3 py-2 text-sm font-semibold leading-5 text-[var(--orbit-ink)]">
									{clipTitle}
								</h3>
							</article>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	.series-video-splide { overflow-x: clip; }
	/* Splide core hides uninitialized sliders; keep SSR cards visible. */
	.series-video-splide:global(.splide) { visibility: visible; }
	.series-video-splide :global(.splide__slide) {
		flex: 0 0 auto;
		width: calc((100% - 32px) / 3);
	}
	.series-video-splide :global(.splide__pagination) {
		position: static;
		display: flex;
		justify-content: center;
		gap: 8px;
		padding: 12px 0 2px;
	}
	.series-video-splide :global(.splide__pagination__page) {
		width: 12px;
		height: 12px;
		padding: 0;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: 50%;
		background: var(--orbit-line);
		opacity: 1;
	}
	.series-video-splide :global(.splide__pagination__page.is-active) {
		background: var(--orbit-coral);
		transform: none;
	}
	.series-video-splide :global(.splide__pagination__page:focus-visible) {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}

	@media (max-width: 1099px) {
		.series-video-splide :global(.splide__slide) { width: calc((100% - 16px) / 2); }
	}

	@media (max-width: 759px) {
		.series-video-splide :global(.splide__slide) { width: 100%; }
	}
</style>
