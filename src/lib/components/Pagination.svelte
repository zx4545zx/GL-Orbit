<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	interface Props {
		page: number;
		totalPages: number;
		total: number;
		limit: number;
	}

	let { page, totalPages, total, limit }: Props = $props();

	function goTo(p: number) {
		if (p < 1 || p > totalPages || p === page) return;
		const url = new URL(window.location.href);
		url.searchParams.set('page', String(p));
		window.location.href = url.toString();
	}

	function pageNumbers() {
		const pages: (number | string)[] = [];
		const maxVisible = 5;
		let start = Math.max(1, page - Math.floor(maxVisible / 2));
		let end = Math.min(totalPages, start + maxVisible - 1);
		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}
		if (start > 1) {
			pages.push(1);
			if (start > 2) pages.push('...');
		}
		for (let i = start; i <= end; i++) pages.push(i);
		if (end < totalPages) {
			if (end < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	}

	const startItem = $derived((page - 1) * limit + 1);
	const endItem = $derived(Math.min(page * limit, total));
</script>

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
	<p class="text-sm text-plum-light">
		{@html m.pagination_showing({ start: startItem, end: endItem, total })}
	</p>

	<div class="flex items-center gap-1.5">
		<button
			onclick={() => goTo(page - 1)}
			disabled={page <= 1}
			aria-label={m.pagination_prev_aria()}
			class="px-3 py-2 rounded-md text-sm font-medium transition-all touch-target disabled:opacity-40 disabled:cursor-not-allowed {page <= 1 ? 'text-plum-light/50' : 'text-plum hover:bg-lavender/30'}"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
		</button>

		{#each pageNumbers() as p}
			{#if p === '...'}
				<span class="px-2 text-sm text-plum-light">...</span>
			{:else}
				<button
					onclick={() => goTo(p as number)}
					class="min-w-[2.25rem] h-9 px-2.5 rounded-md text-sm font-medium transition-all touch-target {page === p ? 'bg-coral text-white shadow-sm shadow-coral/25' : 'text-plum hover:bg-lavender/30'}"
				>
					{p}
				</button>
			{/if}
		{/each}

		<button
			onclick={() => goTo(page + 1)}
			disabled={page >= totalPages}
			aria-label={m.pagination_next_aria()}
			class="px-3 py-2 rounded-md text-sm font-medium transition-all touch-target disabled:opacity-40 disabled:cursor-not-allowed {page >= totalPages ? 'text-plum-light/50' : 'text-plum hover:bg-lavender/30'}"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
		</button>
	</div>
</div>
