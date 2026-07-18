<script lang="ts">
	import Picture from '$lib/components/Picture.svelte';

	let {
		href,
		image,
		secondaryImage = '',
		imageType = 'posters',
		title,
		subtitle = '',
		eyebrow = '',
		badgeText = '',
		badgeClass = 'bg-white/20 text-white',
		chips = [],
		alt = title,
		secondaryAlt = '',
		sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
	}: {
		href: string;
		image: string;
		secondaryImage?: string;
		imageType?: 'posters' | 'profiles';
		title: string;
		subtitle?: string;
		eyebrow?: string;
		badgeText?: string;
		badgeClass?: string;
		chips?: string[];
		alt?: string;
		secondaryAlt?: string;
		sizes?: string;
	} = $props();
</script>

<a href={href} class="group block h-full focus-visible:outline-offset-4">
	<div class="flex h-full flex-col overflow-hidden border border-[var(--orbit-line)] bg-white p-2 transition-[border-color,box-shadow] group-hover:border-coral/60 group-hover:shadow-[var(--orbit-shadow)]">
		<div class="relative aspect-[3/4] overflow-hidden bg-lavender/10">
			{#if secondaryImage}
				<div class="absolute inset-0 bg-lavender/25"></div>
				<div class="relative h-full px-2.5 py-3 sm:px-3 sm:py-4">
					<div class="absolute inset-y-3 left-2.5 w-[62%] -rotate-[3deg] overflow-hidden rounded-md border border-white sm:inset-y-4 sm:left-3">
						<Picture src={image} type={imageType} sizes="(max-width: 640px) 31vw, (max-width: 1024px) 20.5vw, 15.5vw" {alt} width={250} height={533} class="h-full w-full object-cover" loading="lazy" decoding="async" />
					</div>
					<div class="absolute inset-y-3 right-2.5 w-[62%] rotate-[3deg] overflow-hidden rounded-md border border-white sm:inset-y-4 sm:right-3">
						<Picture src={secondaryImage} type={imageType} sizes="(max-width: 640px) 31vw, (max-width: 1024px) 20.5vw, 15.5vw" alt={secondaryAlt || alt} width={250} height={533} class="h-full w-full object-cover" loading="lazy" decoding="async" />
					</div>
					<span class="orbit-round-data absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center bg-white text-sm text-coral sm:size-9" aria-hidden="true">♥</span>
				</div>
			{:else}
				<Picture
					src={image}
					type={imageType}
					{sizes}
					{alt}
					width={400}
					height={533}
					class="w-full h-full object-cover transition duration-300 group-hover:opacity-90"
					loading="lazy"
					decoding="async"
				/>
			{/if}
			{#if badgeText}
				<div class="absolute left-2.5 top-2.5 sm:left-3 sm:top-3">
					<span class="rounded-md px-2 py-1 text-[0.65rem] font-semibold {badgeClass}">
						{badgeText}
					</span>
				</div>
			{/if}
		</div>
		<div class="min-w-0 px-1 pb-1 pt-3">
			{#if eyebrow}<p class="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-coral line-clamp-1">{eyebrow}</p>{/if}
			<h3 class="text-plum font-semibold text-sm sm:text-base leading-snug line-clamp-2 transition-colors group-hover:text-coral-dark">{title}</h3>
			{#if subtitle}<p class="mt-1 text-plum-light text-xs sm:text-sm line-clamp-1">{subtitle}</p>{/if}
			{#if chips.length > 0}
				<div class="mt-2 hidden flex-wrap gap-1 sm:flex">
					{#each chips as chip}
						<span class="rounded px-1.5 py-0.5 bg-lavender/30 text-plum text-xs font-medium">{chip}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
