<script lang="ts">
	type IconName =
		| 'spark'
		| 'star'
		| 'play'
		| 'check'
		| 'arrow-left'
		| 'arrow-right'
		| 'chevron-left'
		| 'chevron-right'
		| 'external'
		| 'x';

	let {
		name,
		className = 'h-5 w-5',
		strokeWidth = 1.8
	}: { name: IconName; className?: string; strokeWidth?: number } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{#if name === 'spark'}
		<path d="M12 2.8c.7 5.2 4 8.5 9.2 9.2-5.2.7-8.5 4-9.2 9.2-.7-5.2-4-8.5-9.2-9.2C8 11.3 11.3 8 12 2.8Z" />
	{:else if name === 'star'}
		<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />
	{:else if name === 'play'}
		<path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none" />
	{:else if name === 'check'}
		<path d="m5 12 4.5 4.5L19 7" />
	{:else if name === 'arrow-left'}
		<path d="M19 12H5m6-6-6 6 6 6" />
	{:else if name === 'arrow-right'}
		<path d="M5 12h14m-6-6 6 6-6 6" />
	{:else if name === 'chevron-left'}
		<path d="m15 18-6-6 6-6" />
	{:else if name === 'chevron-right'}
		<path d="m9 18 6-6-6-6" />
	{:else if name === 'external'}
		<path d="M14 4h6v6M20 4l-9 9" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
	{:else if name === 'x'}
		<path d="m6 6 12 12M18 6 6 18" />
	{/if}
</svg>
