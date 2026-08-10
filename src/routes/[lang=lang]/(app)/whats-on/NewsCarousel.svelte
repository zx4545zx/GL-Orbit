<script lang="ts">
	import { onMount } from 'svelte';
	import '@splidejs/splide/css/core';
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import type { NewsItem } from '$lib/types/whats-on.js';

	let { news, locale }: { news: NewsItem[]; locale: string } = $props();

	type SplideInstance = InstanceType<typeof import('@splidejs/splide').default>;

	let carouselElement = $state<HTMLElement>();

	function formatNewsDate(dateKey: string) {
		const [year, month, day] = dateKey.split('-').map(Number);
		return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day, 12));
	}

	onMount(() => {
		let disposed = false;
		let splide: SplideInstance | undefined;

		void (async () => {
			const { Splide } = await import('@splidejs/splide');
			if (disposed || !carouselElement) return;

			splide = new Splide(carouselElement, {
				type: 'slide',
				rewind: true,
				perPage: 1,
				perMove: 1,
				autoplay: false,
				arrows: true,
				pagination: true,
				speed: 420,
				i18n: {
					prev: m.whats_on_news_carousel_previous(),
					next: m.whats_on_news_carousel_next()
				},
				reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' }
			}).mount();
		})();

		return () => {
			disposed = true;
			splide?.destroy(true);
		};
	});
</script>

<section
	bind:this={carouselElement}
	class="splide news-carousel"
	aria-label={m.whats_on_news_carousel_label()}
