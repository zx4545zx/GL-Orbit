<script lang="ts">
	type IconName =
		| 'home'
		| 'explore'
		| 'bookmark'
		| 'bell'
		| 'user'
		| 'plus'
		| 'arrow-left'
		| 'spark'
		| 'heart'
		| 'comment'
		| 'more'
		| 'external'
		| 'send'
		| 'link'
		| 'lock'
		| 'image'
		| 'smile'
		| 'x';

	let { name, size = 20, strokeWidth = 1.8 }: { name: IconName | string; size?: number; strokeWidth?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'home'}
		<path d="m3.5 10.8 8.5-7 8.5 7v8.7a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
	{:else if name === 'explore'}
		<circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="m8.8 13.2 1.3-3.1 3.1-1.3-1.3 3.1z" />
	{:else if name === 'bookmark'}
		<path d="M6.5 4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16l-5.5-4-5.5 4z" />
	{:else if name === 'bell'}
		<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" /><path d="M10 21h4" />
	{:else if name === 'user'}
		<circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{:else if name === 'arrow-left'}
		<path d="m15 18-6-6 6-6" />
	{:else if name === 'spark'}
		<path d="M12 2.8c.7 5.2 4 8.5 9.2 9.2-5.2.7-8.5 4-9.2 9.2-.7-5.2-4-8.5-9.2-9.2C8 11.3 11.3 8 12 2.8Z" />
	{:else if name === 'heart'}
		<path d="M20.8 5.8c-2-2.1-5.2-2.2-7.3-.2L12 7l-1.5-1.4c-2.1-2-5.3-1.9-7.3.2-2 2.2-1.8 5.6.4 7.6L12 21l8.4-7.6c2.2-2 2.4-5.4.4-7.6Z" />
	{:else if name === 'comment'}
		<path d="M20.5 11.5a8.5 8.5 0 0 1-9 8.5 9.3 9.3 0 0 1-3.8-.9L3 20.5l1.4-4.3a8.1 8.1 0 0 1-.9-3.7 8.5 8.5 0 0 1 17-1Z" />
	{:else if name === 'more'}
		<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
	{:else if name === 'external'}
		<path d="M14 4h6v6M20 4l-9 9" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
	{:else if name === 'send'}
		<path d="m21 3-8.2 18-2.3-7.5L3 11.2zM10.5 13.5 21 3" />
	{:else if name === 'link'}
		<path d="m10 13.5 4-4" /><path d="M7.3 16.2 5.8 17.7a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" transform="translate(2)" /><path d="m14.7 7.8 1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" transform="translate(-2)" />
	{:else if name === 'lock'}
		<rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
	{:else if name === 'image'}
		<rect x="3.5" y="4" width="17" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.4" /><path d="m4 17 4.8-4.8a1.5 1.5 0 0 1 2.1 0l2.2 2.2 1.7-1.7a1.5 1.5 0 0 1 2.1 0l3.1 3.1" />
	{:else if name === 'smile'}
		<circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8M8.8 9.5h.1m6.2 0h.1" />
	{:else if name === 'x'}
		<path d="m6 6 12 12M18 6 6 18" />
	{/if}
</svg>
