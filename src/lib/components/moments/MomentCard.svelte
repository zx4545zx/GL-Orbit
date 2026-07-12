<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import EmbedPreview from './EmbedPreview.svelte';
	import HaloIcon from './HaloIcon.svelte';
	import MomentComments from './MomentComments.svelte';
	import type { HaloMoment, ProfileMoment } from './types.js';
	let { moment, expanded = false }: { moment: ProfileMoment | HaloMoment; expanded?: boolean } = $props();
	const isProfileMoment = $derived('commentCount' in moment);
	const profile = $derived(moment as ProfileMoment);
	const legacy = $derived(moment as HaloMoment);
	let liked = $state(false); let bookmarked = $state(false); let likes = $state(0); let commentCount = $state(0);
	let likePending = $state(false); let bookmarkPending = $state(false); let actionError = $state('');
	let commentsOpen = $state(expanded);
	$effect(() => {
		liked = isProfileMoment ? profile.liked : false;
		bookmarked = isProfileMoment ? profile.bookmarked : (legacy.saved ?? false);
		likes = moment.likes;
		commentCount = isProfileMoment ? profile.commentCount : legacy.comments.length;
	});

	async function setAction(action: 'like' | 'bookmark') {
		if (!isProfileMoment || (action === 'like' ? likePending : bookmarkPending)) return;
		actionError = '';
		const selected = action === 'like' ? !liked : !bookmarked;
		const previousSelected = action === 'like' ? liked : bookmarked;
		const previousLikes = likes;
		if (action === 'like') { liked = selected; likes += selected ? 1 : -1; likePending = true; }
		else { bookmarked = selected; bookmarkPending = true; }
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(moment.id)}/${action}`, { method: selected ? 'PUT' : 'DELETE' });
			if (!response.ok) throw new Error();
		} catch {
			if (action === 'like') { liked = previousSelected; likes = previousLikes; }
			else bookmarked = previousSelected;
			actionError = 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้ โปรดลองอีกครั้ง';
		} finally {
			if (action === 'like') likePending = false; else bookmarkPending = false;
		}
	}
</script>

<article class="border-b border-[#eee9ef] bg-white px-4 py-4 transition hover:bg-[#fdfcfd] sm:px-5">
	<div class="flex gap-3">
		<a href={`/${page.data.lang}/halo/u/${moment.handle}`} class="halo-focus-ring grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-lavender/25 text-sm font-bold text-plum">{#if isProfileMoment && profile.avatarUrl}<img src={profile.avatarUrl} alt="" class="h-full w-full object-cover" />{:else}{moment.initial}{/if}</a>
		<div class="min-w-0 flex-1">
			<header class="flex items-start gap-2"><div class="min-w-0 flex-1 truncate text-sm"><a href={`/${page.data.lang}/halo/u/${moment.handle}`} class="font-bold text-plum hover:underline">{moment.author}</a><span class="ml-1 text-plum-light">@{moment.handle} · {moment.time}</span></div><button class="halo-focus-ring -mr-2 grid h-8 w-8 place-items-center rounded-full text-plum-light hover:bg-coral/10 hover:text-coral-dark" aria-label="More options"><HaloIcon name="more" size={18} /></button></header>
			<p class="mt-1 whitespace-pre-line text-[.94rem] leading-6 text-plum">{moment.body}</p>
			<div class="mt-2 flex flex-wrap gap-1.5">{#each moment.tags as tag}<a href={`/${page.data.lang}/halo/explore`} class="text-xs font-medium text-coral-dark hover:underline">{tag}</a>{/each}</div>
			{#if isProfileMoment && profile.media.length}{#each profile.media as media (media.id)}{#if media.externalUrl}<img src={media.externalUrl} alt={media.altText ?? ''} class="mt-3 max-h-[560px] w-full rounded-2xl object-cover" />{/if}{/each}{/if}
			{#if moment.source}<div class="mt-3"><EmbedPreview provider={moment.provider} source={moment.source} /></div>{/if}
			<div class="mt-2 flex max-w-md items-center justify-between text-xs text-plum-light">
				<button onclick={() => isProfileMoment ? void setAction('like') : (liked = !liked)} disabled={likePending} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-coral/10 hover:text-coral-dark {liked ? 'text-coral-dark [&_svg]:fill-current' : ''}" aria-pressed={liked} aria-label={m.halo_like()}><HaloIcon name="heart" size={16} /> {isProfileMoment ? likes : moment.likes + (liked ? 1 : 0)}</button>
				{#if isProfileMoment}<button type="button" onclick={() => commentsOpen = !commentsOpen} aria-expanded={expanded || commentsOpen} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-lavender/15 hover:text-lavender-dark" aria-label="เปิดความคิดเห็น"><HaloIcon name="comment" size={16} /> {commentCount}</button>{:else}<a href={`/${page.data.lang}/halo/moments/${moment.id}#comments`} class="halo-focus-ring flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-lavender/15 hover:text-lavender-dark"><HaloIcon name="comment" size={16} /> {commentCount}</a>{/if}
				<button onclick={() => isProfileMoment ? void setAction('bookmark') : (bookmarked = !bookmarked)} disabled={bookmarkPending} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full hover:bg-mint/15 hover:text-mint-dark {bookmarked ? 'text-mint-dark [&_svg]:fill-current' : ''}" aria-pressed={bookmarked} aria-label={m.halo_save()}><HaloIcon name="bookmark" size={16} /></button>
				<button class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full text-plum-light transition hover:bg-plum/[.05] hover:text-plum" aria-label="รายงาน Moment นี้" title={m.halo_report()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4.5M5 5.5c4-2.5 7 2.5 14 0v9c-7 2.5-10-2.5-14 0" /></svg><span class="sr-only">{m.halo_report()}</span></button>
			</div>
			{#if actionError}<p class="mt-2 text-xs text-coral-dark" aria-live="polite">{actionError}</p>{/if}
			{#if expanded || commentsOpen}<div class="mt-3"><MomentComments momentId={moment.id} interactive={isProfileMoment} legacyComments={isProfileMoment ? undefined : legacy.comments} onCommentCreated={() => commentCount += 1} /></div>{/if}
		</div>
	</div>
</article>
