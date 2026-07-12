<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import EmbedPreview from './EmbedPreview.svelte';
	import HaloIcon from './HaloIcon.svelte';
	import MomentComments from './MomentComments.svelte';
	import MomentReportDialog from './MomentReportDialog.svelte';
	import type { ProfileMoment } from './types.js';

	let { moment, expanded = false }: { moment: ProfileMoment; expanded?: boolean } = $props();
	let liked = $state(false);
	let bookmarked = $state(false);
	let likes = $state(0);
	let commentCount = $state(0);
	let likePending = $state(false);
	let bookmarkPending = $state(false);
	let actionError = $state('');
	let commentsOpen = $state(false);
	let reportOpen = $state(false);
	let reportSent = $state(false);
	const isThai = $derived(page.data.lang === 'th');

	$effect(() => {
		liked = moment.liked;
		bookmarked = moment.bookmarked;
		likes = moment.likes;
		commentCount = moment.commentCount;
		if (expanded) commentsOpen = true;
	});

	function redirectToLogin() {
		const returnPath = `${page.url.pathname}${page.url.search}${page.url.hash}`;
		void goto(`/${page.data.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
	}

	async function setAction(action: 'like' | 'bookmark') {
		if (action === 'like' ? likePending : bookmarkPending) return;
		if (!page.data.user) { redirectToLogin(); return; }
		actionError = '';
		const selected = action === 'like' ? !liked : !bookmarked;
		const previousSelected = action === 'like' ? liked : bookmarked;
		const previousLikes = likes;
		if (action === 'like') { liked = selected; likes += selected ? 1 : -1; likePending = true; }
		else { bookmarked = selected; bookmarkPending = true; }
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(moment.id)}/${action}`, { method: selected ? 'PUT' : 'DELETE' });
			if (!response.ok) throw new Error('action-failed');
			if (action === 'bookmark' && page.url.pathname.endsWith('/halo/saved')) await invalidateAll();
		} catch {
			if (action === 'like') { liked = previousSelected; likes = previousLikes; }
			else bookmarked = previousSelected;
			actionError = isThai ? 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้ โปรดลองอีกครั้ง' : 'Unable to save this change. Please try again.';
		} finally {
			if (action === 'like') likePending = false; else bookmarkPending = false;
		}
	}

	function openReport() {
		if (!page.data.user) { redirectToLogin(); return; }
		reportOpen = true;
	}
</script>

<article class="border-b border-[#eee9ef] bg-white px-4 py-4 transition hover:bg-[#fdfcfd] sm:px-5">
	<div class="flex gap-3">
		<a href={`/${page.data.lang}/halo/u/${encodeURIComponent(moment.handle)}`} class="halo-focus-ring grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-lavender/25 text-sm font-bold text-plum">{#if moment.avatarUrl}<img src={moment.avatarUrl} alt="" class="h-full w-full object-cover" />{:else}{moment.initial}{/if}</a>
		<div class="min-w-0 flex-1">
			<header class="flex items-start gap-2"><div class="min-w-0 flex-1 truncate text-sm"><a href={`/${page.data.lang}/halo/u/${encodeURIComponent(moment.handle)}`} class="font-bold text-plum hover:underline">{moment.author}</a><span class="ml-1 text-plum-light">@{moment.handle} · {moment.time}</span></div></header>
			{#if moment.body}<p class="mt-1 whitespace-pre-line text-[.94rem] leading-6 text-plum">{moment.body}</p>{/if}
			{#if moment.tags.length}<div class="mt-2 flex flex-wrap gap-1.5">{#each moment.tags as tag}<a href={`/${page.data.lang}/halo?${tag.kind}Id=${encodeURIComponent(tag.id)}`} class="text-xs font-medium text-coral-dark hover:underline">#{tag.label}</a>{/each}</div>{/if}
			{#if moment.media.length}{#each moment.media as media (media.id)}{#if media.externalUrl}<img src={media.externalUrl} alt={media.altText ?? ''} loading="lazy" decoding="async" referrerpolicy="no-referrer" class="mt-3 max-h-[560px] w-full rounded-2xl object-cover" />{/if}{/each}{/if}
			{#if moment.source}<div class="mt-3"><EmbedPreview provider={moment.provider} source={moment.source} /></div>{/if}
			<div class="mt-2 flex max-w-md items-center justify-between text-xs text-plum-light">
				<button type="button" onclick={() => void setAction('like')} disabled={likePending} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-coral/10 hover:text-coral-dark {liked ? 'text-coral-dark [&_svg]:fill-current' : ''}" aria-pressed={liked} aria-label={m.halo_like()}><HaloIcon name="heart" size={16} /> {likes}</button>
				<button type="button" onclick={() => commentsOpen = !commentsOpen} aria-expanded={expanded || commentsOpen} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-lavender/15 hover:text-lavender-dark" aria-label={isThai ? 'เปิดความคิดเห็น' : 'Open comments'}><HaloIcon name="comment" size={16} /> {commentCount}</button>
				<button type="button" onclick={() => void setAction('bookmark')} disabled={bookmarkPending} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full hover:bg-mint/15 hover:text-mint-dark {bookmarked ? 'text-mint-dark [&_svg]:fill-current' : ''}" aria-pressed={bookmarked} aria-label={m.halo_save()}><HaloIcon name="bookmark" size={16} /></button>
				<button type="button" onclick={openReport} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full text-plum-light transition hover:bg-plum/[.05] hover:text-plum" aria-label={m.halo_report()} title={m.halo_report()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4.5M5 5.5c4-2.5 7 2.5 14 0v9c-7 2.5-10-2.5-14 0" /></svg></button>
			</div>
			{#if actionError}<p class="mt-2 text-xs text-coral-dark" aria-live="polite">{actionError}</p>{/if}
			{#if reportSent}<p class="mt-2 text-xs text-mint-dark" aria-live="polite">{isThai ? 'ส่งรายงานแล้ว ขอบคุณที่ช่วยดูแลชุมชน' : 'Report submitted. Thank you for helping the community.'}</p>{/if}
			{#if expanded || commentsOpen}<div class="mt-3"><MomentComments momentId={moment.id} onCommentCreated={() => commentCount += 1} /></div>{/if}
		</div>
	</div>
</article>
<MomentReportDialog momentId={moment.id} bind:open={reportOpen} onSuccess={() => reportSent = true} />
