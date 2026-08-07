<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Picture from '$lib/components/Picture.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
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

	const artist = $derived(data.artist);
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);

	const seoTitle = $derived(m.artist_detail_seo_title({ name: artist.nickname }));
	const seoDescription = $derived(
		truncateSeo(m.artist_detail_seo_description({ name: artist.nickname }))
	);
	const canonicalPath = $derived(`/artists/${artist.id}`);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const artistJsonLd = $derived(
		safeJsonLd([
			{
				'@context': 'https://schema.org',
				'@type': 'Person',
				name: artist.nickname,
				additionalName: artist.fullNameEn || undefined,
				alternateName: artist.fullNameTh || undefined,
				image: artist.profileImageUrl,
				url: canonicalUrl,
				sameAs: artist.socials.map((s) => s.url),
				knowsFor: artist.series.map((s) => s.titleEn)
			},
			buildBreadcrumbJsonLd(page.url.origin, [
				{ name: m.nav_home(), path: localizedPath(currentLang, '') },
				{ name: m.nav_artists(), path: localizedPath(currentLang, '/artists') },
				{ name: artist.nickname, path: localizedPath(currentLang, canonicalPath) }
			])
		])
	);

	const primaryMeta = $derived(
		[
			{ label: m.artist_works_label(), value: artist.series.length },
			{ label: m.nav_ships(), value: artist.ships.length },
			{ label: m.artist_socials_label(), value: artist.socials.length }
		]
	);

	const shipPath = (slug: string) => localizedPath(currentLang, `/ships/${slug}`);
	const seriesPath = (id: string) => localizedPath(currentLang, `/series/${id}`);
	const backHref = $derived(localizedPath(currentLang, '/artists'));
	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) history.back();
		else goto(localizedPath(currentLang, '/artists'));
	};

	const shipSince = (startedAt: Date | null) =>
		startedAt
			? m.artist_ship_since({
					date: new Intl.DateTimeFormat(currentLang === 'th' ? 'th-TH' : 'en-GB', {
						day: 'numeric',
						month: 'short',
						year: 'numeric'
					}).format(new Date(startedAt))
				})
			: null;

	type SocialMeta = {
		label: string;
		stroke: boolean;
		icon: string;
	};

	const IG = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
	const X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
	const YT = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505 3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
	const TT = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
	const FB = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
	const LINE = 'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.05.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';
	const GLOBE = 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zm0 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20z';

	function socialMeta(platform: string): SocialMeta {
		const p = platform.toLowerCase();
		if (p.includes('instagram')) return { label: 'Instagram', stroke: false, icon: IG };
		if (p.includes('twitter') || p === 'x') return { label: 'X (Twitter)', stroke: false, icon: X };
		if (p.includes('youtube') || p.includes('yt')) return { label: 'YouTube', stroke: false, icon: YT };
		if (p.includes('tiktok')) return { label: 'TikTok', stroke: false, icon: TT };
		if (p.includes('facebook') || p.includes('fb')) return { label: 'Facebook', stroke: false, icon: FB };
		if (p.includes('line')) return { label: 'LINE', stroke: false, icon: LINE };
		return { label: platform, stroke: true, icon: GLOBE };
	}
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
	<meta property="og:image" content={artist.profileImageUrl} />
	<meta property="og:image:width" content="400" />
	<meta property="og:image:height" content="400" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={artist.profileImageUrl} />
	{@html jsonLdScript(artistJsonLd)}
</svelte:head>

