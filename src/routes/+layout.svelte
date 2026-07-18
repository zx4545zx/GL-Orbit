<script lang="ts">
	import '../app.css';
	import { navigating, page } from '$app/state';
	import { DEFAULT_OG_IMAGE, buildLanguageAlternates, defaultSeoDescription, defaultSeoTitle, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, siteLocale, SITE_NAME, absoluteUrl, stripLanguageFromPath } from '$lib/seo.js';
	import { availableLanguageTags, setLanguageTag, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import PushPrompt from '$lib/components/PushPrompt.svelte';

	let { children } = $props();

	const currentLanguageTag = $derived(
		availableLanguageTags.includes(page.data.lang as AvailableLanguageTag)
			? (page.data.lang as AvailableLanguageTag)
			: 'th'
	);
	setLanguageTag(() => currentLanguageTag);

	const routeChanging = $derived(
		Boolean(navigating.to && (!navigating.from || navigating.to.url.pathname !== navigating.from.url.pathname))
	);

	const locale = $derived(siteLocale(page.data.lang ?? 'th'));
	const seoTitle = $derived(defaultSeoTitle(page.data.lang ?? 'th'));
	const seoDescription = $derived(defaultSeoDescription(page.data.lang ?? 'th'));
	const alternatePath = $derived(stripLanguageFromPath(page.url.pathname));
	const alternates = $derived(buildLanguageAlternates(page.url.origin, alternatePath));
</script>

<svelte:head>
	<meta name="application-name" content={SITE_NAME} />
	<meta name="apple-mobile-web-app-title" content={SITE_NAME} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={locale} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	{#each alternates as alternate}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
</svelte:head>

{#if routeChanging}
	<div class="pointer-events-none fixed top-0 left-0 right-0 z-[60]">
		<div class="h-1 w-full bg-plum/10 overflow-hidden">
			<div class="h-full w-1/3 bg-coral animate-[loading-slide_1s_ease-in-out_infinite]"></div>
		</div>
	</div>
{/if}

<div data-sveltekit-preload-data="hover" data-sveltekit-preload-code="viewport">
	{#key currentLanguageTag}
		{@render children()}
	{/key}
</div>

{#if page.data.user}
	<PushPrompt />
{/if}
