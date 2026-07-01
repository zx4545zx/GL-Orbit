<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';

	import { localizedHref } from '$lib/i18n/link.js';	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { absoluteUrl, jsonLdScript, safeJsonLd, truncateSeo, buildBreadcrumbJsonLd } from '$lib/seo.js';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const artist = $derived(data.artist);

	const seoTitle = $derived(m.artist_detail_seo_title({ name: artist.nickname }));
	const seoDescription = $derived(
		truncateSeo(
			m.artist_detail_seo_description({ name: artist.nickname })
		)
	);
	const canonicalUrl = $derived(absoluteUrl(page.url.origin, `/artists/${artist.id}`));
	const jsonLd = $derived(
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
				{ name: m.nav_home(), path: '/' },
				{ name: m.nav_artists(), path: '/artists' },
				{ name: artist.nickname, path: `/artists/${artist.id}` }
			])
		])
	);

	const statusConfig: Record<string, { text: string; cls: string }> = {
		ONGOING: { text: m.status_ongoing(), cls: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), cls: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), cls: 'bg-coral/10 text-coral-dark' }
	};

	// Cute icon badges inspired by the home cards: tilted gradient blocks + tiny orbit dot.
	const PROFILE_BADGE_ICON = 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';
	const SOCIAL_BADGE_ICON = 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.091-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.091L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z';
	const WORKS_BADGE_ICON = 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4';

	type SocialMeta = {
		label: string;
		bgClass: string;
		stroke: boolean;
		icon: string;
	};

	const IG = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
	const X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
	const YT = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
	const TT = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
	const FB = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
	const LINE = 'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.05.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';
	const GLOBE = 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zm0 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20z';

	function socialMeta(platform: string): SocialMeta {
		const p = platform.toLowerCase();
		if (p.includes('instagram')) return { label: 'Instagram', bgClass: 'social-bg-instagram', stroke: false, icon: IG };
		if (p.includes('twitter') || p === 'x') return { label: 'X (Twitter)', bgClass: 'social-bg-x', stroke: false, icon: X };
		if (p.includes('youtube') || p.includes('yt')) return { label: 'YouTube', bgClass: 'social-bg-youtube', stroke: false, icon: YT };
		if (p.includes('tiktok')) return { label: 'TikTok', bgClass: 'social-bg-tiktok', stroke: false, icon: TT };
		if (p.includes('facebook') || p.includes('fb')) return { label: 'Facebook', bgClass: 'social-bg-facebook', stroke: false, icon: FB };
		if (p.includes('line')) return { label: 'LINE', bgClass: 'social-bg-line', stroke: false, icon: LINE };
		return { label: platform, bgClass: 'social-bg-default', stroke: true, icon: GLOBE };
	}

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
			return;
		}

		goto(localizedHref('/', page.data.lang));
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
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<div class="relative -mx-4 -mb-[var(--bottom-nav-reserved-space)] overflow-hidden bg-[radial-gradient(circle_at_18%_6%,rgba(255,107,157,0.14),transparent_34%),radial-gradient(circle_at_86%_14%,rgba(196,181,253,0.22),transparent_34%),radial-gradient(circle_at_14%_82%,rgba(110,231,183,0.12),transparent_30%)] px-4 pb-[calc(3rem+var(--bottom-nav-reserved-space))] pt-4 sm:pt-6 md:mb-0 md:-mt-24 md:pb-12 md:pt-32">
	<div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-coral/15 blur-3xl"></div>
	<div class="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-lavender/20 blur-3xl animate-float"></div>
	<div class="pointer-events-none absolute bottom-24 left-0 h-56 w-56 rounded-full bg-mint/15 blur-3xl animate-float-delayed"></div>

	<div class="relative mx-auto max-w-5xl">
		<!-- Header: back + share -->
		<div class="mb-5 flex items-center justify-between gap-3 sm:mb-7">
			<button
				onclick={goBack}
				class="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3.5 py-2 text-sm font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:border-coral/30 hover:bg-white/80 hover:text-coral-dark sm:text-base touch-target"
			>
				<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
				<span class="font-medium">{m.common_back()}</span>
			</button>

			<ShareButton
				title={`${artist.nickname}${artist.fullNameEn ? ` (${artist.fullNameEn})` : ''}`}
				text={m.artist_share_text({ name: artist.nickname })}
				url={canonicalUrl}
				ariaLabel={m.artist_share_aria_label()}
			/>
		</div>

		<!-- ============ PROFILE CARD ============ -->
		<div class="glass-card-strong relative overflow-hidden rounded-[2rem] shadow-2xl shadow-lavender/15 animate-slide-up">
			<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-lavender/10"></div>
			<div class="absolute right-5 top-5 z-20 hidden sm:block" aria-hidden="true">
				<div class="relative flex h-12 w-12 rotate-[8deg] items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-coral-dark text-white shadow-lg shadow-coral/35 transition-all duration-500 hover:rotate-0 hover:scale-110">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={PROFILE_BADGE_ICON} /></svg>
					<span class="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-mint shadow-[0_0_7px_rgba(110,231,183,0.9)] ring-2 ring-white/85"></span>
				</div>
			</div>
			<!-- Cover -->
			<div class="relative h-36 overflow-hidden bg-gradient-to-br from-coral/30 via-lavender/30 to-mint/25 sm:h-44">
				<div class="absolute inset-0 bg-gradient-mesh"></div>
				<div class="absolute inset-0 noise-overlay"></div>
				<div class="absolute top-4 left-8 h-24 w-24 rounded-full bg-coral/25 blur-2xl animate-float"></div>
				<div class="absolute bottom-2 right-10 h-28 w-28 rounded-full bg-lavender/25 blur-3xl animate-float-delayed"></div>
				<div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/75 to-transparent pointer-events-none"></div>
			</div>

			<!-- Avatar + name (Linktree-style centered) -->
			<div class="relative -mt-16 flex flex-col items-center px-5 pb-6 text-center sm:-mt-20 sm:px-7 sm:pb-8">
				<div class="relative">
					<div class="h-32 w-32 rounded-full bg-gradient-to-br from-coral/40 via-cream to-lavender/40 p-1.5 shadow-2xl shadow-lavender/25 sm:h-40 sm:w-40 sm:p-2">
						<img
							src={artist.profileImageUrl}
							alt={artist.nickname}
							width={128}
							height={128}
							loading="eager"
							decoding="async"
							class="w-full h-full rounded-full object-cover bg-cream"
						/>
					</div>
					<!-- sparkle accent -->
					<span class="absolute -right-1 top-2 text-2xl text-coral drop-shadow-sm">✦</span>
					<span class="absolute -bottom-1 left-3 h-4 w-4 rounded-full bg-mint shadow-lg shadow-mint/40"></span>
				</div>

				<p class="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-coral-dark/75">Artist orbit</p>
				<h1 class="mt-1 px-1 py-2 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.5] text-gradient sm:text-5xl sm:leading-[1.45]">
					{artist.nickname}
				</h1>
				{#if artist.fullNameEn}
					<p class="mt-1 text-sm font-medium text-plum-light sm:text-base">{artist.fullNameEn}</p>
				{/if}
				{#if artist.fullNameTh}
					<p class="mt-0.5 text-sm font-medium text-plum-light/85 sm:text-base">{artist.fullNameTh}</p>
				{/if}

				<!-- meta chips -->
				<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-strong text-xs sm:text-sm font-medium text-coral-dark">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
						{m.common_cast()}
					</span>
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-strong text-xs sm:text-sm font-medium text-lavender-dark">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
						{artist.series.length} {m.artist_works_label()}
					</span>
					{#if artist.socials.length > 0}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-strong text-xs sm:text-sm font-medium text-mint-dark">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
							{artist.socials.length} {m.artist_socials_label()}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- ============ SOCIAL LINKS (Linktree-style pills) ============ -->
		{#if artist.socials.length > 0}
			<section class="mt-7">
				<div class="mb-4 flex items-end justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="relative hidden h-11 w-11 rotate-[6deg] items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-lavender text-white shadow-lg shadow-lavender/30 transition-all duration-500 hover:rotate-0 hover:scale-105 sm:flex" aria-hidden="true">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={SOCIAL_BADGE_ICON} /></svg>
							<span class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-coral shadow-[0_0_6px_rgba(255,107,157,0.85)] ring-2 ring-white/85"></span>
						</div>
						<div>
							<p class="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-dark/70">Social signals</p>
							<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">{m.artist_socials_heading()}</h2>
						</div>
					</div>
					<span class="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl">{artist.socials.length} {m.artist_socials_label()}</span>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each artist.socials as social (social.id)}
						{@const meta = socialMeta(social.platform)}
						<a
							href={social.url}
							target="_blank"
							rel="noopener noreferrer"
							class="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/65 px-3 py-3 shadow-md shadow-lavender/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-coral/25 hover:bg-white/85 hover:shadow-xl hover:shadow-lavender/20 focus-visible:outline-2 focus-visible:outline-coral sm:gap-4 sm:px-4 sm:py-3.5 touch-target"
						>
							<span class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-lavender/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
							<!-- Brand badge -->
							<span
								class="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105 {meta.bgClass}"
							>
								{#if social.iconUrl}
									<img src={social.iconUrl} alt={meta.label} width={24} height={24} loading="lazy" decoding="async" class="w-6 h-6 rounded-md object-cover" />
								{:else if meta.stroke}
									<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={meta.icon} /></svg>
								{:else}
									<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={meta.icon} /></svg>
								{/if}
							</span>
							<!-- Label -->
							<span class="relative min-w-0 flex-1 text-left">
								<span class="block font-semibold text-plum text-sm sm:text-base truncate">{meta.label}</span>
								<span class="block text-xs text-plum-light truncate">{social.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
							</span>
							<!-- External arrow -->
							<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum-light group-hover:text-coral-dark transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ============ WORKS (ผลงาน) ============ -->
		{#if artist.series.length > 0}
			<section class="mt-8">
				<div class="mb-4 flex items-end justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="relative hidden h-11 w-11 rotate-[6deg] items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-lavender text-white shadow-lg shadow-coral/25 transition-all duration-500 hover:rotate-0 hover:scale-105 sm:flex" aria-hidden="true">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={WORKS_BADGE_ICON} /></svg>
							<span class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-mint shadow-[0_0_6px_rgba(110,231,183,0.85)] ring-2 ring-white/85"></span>
						</div>
						<div>
							<p class="text-[10px] font-bold uppercase tracking-[0.24em] text-coral-dark/70">Filmography</p>
							<h2 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">{m.artist_works_heading()}</h2>
						</div>
					</div>
					<span class="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-plum-light shadow-sm shadow-lavender/10 backdrop-blur-xl">{artist.series.length} {m.artist_works_count_label()}</span>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{#each artist.series as s (s.id)}
						{@const st = statusConfig[s.status]}
						<a
							href="/{page.data.lang}/series/{s.id}"
							class="group glass-card overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-lavender/20 focus-visible:outline-2 focus-visible:outline-coral"
						>
							<div class="relative aspect-[2/3] overflow-hidden">
								<img
									src={s.posterUrl}
									alt={s.titleEn}
									width={300}
									height={450}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
									loading="lazy"
									decoding="async"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/10 to-transparent"></div>
								{#if st}
									<span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md {st.cls}">
										{st.text}
									</span>
								{/if}
								<div class="absolute bottom-0 left-0 right-0 p-2.5">
									{#if s.studio}
										<p class="text-white/70 text-[10px] leading-tight mb-0.5 truncate">{s.studio}</p>
									{/if}
									<h3 class="text-white font-bold text-xs sm:text-sm leading-tight line-clamp-2">{s.titleEn}</h3>
									<p class="text-coral-light/90 text-[10px] mt-0.5 truncate">{s.roleName}</p>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<section class="mt-8">
				<div class="glass-card-strong rounded-[2rem] p-8 text-center shadow-xl shadow-lavender/10">
					<p class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">{m.artist_detail_empty_title()}</p>
					<p class="mt-1 text-sm text-plum-light">{m.artist_detail_empty_desc()}</p>
					<a href="/{page.data.lang}/" class="mt-4 inline-flex rounded-full bg-gradient-to-r from-coral to-coral-dark px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.02] hover:shadow-xl touch-target">
						{m.artist_detail_empty_back_home()}
					</a>
				</div>
			</section>
		{/if}
	</div>
</div>
