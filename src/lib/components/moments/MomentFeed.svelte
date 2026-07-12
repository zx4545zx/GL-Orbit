<script lang="ts">
	import MomentCard from './MomentCard.svelte';
	import { toProfileMoment, type HaloMoment, type MomentApiItem, type ProfileMoment } from './types.js';
	let { moments, initialCursor = null, authorId, expanded = false }: { moments: ProfileMoment[] | HaloMoment[]; initialCursor?: string | null; authorId?: string; expanded?: boolean } = $props();
	let feed = $state([...moments]);
	let nextCursor = $state(initialCursor);
	let loading = $state(false);
	let error = $state('');
	let sentinel = $state<HTMLDivElement>();
	let sentinelIntersecting = $state(false);
	let paginationRevision = $state<object>({});

	$effect(() => {
		feed = [...moments];
		nextCursor = initialCursor;
		loading = false;
		error = '';
		paginationRevision = {};
	});

	async function loadNextPage() {
		if (!authorId || !nextCursor || loading || error) return;
		loading = true;
		try {
			const response = await fetch(`/api/moments?authorId=${encodeURIComponent(authorId)}&cursor=${encodeURIComponent(nextCursor)}`);
			if (!response.ok) throw new Error();
			const payload = await response.json() as { moments: MomentApiItem[]; nextCursor: string | null };
			const known = new Set(feed.map((moment) => moment.id));
			feed = [...feed, ...payload.moments.map(toProfileMoment).filter((moment) => !known.has(moment.id))];
			nextCursor = payload.nextCursor;
		} catch {
			error = 'ไม่สามารถโหลด Moments เพิ่มเติมได้ โปรดลองอีกครั้ง';
		} finally {
			loading = false;
			if (sentinelIntersecting) void loadNextPage();
		}
	}

	function retry() { error = ''; void loadNextPage(); }

	$effect(() => {
		paginationRevision;
		if (!sentinel || !authorId) return;
		const observer = new IntersectionObserver((entries) => {
			sentinelIntersecting = entries[0]?.isIntersecting ?? false;
			if (sentinelIntersecting) void loadNextPage();
		}, { rootMargin: '200px' });
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div aria-live="polite">
	{#if feed.length}
		{#each feed as moment (moment.id)}<MomentCard {moment} {expanded} />{/each}
		{#if authorId}<div bind:this={sentinel} class="border-b border-[#eee9ef] px-4 py-4 text-center text-sm text-plum-light" aria-live="polite">
			{#if loading}กำลังโหลด Moments…
			{:else if error}<p>{error}</p><button type="button" onclick={retry} class="halo-focus-ring mt-2 rounded-full border border-[#ded8df] px-4 py-2 font-medium text-coral-dark">ลองใหม่</button>
			{:else if nextCursor === null}ไม่มี Moments เพิ่มเติมแล้ว{/if}
		</div>{/if}
	{:else}
		<div class="border-b border-[#eee9ef] px-6 py-16 text-center"><p class="font-display text-xl font-bold">ยังไม่มี Moments</p><p class="mt-1 text-sm text-plum-light">เริ่มแบ่งปันโมเมนต์ของคุณได้เลย</p></div>
	{/if}
</div>
