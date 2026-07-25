<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';

	import { page } from '$app/state';
	import {
		DEFAULT_OG_IMAGE,
		DEFAULT_SEO_DESCRIPTION,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_TYPE,
		OG_IMAGE_WIDTH,
		SITE_NAME,
		absoluteUrl,
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		buildWebPageJsonLd,
		jsonLdScript,
		localizedPath,
		safeJsonLd
	} from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';
	import type { CountdownItem } from '$lib/types/home.js';

	let { data }: { data: PageData } = $props();

	const countdownItems = $derived<CountdownItem[]>(data.countdown);

	const stagger60Classes = [
		'stagger-60-0',
		'stagger-60-1',
		'stagger-60-2',
		'stagger-60-3',
		'stagger-60-4',
		'stagger-60-5',
		'stagger-60-6',
		'stagger-60-7',
		'stagger-60-8'
	] as const;

	function stagger60Class(index: number): string {
		return stagger60Classes[Math.min(index, stagger60Classes.length - 1)];
	}

	const SEO_TITLE = m.countdown_seo_title();
	const SEO_DESCRIPTION = m.countdown_seo_description();

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = '/countdown';
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const calendarPath = $derived(localizedPath(currentLang, '/calendar'));
	const jsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, canonicalPath), SEO_TITLE, SEO_DESCRIPTION, currentLang),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: localizedPath(currentLang, '') },
			{ name: m.countdown_breadcrumb(), path: localizedPath(currentLang, canonicalPath) }
		])
	]));

	// --- Live countdown clock ---
	// `now` ticks every second so the HH:MM:SS tiles update in real time.
	let now = $state(Date.now());
	$effect(() => {
		if (countdownItems.length === 0) return;
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	interface ActiveCountdown extends CountdownItem {
		diff: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		airLabel: string;
	}

	// Only keep airings still in the future — when `diff <= 0` the card disappears.
	const activeCountdowns = $derived<ActiveCountdown[]>(
		countdownItems
			.map((item) => {
				const target = new Date(item.airDate);
				const diff = target.getTime() - now;
				return {
					...item,
					diff,
					days: Math.max(0, Math.floor(diff / 86_400_000)),
					hours: Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000)),
					minutes: Math.max(0, Math.floor((diff % 3_600_000) / 60_000)),
					seconds: Math.max(0, Math.floor((diff % 60_000) / 1_000)),
					airLabel: new Intl.DateTimeFormat(page.data.lang, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(target),
				};
			})
			.filter((c) => c.diff > 0)
	);

	// The closest airing gets the spotlight panel; the rest render as grid cards.
	const nextUp = $derived<ActiveCountdown | null>(activeCountdowns[0] ?? null);
	const restCountdowns = $derived<ActiveCountdown[]>(activeCountdowns.slice(1));

	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<svelte:head>
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={SEO_TITLE} />
	<meta property="og:description" content={SEO_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={SEO_TITLE} />
	<meta name="twitter:description" content={SEO_DESCRIPTION} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<!-- Hero -->
<header class="cd-hero">
	<div class="cd-hero-main">
		<span class="cd-kicker animate-slide-up">
			<span class="cd-blink" aria-hidden="true"></span>
			{m.home_countdown_badge()}
		</span>
		<h1 class="cd-title animate-slide-up stagger-1">
			{m.countdown_title_plain()} <span class="cd-title-accent">{m.countdown_title_accent()}</span> ✦
		</h1>
		<p class="cd-sub animate-slide-up stagger-2">{m.countdown_subtitle()}</p>
		<div class="cd-hero-actions animate-slide-up stagger-3">
			<a href={calendarPath} class="cd-btn">← {m.countdown_view_calendar()}</a>
		</div>
	</div>

	<div class="cd-stats animate-slide-up stagger-3">
		<div class="cd-stat">
			<div class="cd-stat-label">{m.countdown_tracking_label()}</div>
			<div class="cd-stat-num tabular-nums">{activeCountdowns.length}</div>
			<div class="cd-stat-detail">{m.countdown_tracking_suffix()}</div>
		</div>
		{#if nextUp}
			<div class="cd-stat">
				<div class="cd-stat-label">{m.countdown_stat_next_label()}</div>
				<div class="cd-stat-name">{nextUp.title}</div>
				<div class="cd-stat-detail"><b>{nextUp.episode}</b> · {nextUp.airLabel}</div>
			</div>
		{/if}
	</div>
</header>

{#if activeCountdowns.length === 0}
	{@render emptyState()}
{:else}
	<!-- Next-up spotlight -->
	{#if nextUp}
		<h2 class="cd-section-title"><span class="cd-spark" aria-hidden="true">✦</span> {m.countdown_next_up()}</h2>
		<section class="cd-spotlight" aria-label={m.countdown_next_up()}>
			<a href="/{page.data.lang}/series/{nextUp.seriesId}" class="cd-spotlight-poster" tabindex="-1" aria-hidden="true">
				<Picture
					src={nextUp.poster}
					type="posters"
					sizes="(max-width: 639px) 100vw, 220px"
					alt=""
					width={440}
					height={660}
					class="cd-poster-img"
					loading="eager"
					decoding="async"
				/>
			</a>
			<div class="cd-spotlight-body">
				<span class="cd-spotlight-tag">{m.countdown_spotlight_tag()} ★ {nextUp.episode}</span>
				<h3 class="cd-spotlight-name">
					<a href="/{page.data.lang}/series/{nextUp.seriesId}" class="cd-spotlight-link">{nextUp.title}</a>
				</h3>
				<div class="cd-spotlight-meta">
					{#if nextUp.isUncut}<span class="cd-badge-uncut">UNCUT</span>{/if}
					<span class="cd-chip">{nextUp.platform}</span>
					<span class="cd-spotlight-air">{nextUp.airLabel}</span>
				</div>
				<div class="cd-flip" aria-label={m.countdown_next_up()}>
					{@render flipUnit(pad(nextUp.days), m.common_days())}
					<span class="cd-flip-sep" aria-hidden="true">:</span>
					{@render flipUnit(pad(nextUp.hours), m.common_hours_short())}
					<span class="cd-flip-sep" aria-hidden="true">:</span>
					{@render flipUnit(pad(nextUp.minutes), m.common_minutes_short())}
					<span class="cd-flip-sep" aria-hidden="true">:</span>
					{@render flipUnit(pad(nextUp.seconds), m.common_seconds_short())}
				</div>
			</div>
		</section>
	{/if}

	<!-- All remaining countdowns -->
	{#if restCountdowns.length > 0}
		<h2 class="cd-section-title"><span class="cd-spark" aria-hidden="true">✧</span> {m.countdown_all_title()}</h2>
		<section class="cd-grid" aria-label={m.countdown_all_title()}>
			{#each restCountdowns as c, i (c.id)}
				<a
					href="/{page.data.lang}/series/{c.seriesId}"
					class="cd-card animate-slide-up fill-mode-both {stagger60Class(i)}"
				>
					<div class="cd-card-head">
						<div class="cd-card-poster">
							<Picture
								src={c.poster}
								type="posters"
								sizes="3.25rem"
								alt=""
								width={104}
								height={156}
								class="cd-poster-img"
								loading="lazy"
								decoding="async"
							/>
						</div>
						<div class="cd-card-info">
							<span class="cd-card-name">{c.title}</span>
							<span class="cd-card-ep">{c.episode}</span>
							<span class="cd-card-chips">
								{#if c.isUncut}<span class="cd-badge-uncut">UNCUT</span>{/if}
								<span class="cd-chip">{c.platform}</span>
							</span>
						</div>
					</div>
					<div class="cd-card-count">
						<span class="cd-days-left"><b class="tabular-nums">{c.days}</b> {m.common_days()}</span>
						<div class="cd-flip">
							{@render flipUnit(pad(c.hours), m.common_hours_short())}
							<span class="cd-flip-sep" aria-hidden="true">:</span>
							{@render flipUnit(pad(c.minutes), m.common_minutes_short())}
							<span class="cd-flip-sep" aria-hidden="true">:</span>
							{@render flipUnit(pad(c.seconds), m.common_seconds_short())}
						</div>
					</div>
					<div class="cd-card-foot">
						<span>{c.airLabel}</span>
						<span class="cd-card-go" aria-hidden="true">→</span>
					</div>
				</a>
			{/each}
		</section>
	{/if}
{/if}

{#snippet flipUnit(value: string, label: string)}
	<span class="cd-flip-unit">
		<span class="cd-flip-val tabular-nums">{value}</span>
		<span class="cd-flip-lab">{label}</span>
	</span>
{/snippet}

{#snippet emptyState()}
	<div class="cd-empty">
		<div class="cd-empty-icon" aria-hidden="true">
			<svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
		</div>
		<h3 class="cd-empty-title">{m.countdown_empty_title()}</h3>
		<p class="cd-empty-desc">{m.countdown_empty_desc()}</p>
	</div>
{/snippet}

<style>
	/* ===== hero ===== */
	.cd-hero {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 32px;
		align-items: end;
		padding: 32px 0;
	}
	.cd-kicker {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--orbit-font-display);
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		padding: 6px 12px;
		box-shadow: var(--orbit-shadow);
		border-radius: var(--orbit-radius-badge);
		margin-bottom: 16px;
	}
	.cd-blink {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--orbit-coral);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		animation: cd-blink 1.1s steps(2, start) infinite;
	}
	@keyframes cd-blink { to { visibility: hidden; } }
	.cd-title {
		font-family: var(--orbit-font-display);
		font-size: clamp(34px, 6vw, 60px);
		font-weight: var(--orbit-font-heading-weight, 700);
		color: var(--orbit-ink);
		line-height: 1.15;
		margin: 0 0 12px;
	}
	.cd-title-accent {
		color: var(--orbit-coral);
		text-shadow: 3px 3px 0 var(--orbit-lavender);
	}
	.cd-sub {
		color: var(--orbit-muted);
		font-size: 17px;
		max-width: 46ch;
		margin: 0 0 24px;
		line-height: 1.6;
	}
	.cd-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }

	.cd-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 10px 18px;
		font-family: var(--orbit-font-display);
		font-size: 14px;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		text-decoration: none;
		user-select: none;
		transition: transform 0.08s ease, box-shadow 0.08s ease;
	}
	.cd-btn:hover { text-decoration: none; transform: translate(-1px, -1px); box-shadow: var(--orbit-shadow-raised); }
	.cd-btn:active { transform: translate(2px, 2px); box-shadow: none; }

	.cd-stats { display: grid; grid-template-columns: 1fr; gap: 14px; }
	.cd-stat {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		padding: 14px 18px;
	}
	.cd-stat-label { font-size: 13px; font-weight: 600; color: var(--orbit-muted); }
	.cd-stat-num {
		font-family: var(--orbit-font-display);
		font-size: 30px;
		color: var(--orbit-coral-dark);
		line-height: 1.1;
	}
	.cd-stat-name {
		font-family: var(--orbit-font-display);
		font-size: 16px;
		color: var(--orbit-coral-dark);
		line-height: 1.3;
		padding-top: 6px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cd-stat-detail { font-size: 13px; margin-top: 2px; color: var(--orbit-muted); }
	.cd-stat-detail b { color: var(--orbit-ink); }

	/* ===== section titles ===== */
	.cd-section-title {
		font-family: var(--orbit-font-display);
		font-size: 20px;
		text-transform: uppercase;
		color: var(--orbit-ink);
		margin: 0 0 16px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.cd-spark { color: var(--orbit-coral); }

	/* ===== shared bits ===== */
	.cd-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		line-height: 1.4;
		white-space: nowrap;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-surface);
		color: var(--orbit-ink);
	}
	.cd-badge-uncut {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-coral);
		color: var(--orbit-surface);
	}
	.cd-spotlight-poster :global(img), .cd-card-poster :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* ===== flip tiles ===== */
	.cd-flip { display: flex; align-items: flex-start; gap: 6px; font-family: var(--orbit-font-display); }
	.cd-flip-unit { display: grid; justify-items: center; gap: 4px; }
	.cd-flip-val {
		min-width: 48px;
		text-align: center;
		font-size: 26px;
		font-weight: 700;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		padding: 6px 6px;
		position: relative;
	}
	.cd-flip-val::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: var(--orbit-border-width);
		background: var(--orbit-line);
		opacity: 0.6;
	}
	.cd-flip-lab { font-size: 10px; letter-spacing: 0.08em; color: var(--orbit-muted); }
	.cd-flip-sep {
		font-size: 22px;
		font-weight: 700;
		padding-top: 8px;
		color: var(--orbit-coral);
		animation: cd-blink 1s steps(2, start) infinite;
	}

	/* ===== spotlight ===== */
	.cd-spotlight {
		display: grid;
		grid-template-columns: 200px 1fr;
		margin-bottom: 40px;
		background: var(--orbit-ink);
		color: var(--orbit-paper);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-raised);
		overflow: hidden;
		position: relative;
	}
	.cd-spotlight::after {
		content: "✦ ★ ✦";
		position: absolute;
		right: 16px;
		top: 10px;
		color: var(--orbit-lavender);
		font-family: var(--orbit-font-display);
		font-size: 12px;
		letter-spacing: 4px;
		opacity: 0.7;
		pointer-events: none;
	}
	.cd-spotlight-poster {
		display: block;
		border-right: var(--orbit-border-width) solid var(--orbit-line-strong);
		background: var(--orbit-lavender);
		min-height: 100%;
	}
	.cd-spotlight-body {
		padding: 24px 28px;
		display: grid;
		gap: 10px;
		align-content: center;
		justify-items: start;
	}
	.cd-spotlight-tag {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: var(--orbit-coral);
		color: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-coral);
		border-radius: var(--orbit-radius-badge);
		padding: 4px 10px;
	}
	.cd-spotlight-name {
		font-family: var(--orbit-font-display);
		font-size: 24px;
		line-height: 1.25;
		margin: 0;
		color: var(--orbit-mint);
	}
	.cd-spotlight-link { color: inherit; text-decoration: none; }
	.cd-spotlight-link:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
	.cd-spotlight-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 14px; color: var(--orbit-paper-deep); }
	.cd-spotlight .cd-flip-lab { color: var(--orbit-paper-deep); }
	.cd-spotlight .cd-flip-val { font-size: 30px; min-width: 56px; padding: 8px 6px; }

	/* ===== countdown cards ===== */
	.cd-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
		padding-bottom: 48px;
	}
	.cd-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: var(--orbit-ink);
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		overflow: hidden;
		transition: transform 0.08s ease, box-shadow 0.08s ease;
	}
	.cd-card:hover { transform: translate(-2px, -2px); box-shadow: var(--orbit-shadow-raised); text-decoration: none; }
	.cd-card:active { transform: translate(2px, 2px); box-shadow: none; }
	.cd-card-head {
		display: flex;
		gap: 12px;
		padding: 14px 16px;
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		align-items: center;
	}
	.cd-card-poster {
		width: 52px;
		aspect-ratio: 2 / 3;
		flex: none;
		overflow: hidden;
		background: var(--orbit-lavender);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
	}
	.cd-card-info { min-width: 0; display: grid; gap: 4px; justify-items: start; }
	.cd-card-name {
		font-weight: 700;
		font-size: 15px;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.cd-card-ep { font-size: 12px; color: var(--orbit-muted); }
	.cd-card-chips { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
	.cd-card-count {
		padding: 18px 16px 14px;
		display: grid;
		gap: 14px;
		justify-items: center;
		flex: 1;
		align-content: center;
	}
	.cd-days-left {
		font-family: var(--orbit-font-display);
		font-size: 13px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: var(--orbit-lavender);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		padding: 4px 12px;
	}
	.cd-days-left b { color: var(--orbit-coral-dark); font-size: 16px; }
	.cd-card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 16px;
		border-top: var(--orbit-border-width) dashed var(--orbit-line);
		font-size: 13px;
		color: var(--orbit-muted);
	}
	.cd-card-go { font-family: var(--orbit-font-display); color: var(--orbit-link); }

	/* ===== empty state ===== */
	.cd-empty {
		text-align: center;
		padding: 80px 16px;
		display: grid;
		justify-items: center;
		gap: 8px;
	}
	.cd-empty-icon {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--orbit-surface);
		color: var(--orbit-muted);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 50%;
		box-shadow: var(--orbit-shadow);
		margin-bottom: 8px;
	}
	.cd-empty-title { font-weight: 700; color: var(--orbit-ink); margin: 0; }
	.cd-empty-desc { font-size: 14px; color: var(--orbit-muted); margin: 0; }

	/* ===== responsive ===== */
	@media (max-width: 1023px) {
		.cd-hero { grid-template-columns: 1fr; gap: 24px; }
		.cd-stats { grid-template-columns: repeat(2, 1fr); }
		.cd-grid { grid-template-columns: repeat(2, 1fr); }
	}
	@media (max-width: 639px) {
		.cd-hero { padding-top: 16px; }
		.cd-title { font-size: 36px; }
		.cd-stats { grid-template-columns: 1fr; }
		.cd-spotlight { grid-template-columns: 1fr; }
		.cd-spotlight-poster {
			border-right: none;
			border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
			aspect-ratio: 3 / 4;
			overflow: hidden;
		}
		.cd-spotlight-body { padding: 20px; }
		.cd-spotlight-name { font-size: 19px; }
		.cd-spotlight .cd-flip-val { font-size: 24px; min-width: 46px; }
		.cd-grid { grid-template-columns: 1fr; }
		.cd-flip-val { min-width: 44px; font-size: 22px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.cd-blink, .cd-flip-sep { animation: none; }
		.cd-btn, .cd-card { transition: none; }
	}
</style>
