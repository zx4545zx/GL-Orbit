<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
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

		// Twitter widget JS sets fixed pixel width on the iframe after render.
		// MutationObserver keeps it responsive.
		const observer = new MutationObserver(() => {
			const iframe = xEmbedRoot?.querySelector('iframe');
			if (iframe) {
				iframe.style.setProperty('width', '100%', 'important');
				iframe.style.setProperty('max-width', '100%', 'important');
			}
		});
		observer.observe(xEmbedRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

		if (xWindow.twttr?.widgets) {
			render();
			return () => observer.disconnect();
		}
		if (existing) {
			existing.addEventListener('load', render, { once: true });
			return () => { existing.removeEventListener('load', render); observer.disconnect(); };
		}

		const script = document.createElement('script');
		script.src = 'https://platform.x.com/widgets.js';
		script.async = true;
		script.charset = 'utf-8';
		script.addEventListener('load', render, { once: true });
		document.head.append(script);
		return () => { script.removeEventListener('load', render); observer.disconnect(); };
	});
</script>

{#if embed?.kind === 'x'}
	<div bind:this={xEmbedRoot} class="x-embed-shell w-full overflow-hidden rounded-xl bg-white">
		<blockquote class="twitter-tweet" data-dnt="true" data-theme="light" data-media-max-width="560">
			<a href={source}>{embed.title}</a>
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
