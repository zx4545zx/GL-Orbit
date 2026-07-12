<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import EmbedPreview from './EmbedPreview.svelte';
	import HaloIcon from './HaloIcon.svelte';
	import MomentComments from './MomentComments.svelte';
	import type { HaloMoment } from './types.js';
	let { moment, expanded = false }: { moment: HaloMoment; expanded?: boolean } = $props();
	let liked = $state(false); let saved = $state(false);
	$effect(() => { saved = moment.saved ?? false; });
</script>

<article class="border-b border-[#eee9ef] bg-white px-4 py-4 transition hover:bg-[#fdfcfd] sm:px-5">
	<div class="flex gap-3">
		<a href={`/${page.data.lang}/halo/u/${moment.handle}`} class="halo-focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lavender/25 text-sm font-bold text-plum">{moment.initial}</a>
		<div class="min-w-0 flex-1">
			<header class="flex items-start gap-2"><div class="min-w-0 flex-1 truncate text-sm"><a href={`/${page.data.lang}/halo/u/${moment.handle}`} class="font-bold text-plum hover:underline">{moment.author}</a><span class="ml-1 text-plum-light">@{moment.handle} · {moment.time}</span></div><button class="halo-focus-ring -mr-2 grid h-8 w-8 place-items-center rounded-full text-plum-light hover:bg-coral/10 hover:text-coral-dark" aria-label="More options"><HaloIcon name="more" size={18} /></button></header>
			<p class="mt-1 whitespace-pre-line text-[.94rem] leading-6 text-plum">{moment.body}</p>
			<div class="mt-2 flex flex-wrap gap-1.5">{#each moment.tags as tag}<a href={`/${page.data.lang}/halo/explore`} class="text-xs font-medium text-coral-dark hover:underline">{tag}</a>{/each}</div>
			<div class="mt-3"><EmbedPreview provider={moment.provider} source={moment.source} /></div>
			<div class="mt-2 flex max-w-md items-center justify-between text-xs text-plum-light">
				<button onclick={() => (liked = !liked)} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-coral/10 hover:text-coral-dark {liked ? 'text-coral-dark [&_svg]:fill-current' : ''}" aria-pressed={liked} aria-label={m.halo_like()}><HaloIcon name="heart" size={16} /> {moment.likes + (liked ? 1 : 0)}</button>
				<a href={`/${page.data.lang}/halo/moments/${moment.id}#comments`} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-lavender/15 hover:text-lavender-dark"><HaloIcon name="comment" size={16} /> {moment.comments.length}</a>
				<button onclick={() => (saved = !saved)} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full hover:bg-mint/15 hover:text-mint-dark {saved ? 'text-mint-dark [&_svg]:fill-current' : ''}" aria-pressed={saved} aria-label={m.halo_save()}><HaloIcon name="bookmark" size={16} /></button>
				<button class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full text-plum-light transition hover:bg-plum/[.05] hover:text-plum" aria-label="รายงาน Moment นี้" title={m.halo_report()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4.5M5 5.5c4-2.5 7 2.5 14 0v9c-7 2.5-10-2.5-14 0" /></svg><span class="sr-only">{m.halo_report()}</span></button>
			</div>
			{#if expanded}<div class="mt-3"><MomentComments comments={moment.comments} /></div>{/if}
		</div>
	</div>
</article>
