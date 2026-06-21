<script lang="ts">
	import { page } from '$app/state';

	let { seriesId, className = '' }: { seriesId: string; className?: string } = $props();

	let watched = $state(false);
	let loading = $state(false);
	let checking = $state(true);

	const isLoading = $derived(checking || loading);

	$effect(() => {
		if (!seriesId) return;

		if (!page.data.user) {
			checking = false;
			return;
		}

		fetch(`/api/watched?seriesId=${encodeURIComponent(seriesId)}`)
			.then((r) => r.json())
			.then((data) => {
				if (data.watched !== undefined) {
					watched = data.watched;
				}
				checking = false;
			})
			.catch(() => {
				checking = false;
			});
	});

	async function handleToggle() {
		if (!page.data.user) {
			window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}

		loading = true;
		const previous = watched;
		watched = !watched; // Optimistic

		try {
			const res = await fetch('/api/watched', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId })
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				watched = previous;
				return;
			}

			watched = data.watched;
		} catch {
			watched = previous;
		} finally {
			loading = false;
		}
	}
</script>

<button
	onclick={handleToggle}
	disabled={isLoading}
	aria-label={isLoading ? 'กำลังโหลด' : watched ? 'เลิก mark ดูแล้ว' : 'mark ว่าดูแล้ว'}
	aria-pressed={isLoading ? undefined : watched}
	class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 touch-target {isLoading ? 'glass-card text-plum-light cursor-wait' : watched ? 'bg-mint/15 text-mint-dark' : 'glass-card text-plum-light hover:text-mint-dark hover:bg-mint/5'} {className}"
>
	{#if isLoading}
		<svg class="w-5 h-5 animate-spin text-plum-light" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
	{:else if watched}
		<svg class="w-5 h-5 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
		</svg>
		<span class="hidden sm:inline">ดูแล้ว</span>
	{:else}
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
		</svg>
		<span class="hidden sm:inline">ดูแล้ว</span>
	{/if}
</button>
