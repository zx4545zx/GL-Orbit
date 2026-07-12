<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';
	const isThai = $derived(page.data.lang === 'th');
</script>

<HaloPageHeader kicker={isThai ? 'เห็นเฉพาะคุณ' : 'Only you'} title={m.halo_saved_title()} description={isThai ? 'โมเมนต์ที่บันทึกไว้จะอยู่ที่นี่' : 'Moments you save appear here.'} icon="bookmark" />
<MomentFeed moments={[{ ...sampleMoments[1], saved: true }]} />