<div class="ad-page -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[var(--orbit-paper)] pb-[calc(1rem+var(--bottom-nav-reserved-space))] md:mb-0 md:pb-10">
	<main class="ad-wrap" aria-label={artist.nickname}>

		<!-- HERO: rail panel with merged meta row -->
		<header class="ad-hero">
			<div class="ad-hero-bar">
				<button type="button" onclick={goBack} class="ad-back">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					<span>{m.common_back()}</span>
				</button>
				<span class="ad-hero-chip">{m.common_cast()}</span>
			</div>
			<div class="ad-hero-grid">
				<figure class="ad-photo">
					<Picture
						src={artist.profileImageUrl}
						type="profiles"
						sizes="(max-width: 859px) 100vw, 300px"
						alt={artist.nickname}
						width={600}
						height={800}
						loading="eager"
						fetchpriority="high"
						class="ad-photo-img"
					/>
					<figcaption class="ad-photo-cap">GL-ORBIT / ARTIST FILE</figcaption>
				</figure>
				<div class="ad-hero-id">
					<p class="ad-kicker">{m.artist_detail_kicker()}</p>
					<h1 id="artist-name" class="ad-nick">{artist.nickname}</h1>
					<span class="ad-rule" aria-hidden="true"></span>
					{#if artist.fullNameEn || artist.fullNameTh}
						<div class="ad-fullname">
							{#if artist.fullNameTh}<div class="ad-fname">{artist.fullNameTh}</div>{/if}
							{#if artist.fullNameEn}<div class="ad-ename">{artist.fullNameEn}</div>{/if}
						</div>
					{/if}
					<p class="ad-counts">
						{artist.series.length} {m.artist_works_label()} · {artist.ships.length} {m.nav_ships()} · {artist.socials.length} {m.artist_socials_label()}
					</p>
				</div>
			</div>
			<div class="ad-meta" aria-label="Artist stats">
				{#each primaryMeta as item, index}
					<div class="ad-meta-cell">
						<span class="ad-meta-no">0{index + 1}</span>
						<span class="ad-meta-n">{item.value}</span>
						<span class="ad-meta-k">{item.label}</span>
					</div>
				{/each}
				<ShareButton
					title={m.artist_share_title({ name: artist.nickname })}
					text={m.artist_share_text({ name: artist.nickname })}
					url={canonicalUrl}
					ariaLabel={m.artist_share_aria_label()}
					variant="orbit"
					ordinal={null}
					className="h-full min-h-16 w-full !rounded-none !border-0"
				/>
			</div>
		</header>

		<!-- 01 / SOCIAL -->
		{#if artist.socials.length > 0}
			<section aria-labelledby="ad-social-heading">
				<div class="ad-sec-head">
					<span class="ad-sec-k">01 / Social</span>
					<h2 id="ad-social-heading">{m.artist_socials_heading()}</h2>
					<span class="ad-sec-count">{artist.socials.length}</span>
				</div>
				<div class="ad-soc-grid">
					{#each artist.socials as social (social.id)}
						{@const meta = socialMeta(social.platform)}
						<a href={social.url} target="_blank" rel="noopener noreferrer" class="ad-soc-card">
							<span class="ad-soc-ico" aria-hidden="true">
								{#if social.iconUrl}
									<img src={social.iconUrl} alt="" width={20} height={20} loading="lazy" decoding="async" class="h-5 w-5 object-cover" />
								{:else if meta.stroke}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={meta.icon} /></svg>
								{:else}
									<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d={meta.icon} /></svg>
								{/if}
							</span>
							<span class="ad-soc-text">
								<span class="ad-soc-name">{meta.label}</span>
								<span class="ad-soc-url">{social.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
							</span>
							<svg class="ad-soc-arr h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 02 / FILMOGRAPHY -->
		{#if artist.series.length > 0}
			<section aria-labelledby="ad-works-heading">
				<div class="ad-sec-head">
					<span class="ad-sec-k">02 / Filmography</span>
					<h2 id="ad-works-heading">{m.artist_works_heading()}</h2>
					<span class="ad-sec-count">{artist.series.length}</span>
				</div>
				<div class="ad-works">
					{#each artist.series as s, index (s.id)}
						<a href={seriesPath(s.id)} class="ad-work">
							<span class="ad-work-idx" aria-hidden="true">{String(index + 1).padStart(2, '0')} / WORK</span>
							<span class="ad-work-poster">
								<Picture
									src={s.posterUrl}
									type="posters"
									sizes="(max-width: 859px) 44vw, 220px"
									alt={s.titleEn}
									width={450}
									height={600}
									loading="lazy"
									class="ad-work-img"
								/>
							</span>
							<span class="ad-work-t">{currentLang === 'th' && s.titleTh ? s.titleTh : s.titleEn}</span>
							<span class="ad-work-r">{m.artist_works_role({ role: s.roleName })}</span>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<section aria-labelledby="ad-works-heading">
				<div class="ad-sec-head">
					<span class="ad-sec-k">02 / Filmography</span>
					<h2 id="ad-works-heading">{m.artist_works_heading()}</h2>
					<span class="ad-sec-count">0</span>
				</div>
				<div class="ad-empty">
					<p class="ad-empty-title">{m.artist_detail_empty_title()}</p>
					<p class="ad-empty-desc">{m.artist_detail_empty_desc()}</p>
					<a href={backHref} class="ad-empty-back">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
						<span>{m.artist_detail_empty_back_home()}</span>
					</a>
				</div>
			</section>
		{/if}

		<!-- 03 / CHEMISTRY -->
		{#if artist.ships.length > 0}
			<section aria-labelledby="ad-ships-heading">
				<div class="ad-sec-head">
					<span class="ad-sec-k">03 / Chemistry</span>
					<h2 id="ad-ships-heading">{m.series_detail_ships()}</h2>
					<span class="ad-sec-count">{artist.ships.length}</span>
				</div>
				<div class="ad-ship-grid">
					{#each artist.ships as ship (ship.id)}
						<a href={shipPath(ship.slug)} class="ad-ship-card">
							<span class="ad-ship-faces">
								<span class="ad-ship-face orbit-round-data">
									<Picture src={artist.profileImageUrl} type="profiles" sizes="56px" alt={artist.nickname} width={112} height={112} loading="lazy" class="ad-face-img" />
								</span>
								<span class="ad-ship-face ad-ship-face-2 orbit-round-data">
									<Picture src={ship.partner.imageUrl} type="profiles" sizes="56px" alt={ship.partner.nickname} width={112} height={112} loading="lazy" class="ad-face-img" />
								</span>
							</span>
							<span class="ad-ship-body">
								<span class="ad-ship-names">{ship.name}</span>
								{#if shipSince(ship.startedAt)}
									<span class="ad-ship-since">{shipSince(ship.startedAt)}</span>
								{/if}
								<span class="ad-ship-pair">{artist.nickname} × {ship.partner.nickname}</span>
								{#if ship.description}
									<span class="ad-ship-desc">{ship.description}</span>
								{/if}
								{#if ship.hashtags.length > 0}
									<span class="ad-ship-tags">
										{#each ship.hashtags as tag (tag)}
											<span class="ad-ship-tag">#{tag}</span>
										{/each}
									</span>
								{/if}
								{#if ship.isFeatured}
									<span class="ad-ship-feat">{m.artist_ship_featured()}</span>
								{/if}
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Orbit Halo banner hidden while the feature is closed; restore the moments link section here. -->

	</main>
</div>

<style>
	.ad-page {
		font-family: var(--orbit-font-body, inherit);
		color: var(--orbit-ink);
	}
	.ad-wrap {
		max-width: 72rem;
		margin-inline: auto;
	}

	/* ============ HERO (rail panel, photo 3:4 + merged meta) ============ */
	.ad-hero {
		margin: 16px 14px 0;
		background: var(--orbit-rail);
		color: var(--orbit-paper);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-menu-dialog);
		box-shadow: var(--orbit-shadow-overlay);
		overflow: hidden;
	}
	.ad-hero-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--orbit-paper) 18%, transparent);
	}
	.ad-back {
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
	.ad-back:hover {
		border-color: var(--orbit-coral);
	}
	.ad-back:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.ad-hero-chip {
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
	.ad-hero-chip::before {
		content: '';
		width: 8px;
		height: 8px;
		background: var(--orbit-coral);
	}
	.ad-hero-grid {
		display: grid;
		grid-template-columns: 1fr;
	}
	.ad-photo {
		position: relative;
	}
	/* inner HUD ticks, token coral */
	.ad-photo::before,
	.ad-photo::after {
		content: '';
		position: absolute;
		width: 14px;
		height: 14px;
		z-index: 2;
		pointer-events: none;
		border: calc(var(--orbit-border-width) + 1px) var(--orbit-border-style) var(--orbit-coral);
	}
	.ad-photo::before {
		top: 10px;
		right: 10px;
		border-left: 0;
		border-bottom: 0;
	}
	.ad-photo::after {
		bottom: 10px;
		left: 10px;
		border-right: 0;
		border-top: 0;
	}
	.ad-photo :global(picture) {
		display: block;
		width: 100%;
	}
	.ad-photo :global(.ad-photo-img) {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.ad-photo-cap {
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
	.ad-hero-id {
		padding: 20px 18px 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.ad-kicker {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--orbit-mint);
	}
	.ad-nick {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: clamp(26px, 6vw, 42px);
		line-height: 1.1;
		letter-spacing: -0.015em;
		overflow-wrap: anywhere;
	}
	.ad-rule {
		height: 3px;
		width: 64px;
		margin-top: -2px;
		background: linear-gradient(90deg, var(--orbit-coral), var(--orbit-lavender), var(--orbit-mint));
	}
	.ad-fullname {
		border-left: 2px solid var(--orbit-coral);
		padding-left: 12px;
	}
	.ad-fname {
		font-weight: 700;
		font-size: clamp(14px, 2.4vw, 16px);
	}
	.ad-ename {
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.75;
		margin-top: 3px;
	}
	.ad-counts {
		margin-top: auto;
		padding-top: 12px;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		opacity: 0.7;
	}

	/* ============ META ROW (merged into hero bottom) ============ */
	.ad-meta {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-top: 1px solid color-mix(in srgb, var(--orbit-paper) 18%, transparent);
		background: color-mix(in srgb, var(--orbit-rail) 88%, var(--orbit-ink));
	}
	.ad-meta-cell {
		padding: 10px;
		border-left: 1px solid color-mix(in srgb, var(--orbit-paper) 14%, transparent);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 6px;
		min-height: 68px;
	}
	.ad-meta-cell:first-child {
		border-left: 0;
	}
	.ad-meta-no {
		font-family: var(--orbit-font-display);
		font-size: 9px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.16em;
		color: var(--orbit-mint);
	}
	.ad-meta-n {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 22px;
		line-height: 1;
		color: var(--orbit-paper);
	}
	.ad-meta-k {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--orbit-paper) 60%, transparent);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	:global([data-theme='midnight']) .ad-hero {
		color: var(--orbit-ink);
	}
	:global([data-theme='midnight']) .ad-hero :is(.ad-back, .ad-hero-chip, .ad-kicker, .ad-photo-cap, .ad-meta-no, .ad-meta-n) {
		color: var(--orbit-ink);
	}
	:global([data-theme='midnight']) .ad-meta-k {
		color: color-mix(in srgb, var(--orbit-ink) 60%, transparent);
	}

	/* ============ SECTION HEADS ============ */
	.ad-page section {
		margin-top: 28px;
	}
	.ad-sec-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding: 10px 16px 0;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
	}
	.ad-sec-k {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--orbit-coral-dark);
		white-space: nowrap;
	}
	.ad-sec-head h2 {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 17px;
		text-transform: uppercase;
	}
	.ad-sec-count {
		margin-left: auto;
		font-size: 11px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-badge);
		padding: 4px 10px;
	}

	/* ============ SOCIAL CARDS ============ */
	.ad-soc-grid {
		display: grid;
		gap: 10px;
		padding: 0 16px;
	}
	.ad-soc-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
		text-decoration: none;
		color: var(--orbit-ink);
		min-height: 56px;
		transition:
			border-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			background var(--orbit-motion-fast) var(--orbit-motion-ease);
	}
	.ad-soc-card:hover {
		border-color: var(--orbit-border-interactive);
	}
	.ad-soc-card:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.ad-soc-ico {
		width: 32px;
		height: 32px;
		flex: 0 0 32px;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-control);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.ad-soc-text {
		min-width: 0;
	}
	.ad-soc-name {
		display: block;
		font-weight: 700;
		font-size: 14px;
	}
	.ad-soc-url {
		display: block;
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		color: var(--orbit-muted);
		margin-top: 1px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.ad-soc-arr {
		margin-left: auto;
		flex-shrink: 0;
		color: var(--orbit-muted);
	}
	.ad-soc-card:hover .ad-soc-arr {
		color: var(--orbit-coral);
	}

	/* ============ WORKS (poster grid 3:4) ============ */
	.ad-works {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px 10px;
		padding: 0 16px;
	}
	.ad-work {
		display: block;
		min-width: 0;
		text-decoration: none;
		color: var(--orbit-ink);
	}
	.ad-work:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.ad-work-idx {
		display: block;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.16em;
		color: var(--orbit-coral-dark);
		margin-bottom: 6px;
	}
	.ad-work-poster {
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
	.ad-work-poster :global(picture) {
		display: block;
		width: 100%;
	}
	.ad-work-poster :global(.ad-work-img) {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		object-fit: cover;
	}
	.ad-work:hover .ad-work-poster {
		border-color: var(--orbit-coral);
		box-shadow: var(--orbit-shadow-accent);
	}
	.ad-work-t {
		display: block;
		font-weight: 700;
		font-size: 14px;
		margin-top: 8px;
		overflow-wrap: anywhere;
	}
	.ad-work-r {
		display: block;
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--orbit-muted);
		margin-top: 2px;
	}

	/* ============ EMPTY WORKS ============ */
	.ad-empty {
		margin: 0 16px;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow-surface);
		padding: 28px 20px;
		text-align: center;
	}
	.ad-empty-title {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 20px;
	}
	.ad-empty-desc {
		margin-top: 8px;
		font-size: 14px;
		color: var(--orbit-muted);
	}
	.ad-empty-back {
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
	.ad-empty-back:hover {
		background: var(--orbit-coral);
	}
	.ad-empty-back:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}

	/* ============ SHIP CARDS ============ */
	.ad-ship-grid {
		margin: 0 16px;
		display: grid;
		gap: 1px;
		background: var(--orbit-line);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-accent);
		overflow: hidden;
	}
	.ad-ship-card {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 14px;
		align-items: center;
		background: var(--orbit-paper);
		padding: 14px;
		text-decoration: none;
		color: var(--orbit-ink);
		transition: background var(--orbit-motion-fast) var(--orbit-motion-ease);
	}
	.ad-ship-card:hover {
		background: var(--orbit-surface);
	}
	.ad-ship-card:focus-visible {
		outline: 2px solid var(--orbit-border-focus);
		outline-offset: 2px;
	}
	.ad-ship-faces {
		display: flex;
		align-items: center;
	}
	.ad-ship-face {
		width: 56px;
		height: 56px;
		overflow: hidden;
		border: 2px solid var(--orbit-surface);
		box-shadow: var(--orbit-shadow-surface);
		background: var(--orbit-coral-soft);
	}
	.ad-ship-face-2 {
		background: var(--orbit-lavender);
		margin-left: -14px;
		margin-top: 16px;
	}
	.ad-ship-face :global(.ad-face-img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.ad-ship-body {
		min-width: 0;
	}
	.ad-ship-names {
		display: block;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		font-size: 18px;
		overflow-wrap: anywhere;
	}
	.ad-ship-since {
		display: block;
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--orbit-muted);
		margin-top: 2px;
	}
	.ad-ship-pair {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: var(--orbit-muted);
		margin-top: 2px;
	}
	.ad-ship-desc {
		display: block;
		font-size: 13.5px;
		margin-top: 8px;
	}
	.ad-ship-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}
	.ad-ship-tag {
		font-family: var(--orbit-font-display);
		font-size: 10px;
		font-weight: var(--orbit-font-label-weight);
		background: var(--orbit-surface);
		color: var(--orbit-coral-dark);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-default);
		border-radius: var(--orbit-radius-badge);
		padding: 2px 8px;
	}
	.ad-ship-feat {
		display: inline-block;
		margin-top: 10px;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-badge);
		padding: 2px 8px;
		box-shadow: var(--orbit-shadow-interactive);
	}

	/* ============ DESKTOP ============ */
	@media (min-width: 860px) {
		.ad-hero {
			margin: 24px 24px 0;
		}
		.ad-hero-grid {
			grid-template-columns: minmax(240px, 300px) 1fr;
		}
		.ad-hero-id {
			padding: 28px 32px;
			gap: 14px;
		}
		.ad-meta-n {
			font-size: 26px;
		}
		.ad-sec-head {
			padding-inline: 24px;
		}
		.ad-soc-grid,
		.ad-works,
		.ad-ship-grid,
		.ad-empty {
			margin-inline: 24px;
			padding-inline: 0;
		}
		.ad-soc-grid {
			grid-template-columns: repeat(3, 1fr);
		}
		.ad-works {
			grid-template-columns: repeat(3, 1fr);
			gap: 20px 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ad-soc-card,
		.ad-ship-card,
		.ad-work-poster {
			transition: none;
		}
	}
</style>
