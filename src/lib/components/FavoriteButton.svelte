<script lang="ts">
	import { page } from '$app/state';

	let { seriesId }: { seriesId: string } = $props();

	let favorited = $state(false);
	let loading = $state(false);
	let checking = $state(true);

	$effect(() => {
		if (!seriesId) return;

		if (!page.data.user) {
			checking = false;
			return;
		}

		fetch(`/api/favorites?seriesId=${encodeURIComponent(seriesId)}`)
			.then((r) => r.json())
			.then((data) => {
				if (data.favorited !== undefined) {
					favorited = data.favorited;
				}
				checking = false;
			})
			.catch(() => {
				checking = false;
			});
	});

	async function handleToggle() {
		if (!page.data.user) {
			window.location.href = `/login?redirect=${encodeURIComponent(page.url.pathname)}`;
			return;
		}

		loading = true;
		const previous = favorited;
		favorited = !favorited; // Optimistic

		try {
			const res = await fetch('/api/favorites', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId })
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				favorited = previous;
				return;
			}

			favorited = data.favorited;
		} catch {
			favorited = previous;
		} finally {
			loading = false;
		}
	}
</script>

<button
	onclick={handleToggle}
	disabled={checking || loading}
	aria-label={favorited ? 'เลิก Favorite' : 'เพิ่ม Favorite'}
	aria-pressed={favorited}
	class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 touch-target {favorited ? 'bg-coral/10 text-coral-dark' : 'glass-card text-plum-light hover:text-coral-dark hover:bg-coral/5'}"
>
	{#if checking}
		<svg class="w-5 h-5 animate-pulse text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
		</svg>
		<span class="sr-only">กำลังโหลด...</span>
	{:else}
		{#if favorited}
			<svg class="w-5 h-5 text-coral-dark" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
			<span>Favorite แล้ว</span>
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
			<span>Favorite</span>
		{/if}
	{/if}
</button>
