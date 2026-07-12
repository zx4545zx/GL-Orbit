<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import HaloIcon from './HaloIcon.svelte';
	type XWidgetsWindow = Window & { twttr?: { widgets?: { load: (root?: HTMLElement) => void } } };

	let { provider, source }: { provider: 'YouTube' | 'TikTok' | 'X' | 'Link'; source: string } = $props();
	const isThai = $derived(page.data.lang === 'th');
	const hostname = $derived.by(() => {
		try {
			return new URL(source).hostname.replace('www.', '');
		} catch {
			return source;
		}
	});
	let xEmbedRoot = $state<HTMLDivElement>();
	let xLoading = $state(true);
	let xLoadFailed = $state(false);
	const embed = $derived.by(() => {
		try {
			const url = new URL(source);
			const host = url.hostname.toLowerCase();

			if (provider === 'YouTube' && ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
				const pathId = host === 'youtu.be' ? url.pathname.split('/')[1] : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
				const id = url.searchParams.get('v') ?? pathId ?? '';
				if (/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
					return { kind: 'youtube' as const, src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`, title: isThai ? 'วิดีโอ YouTube ที่แนบมา' : 'Attached YouTube video' };
				}
			}

			if (provider === 'TikTok' && ['tiktok.com', 'www.tiktok.com'].includes(host)) {
				const id = url.pathname.match(/^\/@[^/]+\/video\/(\d+)/)?.[1] ?? '';
				if (/^\d{8,24}$/.test(id)) {
					return { kind: 'tiktok' as const, src: `https://www.tiktok.com/player/v1/${id}?controls=1&description=1`, title: isThai ? 'วิดีโอ TikTok ที่แนบมา' : 'Attached TikTok video' };
				}
			}

			if (provider === 'X' && ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(host)) {
				const id = url.pathname.match(/^\/[^/]+\/status\/(\d+)/)?.[1] ?? '';
				if (/^\d{8,24}$/.test(id)) {
					return { kind: 'x' as const, id, title: isThai ? 'โพสต์ X ที่แนบมา' : 'Attached X post' };
				}
			}
		} catch {
			return null;
		}

		return null;
	});

	onMount(() => {
		if (embed?.kind !== 'x' || !xEmbedRoot) return;
		const xWindow = window as XWidgetsWindow;
		const render = () => xEmbedRoot && xWindow.twttr?.widgets?.load(xEmbedRoot);
		const existing = document.querySelector<HTMLScriptElement>('script[src="https://platform.x.com/widgets.js"]');
		const loadedIframes = new WeakSet<HTMLIFrameElement>();
		let fadeTimer: ReturnType<typeof setTimeout> | undefined;
		let failTimer: ReturnType<typeof setTimeout> | undefined;

		const finishLoad = () => {
			clearTimeout(failTimer);
			// Give the rendered tweet a moment to paint so the label doesn't flash through.
			fadeTimer = setTimeout(() => {
				xLoading = false;
			}, 120);
		};

		// If X widget never renders, reveal the fallback link after a reasonable timeout.
		failTimer = setTimeout(() => {
			xLoadFailed = true;
			xLoading = false;
		}, 10000);

		// Twitter widget JS sets fixed pixel width on the iframe after render.
		// MutationObserver keeps it responsive and detects when the iframe is ready.
		const observer = new MutationObserver(() => {
			const iframe = xEmbedRoot?.querySelector('iframe');
			if (!iframe) return;

			iframe.style.setProperty('width', '100%', 'important');
			iframe.style.setProperty('max-width', '100%', 'important');

			if (!loadedIframes.has(iframe)) {
				loadedIframes.add(iframe);
				if (iframe.contentDocument?.readyState === 'complete') {
					finishLoad();
				} else {
					iframe.addEventListener('load', finishLoad, { once: true });
				}
			}
		});
		observer.observe(xEmbedRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

		if (xWindow.twttr?.widgets) {
			render();
			return () => { clearTimeout(fadeTimer); clearTimeout(failTimer); observer.disconnect(); };
		}
		if (existing) {
			existing.addEventListener('load', render, { once: true });
			return () => { clearTimeout(fadeTimer); clearTimeout(failTimer); existing.removeEventListener('load', render); observer.disconnect(); };
		}

		const script = document.createElement('script');
		script.src = 'https://platform.x.com/widgets.js';
		script.async = true;
		script.charset = 'utf-8';
		script.addEventListener('load', render, { once: true });
		document.head.append(script);
		return () => { clearTimeout(fadeTimer); clearTimeout(failTimer); script.removeEventListener('load', render); observer.disconnect(); };
	});
</script>

{#if embed?.kind === 'x'}
	<div bind:this={xEmbedRoot} class="x-embed-shell relative w-full overflow-hidden rounded-xl bg-white" class:min-h-[520px]={xLoading}>
		{#if xLoading}
			<div transition:fade={{ duration: 250 }} class="x-embed-loader absolute inset-0 z-10 rounded-xl border border-[#ded8df] bg-white p-4" aria-busy="true" aria-live="polite">
				<div class="animate-pulse">
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-start gap-3">
							<div class="h-10 w-10 shrink-0 rounded-full bg-black"></div>
							<div class="min-w-0">
								<div class="flex items-center gap-1">
									<div class="h-[17px] w-28 rounded bg-[#0f1419]/80"></div>
									<div class="h-4 w-4 rounded-full bg-[#1d9bf0]/40"></div>
								</div>
								<div class="mt-0.5 flex items-center gap-1.5">
									<div class="h-3.5 w-32 rounded bg-[#536471]/80"></div>
									<div class="h-3.5 w-px bg-[#536471]/30"></div>
									<div class="h-3.5 w-14 rounded bg-[#1d9bf0]/40"></div>
								</div>
							</div>
						</div>
						<div class="h-5 w-5 shrink-0 text-[#0f1419]/20">
							<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
						</div>
					</div>

					<div class="mt-2 space-y-1">
						<div class="h-[17px] w-full rounded bg-[#0f1419]/8"></div>
						<div class="h-[17px] w-10/12 rounded bg-[#0f1419]/8"></div>
						<div class="h-[17px] w-36 rounded bg-[#1d9bf0]/30"></div>
					</div>

					<div class="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-[#e7e9ea]"></div>

					<div class="mt-3 flex items-center justify-between text-[#536471]">
						<div class="h-3.5 w-48 rounded bg-[#536471]/50"></div>
						<div class="h-4 w-4 rounded-full bg-[#536471]/40"></div>
					</div>

					<div class="my-3 h-px w-full bg-[#cfd9de]"></div>

					<div class="flex items-center gap-6">
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 rounded-full bg-[#f91880]/40"></div>
							<div class="h-3.5 w-10 rounded bg-[#0f1419]/50"></div>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 rounded-full bg-[#1d9bf0]/40"></div>
							<div class="h-3.5 w-16 rounded bg-[#0f1419]/50"></div>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 rounded-full bg-[#0f1419]/25"></div>
							<div class="h-3.5 w-36 rounded bg-[#0f1419]/50"></div>
						</div>
					</div>

					<div class="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-[#cfd9de] bg-white">
						<div class="h-3.5 w-32 rounded bg-[#1d9bf0]/50"></div>
					</div>
				</div>
			</div>
		{/if}
		<blockquote class="twitter-tweet" data-dnt="true" data-theme="light" data-media-max-width="560">
			<a href={source} class={xLoadFailed ? '' : 'sr-only'}>{embed.title}</a>
		</blockquote>
	</div>
{:else if embed}
	<div class="overflow-hidden rounded-2xl border border-[#ded8df] bg-black">
		<iframe
			title={embed.title}
			src={embed.src}
			class={embed.kind === 'tiktok' ? 'mx-auto block aspect-[9/14] max-h-[560px] w-full bg-black' : 'block aspect-video min-h-[220px] w-full bg-black'}
			loading="lazy"
			referrerpolicy="strict-origin-when-cross-origin"
			sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
		<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring flex items-center justify-between border-t border-white/10 bg-white px-4 py-3 text-xs transition hover:bg-[#fafafa]">
			<span><strong class="font-medium text-plum">{isThai ? 'เปิดดูที่ต้นฉบับ' : 'View original'}</strong><span class="ml-1.5 text-plum-light">· {hostname}</span></span>
			<HaloIcon name="external" size={14} />
		</a>
	</div>
{:else}
	<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring group block overflow-hidden rounded-2xl border border-[#ded8df] transition hover:bg-[#fafafa]">
		<div class="flex min-h-28 items-center justify-between bg-[#f6f3f6] px-5 py-4">
			<div><span class="text-[11px] font-medium text-plum-light">{provider}</span><p class="mt-1 font-display text-base font-bold text-plum">{hostname}</p><p class="mt-1 text-xs text-plum-light">{isThai ? 'ลิงก์ต้นฉบับ' : 'Original source'}</p></div>
			<span class="grid h-9 w-9 place-items-center rounded-full bg-white text-plum shadow-sm transition group-hover:text-coral-dark"><HaloIcon name="external" size={16} /></span>
		</div>
		<div class="flex items-center justify-between border-t border-[#ded8df] px-4 py-3 text-xs"><span class="font-medium text-plum">{isThai ? 'เปิดดูโมเมนต์ต้นฉบับ' : 'View original moment'}</span><span class="text-plum-light">↗</span></div>
	</a>
{/if}

<style>
	.x-embed-shell :global(.twitter-tweet),
	.x-embed-shell :global(.twitter-tweet-rendered) {
		margin: 0 auto !important;
		max-width: none !important;
		width: 100% !important;
	}

	.x-embed-shell :global(iframe) {
		display: block !important;
		margin: 0 !important;
		width: 100% !important;
	}
</style>
