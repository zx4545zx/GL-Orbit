<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import {
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		jsonLdScript,
		localizedPath,
		safeJsonLd,
		truncateSeo
	} from '$lib/seo.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const ship = $derived(data.ship);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const seoTitle = $derived(`${ship.name} | ${m.nav_ships()} GL-Orbit`);
	const seoDescription = $derived(truncateSeo(ship.description || seoTitle));
	const canonicalPath = $derived(`/ships/${ship.slug}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));

	const shareTitle = $derived(currentLang === 'th' ? `ฝากรู้จัก 「${ship.name}」 บน GL-Orbit` : `Meet 「${ship.name}」 on GL-Orbit`);
	const shareText = $derived(currentLang === 'th' ? `มาทำความรู้จักคู่จิ้น「${ship.name}」บน GL-Orbit` : `Meet ship 「${ship.name}」 on GL-Orbit`);
	const shareAriaLabel = $derived(currentLang === 'th' ? 'แชร์คู่จิ้นนี้' : 'Share this ship');

	const primaryMeta = $derived([
		{ label: m.ships_shared_works(), value: ship.series.length },
		{ label: m.common_people(), value: 2 },
		{ label: m.ship_meta_hashtags(), value: ship.hashtags.length }
	]);

	const artistPath = (id: string) => localizedPath(currentLang, `/artists/${id}`);
	const seriesPath = (id: string) => localizedPath(currentLang, `/series/${id}`);
	const backHref = $derived(localizedPath(currentLang, '/ships'));
	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto(localizedPath(currentLang, '/ships'));
	};

	const shipSince = $derived(
		ship.startedAt
			? m.artist_ship_since({
					date: new Intl.DateTimeFormat(currentLang === 'th' ? 'th-TH' : 'en-GB', {
						day: 'numeric',
						month: 'short',
						year: 'numeric'
					}).format(new Date(ship.startedAt))
				})
			: null
	);

	const jsonLd = $derived(
		safeJsonLd([
			{
				'@context': 'https://schema.org',
				'@type': 'ProfilePage',
				name: ship.name,
				description: ship.description,
				image: ship.imageUrl,
				url: canonicalUrl,
				about: [
					{ '@type': 'Person', name: ship.artist1.name },
					{ '@type': 'Person', name: ship.artist2.name }
				]
			},
			buildBreadcrumbJsonLd(page.url.origin, [
				{ name: m.nav_home(), path: localizedPath(currentLang, '') },
				{ name: m.nav_ships(), path: localizedPath(currentLang, '/ships') },
				{ name: ship.name, path: localizedPath(currentLang, canonicalPath) }
			])
		])
	);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="profile" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ship.imageUrl} />
	<meta property="og:image:width" content="400" />
	<meta property="og:image:height" content="600" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={ship.imageUrl} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<div class="sh-page -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[var(--orbit-paper)] pb-[calc(1rem+var(--bottom-nav-reserved-space))] md:mb-0 md:pb-10">
	<main class="sh-wrap" aria-label={ship.name}>

		<!-- HERO: rail panel with merged meta row -->
		<header class="sh-hero">
			<div class="sh-hero-bar">
				<button type="button" onclick={goBack} class="sh-back">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</button>
				<span class="sh-hero-chip">{m.nav_ships()}</span>
			</div>
			<div class="sh-hero-grid">
				<figure class="sh-photo">
					{#if ship.hasImage}
						<Picture
							src={ship.imageUrl}
							type="posters"
							sizes="(max-width: 859px) 100vw, 300px"
							alt={ship.name}
							width={600}
							height={800}
							loading="eager"
							fetchpriority="high"
							class="sh-photo-img"
						/>
					{:else}
						<span class="sh-photo-split">
							<Picture src={ship.artist1.imageUrl} type="profiles" sizes="(max-width: 859px) 50vw, 150px" alt={ship.artist1.name} width={450} height={600} loading="eager" class="sh-photo-img" />
							<Picture src={ship.artist2.imageUrl} type="profiles" sizes="(max-width: 859px) 50vw, 150px" alt={ship.artist2.name} width={450} height={600} loading="eager" class="sh-photo-img" />
						</span>
					{/if}
					<figcaption class="sh-photo-cap">GL-ORBIT / SHIP FILE</figcaption>
				</figure>
				<div class="sh-hero-id">
					<p class="sh-kicker">{m.ship_detail_kicker()}</p>
					<h1 id="ship-name" class="sh-nick">{ship.name}</h1>
					<span class="sh-rule" aria-hidden="true"></span>
					<div class="sh-pair">
						<span class="sh-pair-name">{ship.artist1.name}</span>
						<svg class="sh-pair-heart" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z"/></svg>
						<span class="sh-pair-name">{ship.artist2.name}</span>
					</div>
					{#if shipSince}
						<p class="sh-since">{shipSince}</p>
					{/if}
					{#if ship.hashtags.length > 0}
						<div class="sh-tags">
							{#each ship.hashtags as tag (tag)}
								<span class="sh-tag">#{tag}</span>
							{/each}
						</div>
					{/if}
					{#if ship.isFeatured}
						<span class="sh-feat"><OrbitIcon name="star" className="h-3.5 w-3.5" />{m.artist_ship_featured()}</span>
					{/if}
				</div>
			</div>
			<div class="sh-meta" aria-label="Ship stats">
				{#each primaryMeta as item, index}
					<div class="sh-meta-cell">
						<span class="sh-meta-no">0{index + 1}</span>
						<span class="sh-meta-n">{item.value}</span>
						<span class="sh-meta-k">{item.label}</span>
					</div>
				{/each}
				<ShareButton
					title={shareTitle}
					text={shareText}
					url={canonicalUrl}
					ariaLabel={shareAriaLabel}
					variant="orbit"
					ordinal={null}
					className="h-full min-h-16 w-full !rounded-none !border-0"
				/>
			</div>
		</header>

		<!-- 01 / PAIR -->
		<section aria-labelledby="sh-pair-heading">
			<div class="sh-sec-head">
				<span class="sh-sec-k">01 / Pair</span>
				<h2 id="sh-pair-heading">{m.ship_detail_pair_heading()}</h2>
				<span class="sh-sec-count">2</span>
			</div>
			<div class="sh-pair-grid">
				<a href={artistPath(ship.artist1.id)} class="sh-artist-card">
					<span class="sh-artist-idx">ARTIST 01</span>
					<span class="sh-artist-body">
						<span class="sh-artist-thumb">
							<Picture src={ship.artist1.imageUrl} type="profiles" sizes="72px" alt={ship.artist1.name} width={108} height={144} loading="lazy" class="sh-artist-img" />
						</span>
						<span class="sh-artist-meta">
							<span class="sh-artist-name">{ship.artist1.name}</span>
							<span class="sh-artist-full">{ship.artist1.fullNameTh || ship.artist1.fullNameEn}</span>
						</span>
					</span>
					<svg class="sh-artist-arr h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6" /></svg>
				</a>
				<span class="sh-pair-divider" aria-hidden="true">
					<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z"/></svg>
				</span>
				<a href={artistPath(ship.artist2.id)} class="sh-artist-card">
					<span class="sh-artist-idx">ARTIST 02</span>
					<span class="sh-artist-body">
						<span class="sh-artist-thumb">
							<Picture src={ship.artist2.imageUrl} type="profiles" sizes="72px" alt={ship.artist2.name} width={108} height={144} loading="lazy" class="sh-artist-img" />
						</span>
						<span class="sh-artist-meta">
							<span class="sh-artist-name">{ship.artist2.name}</span>
							<span class="sh-artist-full">{ship.artist2.fullNameTh || ship.artist2.fullNameEn}</span>
						</span>
					</span>
					<svg class="sh-artist-arr h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6" /></svg>
				</a>
			</div>
		</section>

		<!-- 02 / SHARED WORKS -->
		{#if ship.series.length > 0}
			<section aria-labelledby="sh-works-heading">
				<div class="sh-sec-head">
					<span class="sh-sec-k">02 / Shared reel</span>
					<h2 id="sh-works-heading">{m.ships_shared_works()}</h2>
					<span class="sh-sec-count">{ship.series.length}</span>
				</div>
				<div class="sh-works">
					{#each ship.series as s, index (s.id)}
						<a href={seriesPath(s.id)} class="sh-work">
							<span class="sh-work-idx" aria-hidden="true">{String(index + 1).padStart(2, '0')} / WORK</span>
							<span class="sh-work-poster">
								<Picture
									src={s.posterUrl}
									type="posters"
									sizes="(max-width: 859px) 44vw, 220px"
									alt={s.title}
									width={450}
									height={600}
									loading="lazy"
									class="sh-work-img"
								/>
							</span>
							<span class="sh-work-t">{currentLang === 'th' && s.titleTh ? s.titleTh : s.title}</span>
							{#if s.titleTh && currentLang !== 'th'}
								<span class="sh-work-r">{s.titleTh}</span>
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<section aria-labelledby="sh-works-heading">
				<div class="sh-sec-head">
					<span class="sh-sec-k">02 / Shared reel</span>
					<h2 id="sh-works-heading">{m.ships_shared_works()}</h2>
					<span class="sh-sec-count">0</span>
				</div>
				<div class="sh-empty">
					<p class="sh-empty-title">{m.ships_detail_empty_series()}</p>
					<a href={backHref} class="sh-empty-back">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
						<span>{m.artist_detail_empty_back_home()}</span>
					</a>
				</div>
			</section>
		{/if}

		<!-- 03 / STORY -->
		{#if ship.description}
			<section aria-labelledby="sh-story-heading">
				<div class="sh-sec-head">
					<span class="sh-sec-k">03 / Story</span>
					<h2 id="sh-story-heading">{m.ship_detail_story()}</h2>
				</div>
				<div class="sh-story">
					<p>{ship.description}</p>
				</div>
			</section>
		{/if}

		<!-- Orbit Halo banner hidden while the feature is closed; restore the moments link section here. -->

	</main>
</div>

<style>
	.sh-page {
		font-family: var(--orbit-font-body, inherit);
		color: var(--orbit-ink);
	}
	.sh-wrap {
		max-width: 72rem;
		margin-inline: auto;
	}

	/* ============ HERO (rail panel, photo 3:4 + merged meta) ============ */
	.sh-hero {
		margin: 16px 14px 0;
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-menu-dialog);
		box-shadow: var(--orbit-shadow-overlay);
		overflow: hidden;
	}
	.sh-hero-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--orbit-paper) 18%, transparent);
		border-radius: 0 !important;
	}
	.sh-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 4px 12px;
		font-family: var(--orbit-font-display);
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-paper);
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--orbit-paper) 30%, transparent);
		border-radius: var(--orbit-radius-control);
		cursor: pointer;
	}
	.sh-back:hover {
		border-color: var(--orbit-coral);
	}
	.sh-back:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.sh-hero-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-mint);
	}
	.sh-hero-chip::before {
		content: '';
		width: 8px;
		height: 8px;
		background: var(--orbit-coral);
	}
	.sh-hero-grid {
		display: grid;
		grid-template-columns: 1fr;
	}
	.sh-photo {
		position: relative;
	}
	/* inner HUD ticks, token coral */
	.sh-photo::before,
	.sh-photo::after {
		content: '';
		position: absolute;
		width: 14px;
		height: 14px;
		z-index: 2;
		pointer-events: none;
		border: calc(var(--orbit-border-width) + 1px) var(--orbit-border-style) var(--orbit-coral);
	}
	.sh-photo::before {
		top: 10px;
		right: 10px;
		border-left: 0;
		border-bottom: 0;
	}
	.sh-photo::after {
		bottom: 10px;
		left: 10px;
		border-right: 0;
		border-top: 0;
	}
	.sh-photo :global(picture) {
		display: block;
		width: 100%;
	}
	.sh-photo :global(.sh-photo-img) {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.sh-photo-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: color-mix(in srgb, var(--orbit-paper) 18%, transparent);
	}
	.sh-photo-cap {
		position: absolute;
		left: 12px;
		top: 12px;
		font-size: 9px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		text-transform: uppercase;
		color: var(--orbit-paper);
		background: color-mix(in srgb, var(--orbit-rail) 75%, transparent);
		padding: 3px 8px;
	}
	.sh-hero-id {
		padding: 20px 18px 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.sh-kicker {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--orbit-mint);
	}
	.sh-nick {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: clamp(26px, 6vw, 42px);
		line-height: 1.1;
		letter-spacing: -0.015em;
		overflow-wrap: anywhere;
	}
	.sh-rule {
		height: 3px;
		width: 64px;
		margin-top: -2px;
		background: linear-gradient(90deg, var(--orbit-coral), var(--orbit-lavender), var(--orbit-mint));
	}
	.sh-pair {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		border-left: 2px solid var(--orbit-coral);
		padding-left: 12px;
	}
	.sh-pair-name {
		font-weight: 700;
		font-size: clamp(14px, 2.4vw, 16px);
	}
	.sh-pair-heart {
		width: 14px;
		height: 14px;
		color: var(--orbit-coral);
		flex: 0 0 auto;
	}
	.sh-since {
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.75;
	}
	.sh-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.sh-tag {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-paper);
		border: 1px solid color-mix(in srgb, var(--orbit-paper) 30%, transparent);
		border-radius: var(--orbit-radius-badge);
		padding: 3px 9px;
	}
	.sh-feat {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-badge);
		padding: 3px 9px;
		box-shadow: var(--orbit-shadow-interactive);
	}

	/* ============ META ROW (merged into hero bottom) ============ */
	.sh-meta {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-top: 1px solid color-mix(in srgb, var(--orbit-paper) 18%, transparent);
		border-radius: 0 !important;
		background: color-mix(in srgb, var(--orbit-rail) 88%, var(--orbit-ink));
	}
	.sh-meta-cell {
		padding: 10px;
		border-left: 1px solid color-mix(in srgb, var(--orbit-paper) 14%, transparent);
		border-radius: 0 !important;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 6px;
		min-height: 68px;
	}
	.sh-meta-cell:first-child {
		border-left: 0;
	}
	.sh-meta-no {
		font-family: var(--orbit-font-display);
		font-size: 9px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.16em;
		color: var(--orbit-mint);
	}
	.sh-meta-n {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 22px;
		line-height: 1;
		color: var(--orbit-paper);
	}
	.sh-meta-k {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--orbit-paper) 60%, transparent);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	:global([data-theme='midnight']) .sh-hero {
		color: var(--orbit-ink);
	}
	:global([data-theme='midnight']) .sh-hero :is(.sh-back, .sh-hero-chip, .sh-kicker, .sh-photo-cap, .sh-tag, .sh-meta-no, .sh-meta-n) {
		color: var(--orbit-ink);
	}
	:global([data-theme='midnight']) .sh-meta-k {
		color: color-mix(in srgb, var(--orbit-ink) 60%, transparent);
	}

	/* ============ SECTION HEADS ============ */
	.sh-page section {
		margin-top: 28px;
	}
	.sh-sec-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding: 10px 16px 0;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: 0 !important;
	}
	.sh-sec-k {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--orbit-coral-dark);
		white-space: nowrap;
	}
	.sh-sec-head h2 {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 17px;
		text-transform: uppercase;
	}
	.sh-sec-count {
		margin-left: auto;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-badge);
		padding: 4px 10px;
	}

	/* ============ ARTIST PAIR CARDS ============ */
	.sh-pair-grid {
		display: grid;
		gap: 10px;
		padding: 0 16px;
	}
	.sh-artist-card {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 10px;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 12px;
		text-decoration: none;
		color: var(--orbit-ink);
		transition: border-color var(--orbit-motion-fast) var(--orbit-motion-ease);
	}
	.sh-artist-card:hover {
		border-color: var(--orbit-border-interactive);
	}
	.sh-artist-card:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.sh-artist-idx {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.16em;
		color: var(--orbit-coral-dark);
	}
	.sh-artist-body {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.sh-artist-thumb {
		flex: 0 0 56px;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		overflow: hidden;
		background: var(--orbit-paper-deep);
	}
	.sh-artist-thumb :global(picture) {
		display: block;
		width: 100%;
	}
	.sh-artist-thumb :global(.sh-artist-img) {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.sh-artist-meta {
		min-width: 0;
	}
	.sh-artist-name {
		display: block;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 17px;
		overflow-wrap: anywhere;
	}
	.sh-artist-full {
		display: block;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
		margin-top: 2px;
		overflow-wrap: anywhere;
	}
	.sh-artist-arr {
		justify-self: end;
		color: var(--orbit-muted);
	}
	.sh-artist-card:hover .sh-artist-arr {
		color: var(--orbit-coral);
	}
	.sh-pair-divider {
		display: none;
		align-items: center;
		justify-content: center;
	}
	.sh-pair-divider svg {
		width: 22px;
		height: 22px;
		color: var(--orbit-coral);
	}

	/* ============ WORKS (poster grid 3:4) ============ */
	.sh-works {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px 10px;
		padding: 0 16px;
	}
	.sh-work {
		display: block;
		min-width: 0;
		text-decoration: none;
		color: var(--orbit-ink);
	}
	.sh-work:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.sh-work-idx {
		display: block;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.16em;
		color: var(--orbit-coral-dark);
		margin-bottom: 6px;
	}
	.sh-work-poster {
		display: block;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		overflow: hidden;
		background: var(--orbit-paper-deep);
		transition:
			border-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			box-shadow var(--orbit-motion-fast) var(--orbit-motion-ease);
	}
	.sh-work-poster :global(picture) {
		display: block;
		width: 100%;
	}
	.sh-work-poster :global(.sh-work-img) {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.sh-work:hover .sh-work-poster {
		border-color: var(--orbit-coral);
		box-shadow: var(--orbit-shadow-accent);
	}
	.sh-work-t {
		display: block;
		font-weight: 700;
		font-size: 14px;
		margin-top: 8px;
		overflow-wrap: anywhere;
	}
	.sh-work-r {
		display: block;
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.08em;
		color: var(--orbit-muted);
		margin-top: 2px;
		overflow-wrap: anywhere;
	}

	/* ============ EMPTY WORKS ============ */
	.sh-empty {
		margin: 0 16px;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 28px 20px;
		text-align: center;
	}
	.sh-empty-title {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 20px;
	}
	.sh-empty-back {
		margin-top: 16px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 10px 18px;
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		border-radius: var(--orbit-radius-control);
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
	}
	.sh-empty-back:hover {
		background: var(--orbit-coral);
	}
	.sh-empty-back:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}

	/* ============ STORY ============ */
	.sh-story {
		margin: 0 16px;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-left: calc(var(--orbit-border-width) + 2px) var(--orbit-border-style) var(--orbit-coral);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 14px 16px;
		font-size: 14.5px;
		line-height: 1.9;
		white-space: pre-line;
	}

	/* ============ DESKTOP ============ */
	@media (min-width: 860px) {
		.sh-hero {
			margin: 24px 24px 0;
		}
		.sh-hero-grid {
			grid-template-columns: minmax(240px, 300px) 1fr;
		}
		.sh-hero-id {
			padding: 28px 32px;
			gap: 14px;
		}
		.sh-meta-n {
			font-size: 26px;
		}
		.sh-sec-head {
			padding-inline: 24px;
		}
		.sh-pair-grid,
		.sh-works,
		.sh-story,
		.sh-empty {
			margin-inline: 24px;
			padding-inline: 0;
		}
		.sh-pair-grid {
			grid-template-columns: 1fr auto 1fr;
			align-items: stretch;
		}
		.sh-pair-divider {
			display: flex;
		}
		.sh-works {
			grid-template-columns: repeat(3, 1fr);
			gap: 20px 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sh-artist-card,
		.sh-work-poster {
			transition: none;
		}
	}
</style>
