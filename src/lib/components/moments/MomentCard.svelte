<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import EmbedPreview from './EmbedPreview.svelte';
	import HaloIcon from './HaloIcon.svelte';
	import MomentComments from './MomentComments.svelte';
	import MomentReportDialog from './MomentReportDialog.svelte';
	import MomentDeleteDialog from './MomentDeleteDialog.svelte';
	import type { ProfileMoment } from './types.js';

	let { moment, expanded = false, onDeleted }: { moment: ProfileMoment; expanded?: boolean; onDeleted?: () => void | Promise<void> } = $props();
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
	let actionsOpen = $state(false); let deleteOpen = $state(false);
	let mediaIndex = $state(0);
	let fullImageOpen = $state(false);
	const isThai = $derived(page.data.lang === 'th');
	const isOwner = $derived(page.data.user?.id === moment.authorId);
	const images = $derived(moment.media.filter((media) => media.externalUrl));

	$effect(() => {
		liked = moment.liked;
		bookmarked = moment.bookmarked;
		likes = moment.likes;
		commentCount = moment.commentCount;
		mediaIndex = 0;
		fullImageOpen = false;
		if (expanded) commentsOpen = true;
	});

	function showPreviousImage() { mediaIndex = mediaIndex === 0 ? images.length - 1 : mediaIndex - 1; }
	function showNextImage() { mediaIndex = mediaIndex === images.length - 1 ? 0 : mediaIndex + 1; }

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
			<header class="flex items-start gap-2"><div class="min-w-0 flex-1 truncate text-sm"><a href={`/${page.data.lang}/halo/u/${encodeURIComponent(moment.handle)}`} class="font-bold text-plum hover:underline">{moment.author}</a><span class="ml-1 text-plum-light">@{moment.handle} · {moment.time}</span></div>{#if isOwner}<div class="relative"><button type="button" onclick={() => actionsOpen = !actionsOpen} aria-expanded={actionsOpen} aria-label={isThai ? 'จัดการโพสต์' : 'Manage post'} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full hover:bg-plum/[.05]">•••</button>{#if actionsOpen}<div role="menu" class="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-[#eee9ef] bg-white p-1 shadow-lg"><a role="menuitem" href={`/${page.data.lang}/halo/moments/${encodeURIComponent(moment.id)}/edit`} class="block rounded-lg px-3 py-2 text-sm hover:bg-plum/[.05]">{isThai ? 'แก้ไขโพสต์' : 'Edit post'}</a><button role="menuitem" type="button" onclick={() => { actionsOpen = false; deleteOpen = true; }} class="w-full rounded-lg px-3 py-2 text-left text-sm text-coral-dark hover:bg-coral/10">{isThai ? 'ลบโพสต์' : 'Delete post'}</button></div>{/if}</div>{/if}</header>
			{#if moment.body}<p class="mt-1 whitespace-pre-line text-[.94rem] leading-6 text-plum">{moment.body}</p>{/if}
			{#if moment.tags.length}<div class="mt-2 flex flex-wrap gap-1.5">{#each moment.tags as tag}<a href={`/${page.data.lang}/halo?${tag.kind}Id=${encodeURIComponent(tag.id)}`} class="text-xs font-medium text-coral-dark hover:underline">#{tag.label}</a>{/each}</div>{/if}
			{#if images.length}
				<div class="relative mt-3 aspect-[4/5] max-h-[560px] overflow-hidden rounded-2xl bg-plum/[.04]" role="region" aria-roledescription="carousel" aria-label={isThai ? `รูปภาพโพสต์ ${images.length} รูป` : `${images.length} post images`}>
					{#each images as media, index (media.id)}
						<div class="h-full" class:hidden={index !== mediaIndex}>
							<button type="button" onclick={() => fullImageOpen = true} class="halo-focus-ring block h-full w-full" aria-label={isThai ? 'ดูภาพขนาดเต็ม' : 'View full image'}><img src={media.externalUrl} alt={media.altText ?? ''} loading="lazy" decoding="async" referrerpolicy="no-referrer" class="h-full w-full object-cover" /></button>
						</div>
					{/each}
					{#if images.length > 1}
						<button type="button" onclick={showPreviousImage} class="halo-focus-ring absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-plum shadow-sm transition hover:bg-white" aria-label={isThai ? 'รูปก่อนหน้า' : 'Previous image'}>‹</button>
						<button type="button" onclick={showNextImage} class="halo-focus-ring absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-plum shadow-sm transition hover:bg-white" aria-label={isThai ? 'รูปถัดไป' : 'Next image'}>›</button>
						<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-plum/55 px-2 py-1" aria-label={isThai ? `รูปที่ ${mediaIndex + 1} จาก ${images.length}` : `Image ${mediaIndex + 1} of ${images.length}`}>
							{#each images as _, index}<span class="h-1.5 rounded-full transition-all {index === mediaIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}"></span>{/each}
						</div>
					{/if}
				</div>
			{/if}
			{#if moment.source}<div class="mt-3"><EmbedPreview provider={moment.provider} source={moment.source} caption={moment.body} thumbnailUrl={moment.previewThumbnailUrl} title={moment.previewTitle} author={moment.previewAuthor} feedCard={!expanded} /></div>{/if}
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
{#if fullImageOpen && images[mediaIndex]}
	<div class="fixed inset-0 z-50 grid place-items-center bg-plum/90 p-4" role="dialog" aria-modal="true" aria-label={isThai ? 'ภาพขนาดเต็ม' : 'Full-size image'}>
		<button type="button" onclick={() => fullImageOpen = false} class="halo-focus-ring absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25" aria-label={isThai ? 'ปิดภาพขนาดเต็ม' : 'Close full-size image'}>×</button>
		<div class="relative h-full w-full" role="region" aria-roledescription="carousel" aria-label={isThai ? `รูปภาพโพสต์ ${images.length} รูป` : `${images.length} post images`}>
			<img src={images[mediaIndex].externalUrl} alt={images[mediaIndex].altText ?? ''} decoding="async" referrerpolicy="no-referrer" class="h-full w-full object-contain" />
			{#if images.length > 1}
				<button type="button" onclick={showPreviousImage} class="halo-focus-ring absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25" aria-label={isThai ? 'รูปก่อนหน้า' : 'Previous image'}>‹</button>
				<button type="button" onclick={showNextImage} class="halo-focus-ring absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25" aria-label={isThai ? 'รูปถัดไป' : 'Next image'}>›</button>
				<p class="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-plum/55 px-3 py-1 text-sm text-white" aria-live="polite">{mediaIndex + 1} / {images.length}</p>
			{/if}
		</div>
	</div>
{/if}
<MomentReportDialog momentId={moment.id} bind:open={reportOpen} onSuccess={() => reportSent = true} />
<MomentDeleteDialog momentId={moment.id} bind:open={deleteOpen} onSuccess={async () => { if (onDeleted) await onDeleted(); else await invalidateAll(); }} />
