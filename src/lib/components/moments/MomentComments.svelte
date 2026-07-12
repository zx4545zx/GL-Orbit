<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import type { HaloComment } from './types.js';
	let { comments }: { comments: HaloComment[] } = $props();
	let draft = $state('');
</script>

<section class="border-t border-plum/10 pt-4" aria-label={m.halo_comments()}>
	<h2 class="font-display text-lg font-bold text-plum">{m.halo_comments()} <span class="text-sm font-medium text-plum-light">{comments.length}</span></h2>
	<div class="mt-3 flex gap-2"><input bind:value={draft} class="min-w-0 flex-1 rounded-xl border border-lavender/25 bg-white px-3 py-2 text-sm outline-none focus:border-lavender" placeholder={m.halo_write_comment()} /><button type="button" class="rounded-xl bg-plum px-3 text-xs font-bold text-white">↗</button></div>
	<div class="mt-5 space-y-4">
		{#each comments as comment}
			<article class="flex gap-3"><div class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender/20 text-xs font-bold text-lavender-dark">{comment.author[0]}</div><div><p class="text-sm"><strong class="font-bold text-plum">{comment.author}</strong> <span class="ml-1 text-xs text-plum-light">{comment.time}</span></p><p class="mt-1 text-sm leading-6 text-plum-light">{comment.body}</p><button class="mt-1 text-xs font-bold text-coral-dark">{m.halo_reply()}</button>{#if comment.reply}<div class="mt-3 border-l-2 border-lavender/30 pl-3"><p class="text-sm"><strong>{comment.reply.author}</strong> <span class="text-xs text-plum-light">{comment.reply.time}</span></p><p class="text-sm text-plum-light">{comment.reply.body}</p></div>{/if}</div></article>
		{/each}
	</div>
</section>
