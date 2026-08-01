<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		eyebrow?: string;
		headingId?: string;
		leading?: Snippet;
		actions?: Snippet;
		embedded?: boolean;
	}

	let {
		title,
		description,
		eyebrow = 'GL Orbit',
		headingId,
		leading,
		actions,
		embedded = false
	}: Props = $props();
</script>

<header
	class="grid gap-5 bg-[var(--orbit-surface)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7 {embedded
		? 'border-b border-[var(--orbit-line)]'
		: 'border border-[var(--orbit-line)]'}"
>
	<div class="flex min-w-0 items-start gap-4">
		{#if leading}
			<div class="shrink-0">{@render leading()}</div>
		{/if}
		<div class="min-w-0">
			<p class="text-xs font-bold uppercase tracking-[0.18em] text-[var(--orbit-coral)]">{eyebrow}</p>
			<h1
				id={headingId}
				class="mt-2 break-words font-display text-3xl text-[var(--orbit-ink)] sm:text-4xl"
			>
				{title}
			</h1>
			{#if description}
				<p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--orbit-muted)] sm:text-base">
					{description}
				</p>
			{/if}
		</div>
	</div>

	{#if actions}
		<div class="grid gap-2 sm:flex sm:items-center">{@render actions()}</div>
	{/if}
</header>