>
	<div class="splide__track">
		<ul class="splide__list">
			{#each news as item (item.id)}
				<li class="splide__slide">
					<article class="news-story">
						{#if item.coverImageUrl}
							<div class="news-cover"><Picture src={item.coverImageUrl} type="posters" sizes="(min-width: 620px) 180px, 35vw" alt={item.headline} class="h-full w-full object-cover" /></div>
						{/if}
						<div class="news-meta">
							<p class="news-kicker">{m.whats_on_news_carousel_kicker()}</p>
							<div class="news-stamp">
								<time datetime={item.publishedDate}>{formatNewsDate(item.publishedDate)}</time>
								<span>{m.whats_on_source_label({ source: item.sourceName })}</span>
							</div>
						</div>
						<div class="news-copy">
							<h3><a href={`/${locale.startsWith('th') ? 'th' : 'en'}/news/${item.slug}`}>{item.headline}</a></h3>
							<p>{item.blurb}</p>
						</div>
					</article>
				</li>
			{/each}
		</ul>
	</div>

	<div class="news-carousel-controls">
		<div class="splide__arrows">
			<button class="splide__arrow splide__arrow--prev" type="button">
				<OrbitIcon name="arrow-left" className="h-4 w-4" />
				<span class="sr-only">{m.whats_on_news_carousel_previous()}</span>
			</button>
			<button class="splide__arrow splide__arrow--next" type="button">
				<OrbitIcon name="arrow-right" className="h-4 w-4" />
				<span class="sr-only">{m.whats_on_news_carousel_next()}</span>
			</button>
		</div>
		<ul class="splide__pagination"></ul>
	</div>
</section>

<style>
	.news-carousel {
		position: relative;
		overflow: visible;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: 4px 4px 0 color-mix(in srgb, var(--orbit-coral-soft) 72%, transparent), var(--orbit-shadow);
	}

	.news-carousel::before {
		position: absolute;
		inset: 0.35rem -0.35rem -0.35rem 0.35rem;
		z-index: -1;
		border: var(--orbit-border-width) dashed color-mix(in srgb, var(--orbit-line-strong) 68%, transparent);
		border-radius: inherit;
		content: '';
	}

	.news-carousel::after {
		position: absolute;
		top: 0.7rem;
		right: 0.85rem;
		width: 2.25rem;
		height: 2.25rem;
		background: var(--orbit-coral);
		clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
		opacity: 0.16;
		pointer-events: none;
		content: '';
	}

	.news-story {
		position: relative;
		isolation: isolate;
		display: grid;
		flex: 1;
		grid-template-columns: minmax(8rem, 0.22fr) minmax(0, 1fr);
		gap: 1.5rem;
		min-height: 12.5rem;
		padding: 1.35rem 1.5rem;
		background:
			linear-gradient(118deg, color-mix(in srgb, var(--orbit-coral-soft) 62%, transparent) 0%, transparent 42%),
			linear-gradient(180deg, color-mix(in srgb, var(--orbit-surface) 96%, var(--orbit-paper)) 0%, var(--orbit-surface) 100%);
		box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--orbit-line) 72%, transparent);
	}

	.news-cover {
		align-self: stretch;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		border: 1px solid var(--orbit-line);
	}

	.news-cover :global(img) { display: block; }
	.news-story:has(.news-cover) { grid-template-columns: minmax(6rem, 0.18fr) minmax(7rem, 0.2fr) minmax(0, 1fr); }

	.splide__slide {
		display: flex;
	}

	.news-story::before,
	.news-story::after {
		position: absolute;
		z-index: -1;
		pointer-events: none;
		content: '';
	}

	.news-story::before {
		inset: 0;
		background-image: var(--orbit-texture-image, none);
		background-repeat: repeat;
		opacity: var(--orbit-texture-opacity, 0);
	}

	.news-story::after {
		right: clamp(0.75rem, 3vw, 2.5rem);
		bottom: 0.6rem;
		width: 10rem;
		height: 7.5rem;
		background-image: var(--orbit-accent-image, none);
		background-position: right bottom;
		background-repeat: no-repeat;
		opacity: 0.72;
	}

	.news-meta {
		position: relative;
		z-index: 1;
		align-self: start;
		padding-top: 0.12rem;
		color: var(--orbit-muted);
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}

	.news-kicker {
		display: inline-block;
		margin: 0 0 0.5rem;
		padding: 0.17rem 0.34rem;
		border: 1px dashed var(--orbit-coral-dark);
		background: color-mix(in srgb, var(--orbit-coral-soft) 52%, var(--orbit-surface));
		color: var(--orbit-coral-dark);
		font-size: 0.57rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		line-height: 1.2;
		text-transform: uppercase;
		transform: rotate(-1.2deg);
	}

	.news-stamp time,
	.news-stamp span {
		display: block;
	}

	.news-stamp time {
		color: var(--orbit-coral-dark);
		font-weight: 800;
	}

	.news-copy {
		position: relative;
		z-index: 1;
		align-self: center;
		padding: 0.2rem 0;
	}

	.news-copy h3 {
		max-width: 42ch;
		margin: 0;
		font-size: clamp(1.1rem, 2vw, 1.35rem);
		font-weight: 700;
		line-height: 1.38;
		text-wrap: pretty;
	}

	.news-copy h3 a {
		color: inherit;
		text-decoration: none;
		transition: color var(--orbit-motion-fast), text-decoration-color var(--orbit-motion-fast);
	}

	.news-copy h3 a:hover {
		color: var(--orbit-link, var(--orbit-coral-dark));
		text-decoration: underline;
		text-underline-offset: 0.18rem;
	}

	.news-copy h3 a:focus-visible,
	.splide__arrow:focus-visible,
	:global(.splide__pagination__page:focus-visible) {
		outline: 2px solid var(--orbit-coral-dark);
		outline-offset: 3px;
	}

	.news-copy p {
		max-width: 64ch;
		margin-top: 0.55rem;
		color: var(--orbit-muted);
		font-size: 0.82rem;
		line-height: 1.65;
	}

	.news-carousel-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 1rem;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		background: color-mix(in srgb, var(--orbit-paper) 54%, var(--orbit-surface));
	}

	.splide__arrows {
		display: flex;
		gap: 0.4rem;
	}

	.splide__arrow {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		font-size: 1rem;
		box-shadow: var(--orbit-shadow-sm);
		transition: transform var(--orbit-motion-fast) var(--orbit-motion-ease), background-color var(--orbit-motion-fast), box-shadow var(--orbit-motion-fast);
	}

	.splide__arrow:hover:not(:disabled) {
		background: var(--orbit-coral-soft);
		transform: translateY(-1px);
		box-shadow: var(--orbit-shadow-raised, var(--orbit-shadow));
	}

	.splide__arrow:active:not(:disabled) { transform: translateY(0) scale(0.96); }

	.splide__arrow:disabled {
		cursor: default;
		opacity: 0.45;
		box-shadow: none;
	}

	:global(.splide__pagination) {
		position: static;
		display: flex;
		width: auto;
		align-items: center;
		gap: 0.4rem;
		padding: 0;
	}

	:global(.splide__pagination__page) {
		width: 0.5rem;
		height: 0.5rem;
		margin: 0;
		border: 0;
		border-radius: 999px;
		background: var(--orbit-line-strong);
		opacity: 1;
	}

	:global(.splide__pagination__page.is-active) {
		width: 1.35rem;
		background: var(--orbit-coral-dark);
		transform: none;
	}

	@media (max-width: 620px) {
		.news-carousel::before {
			inset: 0.25rem -0.2rem -0.2rem 0.2rem;
		}

		.news-story {
			grid-template-columns: 1fr;
			gap: 0.75rem;
			min-height: 0;
			padding: 1rem;
		}

		.news-cover { width: min(10rem, 48vw); }

		.news-story::after {
			right: 0.25rem;
			bottom: 0.1rem;
			width: 7.5rem;
			height: 5.75rem;
			opacity: 0.5;
		}

		.news-copy h3 {
			font-size: 1.12rem;
		}

		.news-copy p {
			font-size: 0.78rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.splide__pagination__page) {
			transition: none;
		}

		.splide__arrow,
		.news-copy h3 a { transition: none; }

		.splide__arrow:hover:not(:disabled),
		.splide__arrow:active:not(:disabled) { transform: none; }
	}
</style>
