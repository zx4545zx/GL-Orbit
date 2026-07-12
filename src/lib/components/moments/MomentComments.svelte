<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from './HaloIcon.svelte';
	import type { HaloComment } from './types.js';
	let { comments }: { comments: HaloComment[] } = $props();
	let draft = $state('');
</script>

<section class="border-t border-[#eee9ef] pt-4" aria-label={m.halo_comments()}>
	<h2 class="font-display text-base font-bold">{m.halo_comments()} <span class="font-body text-xs font-normal text-plum-light">{comments.length}</span></h2>
	<div class="mt-3 flex items-center gap-2"><input bind:value={draft} class="min-w-0 flex-1 rounded-full border border-[#ded8df] bg-white px-4 py-2 text-sm outline-none focus:border-coral" placeholder={m.halo_write_comment()} /><button type="button" class="halo-focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-white" aria-label={m.halo_write_comment()}><HaloIcon name="send" size={14} /></button></div>
	<div class="mt-4 divide-y divide-[#f2eef3]">
		{#each comments as comment}
			<article class="flex gap-2.5 py-3"><div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender/20 text-xs font-bold">{comment.author[0]}</div><div class="min-w-0 flex-1"><p class="text-xs"><strong>{comment.author}</strong><span class="ml-1.5 text-plum-light">{comment.time}</span></p><p class="mt-1 text-sm leading-5 text-plum">{comment.body}</p><button class="mt-1 text-xs text-plum-light hover:text-coral-dark">{m.halo_reply()}</button>{#if comment.reply}<div class="mt-2 border-l-2 border-[#eee9ef] pl-3"><p class="text-xs"><strong>{comment.reply.author}</strong><span class="ml-1.5 text-plum-light">{comment.reply.time}</span></p><p class="mt-1 text-xs text-plum-light">{comment.reply.body}</p></div>{/if}</div></article>
		{/each}
	</div>
</section>
