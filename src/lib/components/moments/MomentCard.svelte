<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import EmbedPreview from './EmbedPreview.svelte';
	import MomentComments from './MomentComments.svelte';
	import type { HaloMoment } from './types.js';
	let { moment, expanded = false }: { moment: HaloMoment; expanded?: boolean } = $props();
	let liked = $state(false); let saved = $state(false);
	$effect(() => { saved = moment.saved ?? false; });
</script>

<article class="rounded-[1.75rem] border border-white/75 bg-white/80 p-4 shadow-[0_12px_34px_rgba(88,66,130,.08)] backdrop-blur-xl sm:p-5">
	<header class="flex items-start gap-3"><div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lavender to-mint font-display font-bold text-plum">{moment.initial}</div><div class="min-w-0 flex-1"><a href="/" class="font-bold text-plum hover:text-coral-dark">{moment.author}</a><p class="text-xs text-plum-light">@{moment.handle} · {moment.time}</p></div><button class="rounded-lg p-2 text-plum-light hover:bg-lavender/15" aria-label="More options">•••</button></header>
	<p class="mt-4 whitespace-pre-line text-[.95rem] leading-7 text-plum">{moment.body}</p>
	<div class="mt-3 flex flex-wrap gap-2">{#each moment.tags as tag}<a href="/" class="rounded-full bg-lavender/12 px-2.5 py-1 text-xs font-bold text-lavender-dark hover:bg-lavender/25">{tag}</a>{/each}</div>
	<div class="mt-4"><EmbedPreview provider={moment.provider} source={moment.source} /></div>
	<div class="mt-3 flex items-center gap-1 border-t border-plum/5 pt-2 text-xs font-bold text-plum-light"><button onclick={() => liked = !liked} class="rounded-lg px-2 py-2 hover:bg-coral/10 {liked ? 'text-coral-dark' : ''}" aria-pressed={liked}>♥ {moment.likes + (liked ? 1 : 0)}</button><a href={`/${page.data.lang}/halo/moments/${moment.id}#comments`} class="rounded-lg px-2 py-2 hover:bg-lavender/15">◌ {moment.comments.length} {m.halo_comments()}</a><button onclick={() => saved = !saved} class="ml-auto rounded-lg px-2 py-2 hover:bg-mint/15 {saved ? 'text-mint-dark' : ''}" aria-pressed={saved}>⌑ {m.halo_save()}</button><button class="rounded-lg px-2 py-2 hover:bg-coral/10">{m.halo_report()}</button></div>
	{#if expanded}<div class="mt-3"><MomentComments comments={moment.comments} /></div>{/if}
</article>
