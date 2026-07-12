<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js'; import MomentCard from '$lib/components/moments/MomentCard.svelte'; import { sampleMoments } from '$lib/components/moments/types.js';
	const moment = sampleMoments[0];
</script>
<a href="../" class="text-sm font-bold text-plum-light hover:text-coral-dark">← {m.halo_feed()}</a><h1 class="mt-4 font-display text-2xl font-extrabold">{m.halo_detail()}</h1><div id="comments" class="mt-4"><MomentCard {moment} expanded /></div>
