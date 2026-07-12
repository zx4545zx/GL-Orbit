<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { onMount } from 'svelte';
	import HaloIcon from './HaloIcon.svelte';
	import type { HaloComment } from './types.js';
	type ApiComment = { id: string; body: string; createdAt: string; username: string; displayName: string | null };
	let { momentId, onCommentCreated }: { momentId: string; onCommentCreated?: () => void } = $props();
	let comments = $state<HaloComment[]>([]);
	let draft = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	const isThai = $derived(page.data.lang === 'th');

	function relativeTime(value: string) {
		const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
		return new Intl.RelativeTimeFormat(isThai ? 'th-TH' : 'en', { numeric: 'auto' }).format(-minutes, 'minute');
	}
	async function loadComments() {
		loading = true; error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(momentId)}/comments?limit=50`);
			if (!response.ok) throw new Error();
			const payload = await response.json() as ApiComment[] | { rows?: ApiComment[] };
			const rows = Array.isArray(payload) ? payload : payload.rows ?? [];
			comments = rows.map((comment) => ({ id: comment.id, author: comment.displayName || comment.username, body: comment.body, time: relativeTime(comment.createdAt) }));
		} catch { error = isThai ? 'ไม่สามารถโหลดความคิดเห็นได้ โปรดลองอีกครั้ง' : 'Unable to load comments. Please try again.'; }
		finally { loading = false; }
	}
	async function submit() {
		const body = draft.trim(); if (!body || submitting) return;
		if (!page.data.user) {
			const returnPath = `${page.url.pathname}${page.url.search}${page.url.hash}`;
			void goto(`/${page.data.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
			return;
		}
		submitting = true; error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(momentId)}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body }) });
			if (response.status !== 201) throw new Error();
			draft = ''; await loadComments(); onCommentCreated?.();
		} catch { error = isThai ? 'ไม่สามารถส่งความคิดเห็นได้ โปรดลองอีกครั้ง' : 'Unable to post your comment. Please try again.'; }
		finally { submitting = false; }
	}
	onMount(() => { void loadComments(); });
</script>

<section class="border-t border-[#eee9ef] pt-4" aria-label={m.halo_comments()}>
	<h2 class="font-display text-base font-bold">{m.halo_comments()} <span class="font-body text-xs font-normal text-plum-light">{comments.length}</span></h2>
	<div class="mt-3 flex items-center gap-2"><input bind:value={draft} onkeydown={(event) => { if (event.key === 'Enter') void submit(); }} class="min-w-0 flex-1 rounded-full border border-[#ded8df] bg-white px-4 py-2 text-sm outline-none focus:border-coral" placeholder={m.halo_write_comment()} /><button type="button" onclick={() => void submit()} disabled={submitting || !draft.trim()} class="halo-focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-white disabled:opacity-50" aria-label={isThai ? 'ส่งความคิดเห็น' : 'Send comment'}><HaloIcon name="send" size={14} /></button></div>
	{#if loading}<p class="mt-3 text-sm text-plum-light" aria-live="polite">{isThai ? 'กำลังโหลดความคิดเห็น…' : 'Loading comments…'}</p>{:else if error}<p class="mt-3 text-sm text-coral-dark" aria-live="polite">{error} <button type="button" onclick={() => void loadComments()} class="underline">{isThai ? 'ลองใหม่' : 'Try again'}</button></p>{/if}
	<div class="mt-4 divide-y divide-[#f2eef3]">
		{#each comments as comment}
			<article class="flex gap-2.5 py-3"><div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender/20 text-xs font-bold">{comment.author[0]}</div><div class="min-w-0 flex-1"><p class="text-xs"><strong>{comment.author}</strong><span class="ml-1.5 text-plum-light">{comment.time}</span></p><p class="mt-1 text-sm leading-5 text-plum">{comment.body}</p>{#if comment.reply}<div class="mt-2 border-l-2 border-[#eee9ef] pl-3"><p class="text-xs"><strong>{comment.reply.author}</strong><span class="ml-1.5 text-plum-light">{comment.reply.time}</span></p><p class="mt-1 text-xs text-plum-light">{comment.reply.body}</p></div>{/if}</div></article>
		{/each}
	</div>
</section>
