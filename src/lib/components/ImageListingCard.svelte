<script lang="ts">
	import Picture from '$lib/components/Picture.svelte';

	let {
		href,
		image,
		imageType = 'posters',
		title,
		subtitle = '',
		eyebrow = '',
		badgeText = '',
		badgeClass = 'bg-white/20 text-white',
		chips = [],
		alt = title,
		sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
	}: {
		href: string;
		image: string;
		imageType?: 'posters' | 'profiles';
		title: string;
		subtitle?: string;
		eyebrow?: string;
		badgeText?: string;
		badgeClass?: string;
		chips?: string[];
		alt?: string;
		sizes?: string;
	} = $props();
</script>

<a href={href} class="group">
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
		<div class="relative aspect-[3/4] overflow-hidden bg-lavender/10">
			<Picture
				src={image}
				type={imageType}
				{sizes}
				{alt}
				width={400}
				height={533}
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
				loading="lazy"
				decoding="async"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
			{#if badgeText}
				<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
					<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {badgeClass}">
						{badgeText}
					</span>
				</div>
			{/if}
			<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
				{#if eyebrow}<p class="text-white/70 text-xs sm:text-sm mb-1">{eyebrow}</p>{/if}
				<h3 class="text-white font-bold text-lg sm:text-xl mb-1 line-clamp-2">{title}</h3>
				{#if subtitle}<p class="text-white/80 text-xs sm:text-sm mb-2 line-clamp-1">{subtitle}</p>{/if}
				{#if chips.length > 0}
					<div class="hidden flex-wrap gap-1 sm:flex">
						{#each chips as chip}
							<span class="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">{chip}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</a>
