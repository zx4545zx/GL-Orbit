<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const isThai = $derived(page.data.lang === 'th');
	const moments = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
</script>

<HaloPageHeader kicker={isThai ? 'เห็นเฉพาะคุณ' : 'Only you'} title={m.halo_saved_title()} description={isThai ? 'โมเมนต์ที่บันทึกไว้จะอยู่ที่นี่' : 'Moments you save appear here.'} icon="bookmark" />
<MomentFeed {moments} initialCursor={data.nextCursor} paginationQuery="bookmarked=true" />
