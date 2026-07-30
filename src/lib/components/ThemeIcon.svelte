<script lang="ts">
	import type { ThemeName } from '$lib/theme.svelte.js';

	let { theme, className = 'h-5 w-5' }: { theme: ThemeName; className?: string } = $props();

	const iconPaths: Record<ThemeName, readonly string[]> = {
		fanzine: ['M6 3h9l3 3v15H6V3Z', 'M15 3v4h3M9 11h6M9 15h6M9 18h4'],
		midnight: ['M20.5 15.25A8.5 8.5 0 0 1 8.75 3.5 8.5 8.5 0 1 0 20.5 15.25Z'],
		y2k: ['M12 2v5M12 17v5M2 12h5M17 12h5', 'm5 5 3 3M16 16l3 3M19 5l-3 3M8 16l-3 3', 'm12 8 1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2L12 8Z'],
		sakura: ['M12 10.5C7.5 8 8 3 12 3c4 0 4.5 5 0 7.5Z', 'M13.5 12c2.5-4.5 7.5-4 7.5 0s-5 4.5-7.5 0Z', 'M12 13.5c4.5 2.5 4 7.5 0 7.5s-4.5-5 0-7.5Z', 'M10.5 12C8 16.5 3 16 3 12s5-4.5 7.5 0Z'],
		ocean: ['M3 9c2.25 0 2.25-2 4.5-2s2.25 2 4.5 2 2.25-2 4.5-2S18.75 9 21 9', 'M3 14c2.25 0 2.25-2 4.5-2s2.25 2 4.5 2 2.25-2 4.5-2 2.25 2 4.5 2', 'M5 18c1.75 0 1.75-1.5 3.5-1.5S10.25 18 12 18'],
		candy: ['m3 8 4 1v6l-4 1 2-4-2-4ZM21 8l-4 1v6l4 1-2-4 2-4Z', 'M7 9c2-2 8-2 10 0v6c-2 2-8 2-10 0V9Z'],
		mission: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z']
	};
</script>

<svg
	class={className}
	data-theme-icon={theme}
	fill="none"
	stroke="currentColor"
	viewBox="0 0 24 24"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{#each iconPaths[theme] as path}
		<path d={path} />
	{/each}
</svg>
