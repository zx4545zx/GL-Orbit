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

<a href={href} class="group">
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
		<div class="relative aspect-[3/4] overflow-hidden bg-lavender/10">
			{#if secondaryImage}
				<div class="absolute inset-0 scale-110 opacity-35 blur-xl">
					<Picture src={image} type={imageType} {sizes} alt="" width={400} height={533} class="h-full w-full object-cover" loading="lazy" decoding="async" />
				</div>
				<div class="absolute inset-0 bg-plum/25"></div>
				<div class="relative h-full px-2.5 py-3 sm:px-3 sm:py-4">
					<div class="absolute inset-y-3 left-2.5 w-[62%] -rotate-[4deg] overflow-hidden rounded-[1.1rem] border-2 border-white/80 shadow-xl shadow-plum/30 transition-transform duration-700 group-hover:-rotate-[7deg] sm:inset-y-4 sm:left-3 sm:rounded-[1.35rem]">
						<Picture src={image} type={imageType} sizes="(max-width: 640px) 31vw, (max-width: 1024px) 20.5vw, 15.5vw" {alt} width={250} height={533} class="h-full w-full object-cover" loading="lazy" decoding="async" />
					</div>
					<div class="absolute inset-y-3 right-2.5 w-[62%] rotate-[4deg] overflow-hidden rounded-[1.1rem] border-2 border-white/80 shadow-xl shadow-plum/30 transition-transform duration-700 group-hover:rotate-[7deg] sm:inset-y-4 sm:right-3 sm:rounded-[1.35rem]">
						<Picture src={secondaryImage} type={imageType} sizes="(max-width: 640px) 31vw, (max-width: 1024px) 20.5vw, 15.5vw" alt={secondaryAlt || alt} width={250} height={533} class="h-full w-full object-cover" loading="lazy" decoding="async" />
					</div>
					<span class="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 bg-coral text-sm text-white shadow-lg shadow-plum/30 sm:size-9" aria-hidden="true">♥</span>
				</div>
			{:else}
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
				<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(255,255,255,0.45),transparent_20%),linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.22)_48%,transparent_61%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
				<div class="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full border border-white/45 bg-white/10 shadow-[0_0_32px_rgba(196,181,253,0.45)] transition-transform duration-700 group-hover:scale-125"></div>
			{/if}
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
