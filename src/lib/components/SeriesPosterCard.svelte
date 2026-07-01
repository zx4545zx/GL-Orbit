<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import type { SeriesListItem } from '$lib/server/series/listing.js';

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
	};

	let { item, href = `/series/${item.id}` }: { item: SeriesListItem; href?: string } = $props();
	const badge = $derived(statusConfig[item.status] ?? statusConfig.ENDED);
</script>

<a {href} class="group">
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
		<div class="relative aspect-[3/4] overflow-hidden">
			<img src={item.poster} alt={item.title} width={400} height={533} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />
			<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
			<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
				<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {badge.class}">{badge.text}</span>
			</div>
			<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
				<p class="text-white/70 text-xs sm:text-sm mb-1">{item.studio}</p>
				<h3 class="text-white font-bold text-lg sm:text-xl mb-1 line-clamp-1">{item.title}</h3>
				{#if item.subtitle}<p class="text-white/80 text-xs sm:text-sm line-clamp-1">{item.subtitle}</p>{/if}
			</div>
		</div>
	</div>
</a>
