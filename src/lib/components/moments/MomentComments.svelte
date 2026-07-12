<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { onMount } from 'svelte';
	import HaloIcon from './HaloIcon.svelte';
	import type { HaloComment } from './types.js';
	type ApiComment = { id: string; body: string; createdAt: string; username: string; displayName: string | null };
	let { momentId, interactive = false, legacyComments, onCommentCreated }: { momentId: string; interactive?: boolean; legacyComments?: HaloComment[]; onCommentCreated?: () => void } = $props();
	let comments = $state<HaloComment[]>(legacyComments ?? []);
	let draft = $state('');
	let loading = $state(!legacyComments);
	let submitting = $state(false);
	let error = $state('');

	function relativeTime(value: string) {
		const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
		return minutes < 1 ? 'เมื่อสักครู่' : `${minutes} นาทีที่แล้ว`;
	}
	async function loadComments() {
		if (!interactive) return;
		loading = true; error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(momentId)}/comments?limit=50`);
			if (!response.ok) throw new Error();
			const payload = await response.json() as ApiComment[] | { rows?: ApiComment[] };
			const rows = Array.isArray(payload) ? payload : payload.rows ?? [];
			comments = rows.map((comment) => ({ id: comment.id, author: comment.displayName || comment.username, body: comment.body, time: relativeTime(comment.createdAt) }));
		} catch { error = 'ไม่สามารถโหลดความคิดเห็นได้ โปรดลองอีกครั้ง'; }
		finally { loading = false; }
	}
	async function submit() {
		const body = draft.trim(); if (!interactive || !body || submitting) return;
		submitting = true; error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(momentId)}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body }) });
			if (response.status !== 201) throw new Error();
			draft = ''; await loadComments(); onCommentCreated?.();
		} catch { error = 'ไม่สามารถส่งความคิดเห็นได้ โปรดลองอีกครั้ง'; }
		finally { submitting = false; }
	}
	onMount(() => { if (interactive) void loadComments(); });
</script>

<section class="border-t border-[#eee9ef] pt-4" aria-label={m.halo_comments()}>
	<h2 class="font-display text-base font-bold">{m.halo_comments()} <span class="font-body text-xs font-normal text-plum-light">{comments.length}</span></h2>
	{#if interactive}<div class="mt-3 flex items-center gap-2"><input bind:value={draft} onkeydown={(event) => { if (event.key === 'Enter') void submit(); }} class="min-w-0 flex-1 rounded-full border border-[#ded8df] bg-white px-4 py-2 text-sm outline-none focus:border-coral" placeholder={m.halo_write_comment()} /><button type="button" onclick={() => void submit()} disabled={submitting || !draft.trim()} class="halo-focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-white disabled:opacity-50" aria-label="ส่งความคิดเห็น"><HaloIcon name="send" size={14} /></button></div>{/if}
	{#if loading}<p class="mt-3 text-sm text-plum-light" aria-live="polite">กำลังโหลดความคิดเห็น…</p>{:else if error}<p class="mt-3 text-sm text-coral-dark" aria-live="polite">{error} <button type="button" onclick={() => void loadComments()} class="underline">ลองใหม่</button></p>{/if}
	<div class="mt-4 divide-y divide-[#f2eef3]">
		{#each comments as comment}
			<article class="flex gap-2.5 py-3"><div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender/20 text-xs font-bold">{comment.author[0]}</div><div class="min-w-0 flex-1"><p class="text-xs"><strong>{comment.author}</strong><span class="ml-1.5 text-plum-light">{comment.time}</span></p><p class="mt-1 text-sm leading-5 text-plum">{comment.body}</p><button class="mt-1 text-xs text-plum-light hover:text-coral-dark">{m.halo_reply()}</button>{#if comment.reply}<div class="mt-2 border-l-2 border-[#eee9ef] pl-3"><p class="text-xs"><strong>{comment.reply.author}</strong><span class="ml-1.5 text-plum-light">{comment.reply.time}</span></p><p class="mt-1 text-xs text-plum-light">{comment.reply.body}</p></div>{/if}</div></article>
		{/each}
	</div>
</section>
