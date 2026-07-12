<script lang="ts">
	import { page } from '$app/state';
	import MomentCard from './MomentCard.svelte';
	import MomentCardSkeleton from './MomentCardSkeleton.svelte';
	import { toProfileMoment, type MomentApiItem, type ProfileMoment } from './types.js';
	let { moments, initialCursor = null, authorId, paginationQuery = null, expanded = false, initialLoading = false, skeletonCount = 3 }: { moments: ProfileMoment[]; initialCursor?: string | null; authorId?: string; paginationQuery?: string | null; expanded?: boolean; initialLoading?: boolean; skeletonCount?: number } = $props();
	function initialFeed() { return [...moments]; }
	function initialNextCursor() { return initialCursor; }
	let feed = $state(initialFeed());
	let nextCursor = $state(initialNextCursor());
	let loading = $state(false);
	let error = $state('');
	let sentinel = $state<HTMLDivElement>();
	let sentinelIntersecting = $state(false);
	let paginationRevision = $state<object>({});
	const resolvedPaginationQuery = $derived(paginationQuery ?? (authorId ? `authorId=${encodeURIComponent(authorId)}` : null));
	const canPaginate = $derived(resolvedPaginationQuery !== null);
	const isThai = $derived(page.data.lang === 'th');

	$effect(() => {
		feed = [...moments];
		nextCursor = initialCursor;
		loading = false;
		error = '';
		paginationRevision = {};
	});

	async function loadNextPage() {
		if (!canPaginate || !nextCursor || loading || error) return;
		loading = true;
		try {
			const params = new URLSearchParams(resolvedPaginationQuery ?? '');
			params.set('cursor', nextCursor);
			const response = await fetch(`/api/moments?${params.toString()}`);
			if (!response.ok) throw new Error();
			const payload = await response.json() as { moments: MomentApiItem[]; nextCursor: string | null };
			const known = new Set(feed.map((moment) => moment.id));
			feed = [...feed, ...payload.moments.map((moment) => toProfileMoment(moment, page.data.lang)).filter((moment) => !known.has(moment.id))];
			nextCursor = payload.nextCursor;
		} catch {
			error = isThai ? 'ไม่สามารถโหลด Moments เพิ่มเติมได้ โปรดลองอีกครั้ง' : 'Unable to load more Moments. Please try again.';
		} finally {
			loading = false;
			if (sentinelIntersecting) void loadNextPage();
		}
	}

	function retry() { error = ''; void loadNextPage(); }

	$effect(() => {
		paginationRevision;
		if (!sentinel || !canPaginate) return;
		const observer = new IntersectionObserver((entries) => {
			sentinelIntersecting = entries[0]?.isIntersecting ?? false;
			if (sentinelIntersecting) void loadNextPage();
		}, { rootMargin: '200px' });
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div aria-live="polite">
	{#if initialLoading && !feed.length}
		<MomentCardSkeleton count={skeletonCount} />
	{:else if feed.length}
		{#each feed as moment (moment.id)}<MomentCard {moment} {expanded} />{/each}
		{#if canPaginate}<div bind:this={sentinel} class="border-b border-[#eee9ef]" aria-live="polite">
			{#if loading}<MomentCardSkeleton count={1} />
			{:else if error}<div class="px-4 py-4 text-center text-sm text-plum-light"><p>{error}</p><button type="button" onclick={retry} class="halo-focus-ring mt-2 rounded-full border border-[#ded8df] px-4 py-2 font-medium text-coral-dark">{isThai ? 'ลองใหม่' : 'Try again'}</button></div>
			{:else if nextCursor === null}<div class="px-4 py-4 text-center text-sm text-plum-light">{isThai ? 'ไม่มี Moments เพิ่มเติมแล้ว' : 'You are all caught up'}</div>{/if}
		</div>{/if}
	{:else}
		<div class="border-b border-[#eee9ef] px-6 py-16 text-center"><p class="font-display text-xl font-bold">{isThai ? 'ยังไม่มี Moments' : 'No Moments yet'}</p><p class="mt-1 text-sm text-plum-light">{isThai ? 'เริ่มแบ่งปันโมเมนต์ของคุณได้เลย' : 'Be the first to share a Moment'}</p></div>
	{/if}
</div>
