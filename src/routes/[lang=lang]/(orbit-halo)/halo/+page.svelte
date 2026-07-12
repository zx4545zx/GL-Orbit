<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import MomentComposer from '$lib/components/moments/MomentComposer.svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { sampleMoments } from '$lib/components/moments/types.js';
</script>
<svelte:head><title>Orbit Halo · GL-Orbit</title></svelte:head>
<section class="mb-5"><p class="font-display text-2xl font-extrabold tracking-tight">Orbit <span class="text-coral-dark">Halo</span></p><p class="mt-1 text-sm text-plum-light">{m.halo_tagline()}</p></section>
<div id="compose"><MomentComposer /></div><div class="mt-5"><MomentFeed moments={sampleMoments} /></div>
