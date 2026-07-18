<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import Picture from '$lib/components/Picture.svelte';
	import type { SeriesListItem } from '$lib/server/series/listing.js';

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }
	};

	let { item, href = `/series/${item.id}` }: { item: SeriesListItem; href?: string } = $props();
	const badge = $derived(statusConfig[item.status] ?? statusConfig.ENDED);
</script>

<a {href} class="group block h-full rounded-xl focus-visible:outline-offset-4">
	<div class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--orbit-line)] bg-white shadow-[var(--orbit-shadow)] transition-[border-color,box-shadow] group-hover:border-coral/60 group-hover:shadow-[var(--orbit-shadow-raised)]">
		<div class="relative aspect-[3/4] overflow-hidden">
			<Picture src={item.poster} type="posters" sizes="(max-width: 420px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" alt={item.title} width={400} height={533} loading="lazy" class="w-full h-full object-cover transition duration-300 group-hover:opacity-90" />
			<div class="absolute left-2.5 top-2.5 sm:left-3 sm:top-3">
				<span class="rounded-md px-2 py-1 text-[0.65rem] font-semibold {badge.class}">{badge.text}</span>
			</div>
		</div>
		<div class="min-w-0 flex-1 p-3 sm:p-4">
			<p class="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-coral line-clamp-1">{item.studio}</p>
			<h3 class="min-h-[2.5rem] text-sm font-semibold leading-snug text-plum line-clamp-2 transition-colors group-hover:text-coral-dark sm:min-h-[2.75rem] sm:text-base">{item.title}</h3>
			{#if item.subtitle}<p class="mt-1 text-plum-light text-xs sm:text-sm line-clamp-1">{item.subtitle}</p>{/if}
		</div>
	</div>
</a>
