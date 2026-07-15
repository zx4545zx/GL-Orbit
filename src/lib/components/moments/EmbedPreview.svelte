<script lang="ts">
	import { page } from '$app/state';
	import HaloIcon from './HaloIcon.svelte';
	import XEmbedPlayer from './XEmbedPlayer.svelte';
	import YouTubeEmbed from './YouTubeEmbed.svelte';
	import TikTokEmbed from './TikTokEmbed.svelte';

let { provider, source, caption = '', thumbnailUrl = null, title = null, author = null, feedCard = false }: { provider: 'YouTube' | 'TikTok' | 'X' | 'Link'; source: string; caption?: string; thumbnailUrl?: string | null; title?: string | null; author?: string | null; feedCard?: boolean } = $props();
	const isThai = $derived(page.data.lang === 'th');
	const hostname = $derived.by(() => { try { return new URL(source).hostname.replace('www.', ''); } catch { return source; } });
let thumbnailFailed = $state(false);
	const embed = $derived.by(() => {
		try {
			const url = new URL(source); const host = url.hostname.toLowerCase();
			if (provider === 'YouTube' && ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
				const pathId = host === 'youtu.be' ? url.pathname.split('/')[1] : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]; const id = url.searchParams.get('v') ?? pathId ?? '';
				if (/^[A-Za-z0-9_-]{6,20}$/.test(id)) return { kind: 'youtube' as const, id, src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`, title: isThai ? 'วิดีโอ YouTube ที่แนบมา' : 'Attached YouTube video' };
			}
			if (provider === 'TikTok' && ['tiktok.com', 'www.tiktok.com'].includes(host)) { const id = url.pathname.match(/^\/@[^/]+\/video\/(\d+)/)?.[1] ?? ''; if (/^\d{8,24}$/.test(id)) return { kind: 'tiktok' as const, id, src: `https://www.tiktok.com/player/v1/${id}?controls=1&description=1`, title: isThai ? 'วิดีโอ TikTok ที่แนบมา' : 'Attached TikTok video' }; }
			if (provider === 'X' && ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(host)) { const id = url.pathname.match(/^\/[^/]+\/status\/(\d+)/)?.[1] ?? ''; if (/^\d{8,24}$/.test(id)) return { kind: 'x' as const, id, title: isThai ? 'โพสต์ X ที่แนบมา' : 'Attached X post' }; }
		} catch { return null; }
		return null;
	});
	const previewImage = $derived(thumbnailFailed ? null : embed?.kind === 'youtube' ? `https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg` : embed?.kind === 'tiktok' ? thumbnailUrl : null);
	const playLabel = $derived(isThai ? `เล่น ${provider} ที่แนบมา` : `Play attached ${provider}`);
	const xHandle = $derived.by(() => embed?.kind === 'x' ? new URL(source).pathname.split('/')[1] ?? '' : '');
</script>

{#if embed?.kind === 'youtube' && feedCard}
	<YouTubeEmbed videoId={embed.id} source={source} title={title || embed.title} />
{:else if embed?.kind === 'tiktok' && feedCard}
	<TikTokEmbed postId={embed.id} postUrl={source} title={title || embed.title} poster={thumbnailUrl} />
{:else if embed && feedCard && embed.kind !== 'x'}
	<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring group block overflow-hidden rounded-2xl border border-[#ded8df] bg-[#f6f3f6] transition hover:-translate-y-0.5 hover:shadow-md" aria-label={playLabel}>
		<div class="relative overflow-hidden">
			{#if previewImage}<img src={previewImage} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror={() => thumbnailFailed = true} class="h-80 w-full bg-plum/5 object-contain sm:h-96" />{:else}<div class="h-80 bg-gradient-to-br from-plum via-coral-dark to-lavender-dark sm:h-96"></div>{/if}
			<span class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></span><span class="absolute bottom-3 left-4 text-sm font-bold text-white">{title || provider}{#if author}<span class="ml-1.5 text-white/75">· {author}</span>{/if}</span>
		</div>
		<div class="flex items-center justify-between bg-white px-4 py-3 text-xs"><span class="font-medium text-plum">{title || provider}</span><span class="font-medium text-coral-dark">{isThai ? 'เปิดดู ↗' : 'Open ↗'}</span></div>
	</a>
{:else if embed?.kind === 'x'}
	<XEmbedPlayer tweetId={embed.id} source={source} lazy={feedCard} />
{:else if embed}
	<div class="overflow-hidden rounded-2xl border border-[#ded8df] bg-black"><iframe title={embed.title} src={embed.src} class={embed.kind === 'tiktok' ? 'mx-auto block aspect-[9/14] max-h-[560px] w-full bg-black' : 'block aspect-video min-h-[220px] w-full bg-black'} loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring flex items-center justify-between border-t border-white/10 bg-white px-4 py-3 text-xs transition hover:bg-[#fafafa]"><span><strong class="font-medium text-plum">{isThai ? 'เปิดดูที่ต้นฉบับ' : 'View original'}</strong><span class="ml-1.5 text-plum-light">· {hostname}</span></span><HaloIcon name="external" size={14} /></a></div>
{:else}
	<a href={source} target="_blank" rel="noreferrer" class="halo-focus-ring group block overflow-hidden rounded-2xl border border-[#ded8df] transition hover:bg-[#fafafa]"><div class="flex min-h-28 items-center justify-between bg-[#f6f3f6] px-5 py-4"><div><span class="text-[11px] font-medium text-plum-light">{provider}</span><p class="mt-1 font-display text-base font-bold text-plum">{hostname}</p><p class="mt-1 text-xs text-plum-light">{isThai ? 'ลิงก์ต้นฉบับ' : 'Original source'}</p></div><span class="grid h-9 w-9 place-items-center rounded-full bg-white text-plum shadow-sm transition group-hover:text-coral-dark"><HaloIcon name="external" size={16} /></span></div><div class="flex items-center justify-between border-t border-[#ded8df] px-4 py-3 text-xs"><span class="font-medium text-plum">{isThai ? 'เปิดดูโมเมนต์ต้นฉบับ' : 'View original moment'}</span><span class="text-plum-light">↗</span></div></a>
{/if}
