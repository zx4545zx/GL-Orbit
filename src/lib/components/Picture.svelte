<script lang="ts">
	import { deriveVariantUrls, type ImageType } from '$lib/images/config.js';

	let {
		src,
		type,
		sizes,
		alt,
		width = undefined,
		height = undefined,
		loading = 'lazy',
		fetchpriority = undefined,
		class: cls = '',
		decoding = 'async'
	}: {
		src: string | null | undefined;
		type: ImageType;
		sizes?: string;
		alt: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
		decoding?: 'async' | 'sync' | 'auto';
	} = $props();

	const variants = $derived(src ? deriveVariantUrls(src, type) : null);

	const toSrcset = (entries: { url: string; width: number }[]) =>
		entries.map((e) => `${e.url} ${e.width}w`).join(', ');
</script>

{#if !src}
	<!-- no source; caller renders its own placeholder -->
{:else if variants}
	<picture>
		{#if variants.avif.length}
			<source type="image/avif" srcset={toSrcset(variants.avif)} {sizes} />
		{/if}
		{#if variants.webp.length}
			<source type="image/webp" srcset={toSrcset(variants.webp)} {sizes} />
		{/if}
		<img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls} {sizes} />
	</picture>
{:else}
	<img {src} {alt} {width} {height} {loading} {decoding} {fetchpriority} class={cls} />
{/if}
