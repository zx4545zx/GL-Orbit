<script lang="ts">
	import '../app.css';
	import { navigating, page } from '$app/state';
	import { onMount } from 'svelte';
	import { DEFAULT_OG_IMAGE, buildLanguageAlternates, defaultSeoDescription, defaultSeoTitle, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, siteLocale, SITE_NAME, absoluteUrl, stripLanguageFromPath } from '$lib/seo.js';
	import { availableLanguageTags, setLanguageTag, type AvailableLanguageTag, m } from '$lib/i18n/paraglide.js';
	import PushPrompt from '$lib/components/PushPrompt.svelte';

	let { children } = $props();

	const currentLanguageTag = $derived(
		availableLanguageTags.includes(page.data.lang as AvailableLanguageTag)
			? (page.data.lang as AvailableLanguageTag)
			: 'th'
	);
	setLanguageTag(() => currentLanguageTag);

	// iOS PWA has rubber-band overscroll: pulling past the top/bottom of the
	// document reveals the body background behind the app. The chat route avoids
	// this by locking body scroll entirely, but public pages need normal window
	// scrolling. This guard only cancels single-finger moves when the active
	// scroll container is already at its boundary, preserving normal scroll and
	// keeping pinch zoom available for accessibility.
	onMount(() => {
		const isIOS =
			/iP(ad|hone|od)/.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		let lastTouchY: number | null = null;

		function nearestScrollable(target: EventTarget | null): HTMLElement | null {
			let element = target instanceof Element ? target : null;
			while (element && element !== document.body) {
				const style = window.getComputedStyle(element);
				const canScrollY =
					/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
				if (canScrollY) return element as HTMLElement;
				element = element.parentElement;
			}
			return document.scrollingElement as HTMLElement | null;
		}

		const rememberTouchY = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				lastTouchY = e.touches[0].clientY;
			}
		};

		const blockIOSPwaRubberBand = (e: TouchEvent) => {
			if (!isIOS || !isStandalone || e.touches.length !== 1 || lastTouchY === null) return;

			const currentY = e.touches[0].clientY;
			const deltaY = currentY - lastTouchY;
			const scroller = nearestScrollable(e.target);
			if (!scroller) return;

			const maxScroll = scroller.scrollHeight - scroller.clientHeight;
			const atTop = scroller.scrollTop <= 0;
			const atBottom = scroller.scrollTop >= maxScroll - 1;

			if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
				e.preventDefault();
			}

			lastTouchY = currentY;
		};

		const clearTouchY = () => {
			lastTouchY = null;
		};

		window.addEventListener('touchstart', rememberTouchY, { passive: true });
		window.addEventListener('touchmove', blockIOSPwaRubberBand, { passive: false });
		window.addEventListener('touchend', clearTouchY, { passive: true });
		window.addEventListener('touchcancel', clearTouchY, { passive: true });
		return () => {
			window.removeEventListener('touchstart', rememberTouchY);
			window.removeEventListener('touchmove', blockIOSPwaRubberBand);
			window.removeEventListener('touchend', clearTouchY);
			window.removeEventListener('touchcancel', clearTouchY);
		};
	});

	const routeChanging = $derived(
		Boolean(navigating.to && (!navigating.from || navigating.to.url.pathname !== navigating.from.url.pathname))
	);

	const locale = $derived(siteLocale(page.data.lang ?? 'th'));
	const seoTitle = $derived(defaultSeoTitle(page.data.lang ?? 'th'));
	const seoDescription = $derived(defaultSeoDescription(page.data.lang ?? 'th'));
	const alternatePath = $derived(stripLanguageFromPath(page.url.pathname));
	const alternates = $derived(buildLanguageAlternates(page.url.origin, alternatePath));
	let showRouteOverlay = $state(false);

	$effect(() => {
		if (!routeChanging) {
			showRouteOverlay = false;
			return;
		}

		const timer = setTimeout(() => {
			showRouteOverlay = true;
		}, 180);

		return () => {
			clearTimeout(timer);
			showRouteOverlay = false;
		};
	});
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
	<div class="fixed top-0 left-0 right-0 z-[60]">
		<div class="h-1 w-full bg-coral/10 overflow-hidden">
			<div class="h-full w-1/3 bg-gradient-to-r from-coral via-coral-dark to-coral animate-[loading-slide_1s_ease-in-out_infinite]"></div>
		</div>
	</div>
{/if}

{#if showRouteOverlay}
	<div
		class="fixed inset-0 z-[70] flex items-center justify-center bg-cream/75 backdrop-blur-md"
		aria-live="polite"
		aria-busy="true"
		role="status"
	>
		<div class="glass-card-strong mx-4 w-full max-w-xs rounded-3xl px-6 py-7 text-center shadow-2xl shadow-lavender/20">
			<div class="relative mx-auto mb-4 h-14 w-14">
				<div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-coral to-lavender opacity-90 animate-pulse-glow"></div>
				<div class="absolute inset-2 rounded-xl bg-white flex items-center justify-center">
					<div class="h-6 w-6 rounded-full border-2 border-coral/20 border-t-coral animate-spin"></div>
				</div>
			</div>
			<p class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{m.route_loading_title()}</p>
			<p class="mt-1 text-sm text-plum-light">{m.route_loading_desc()}</p>
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
