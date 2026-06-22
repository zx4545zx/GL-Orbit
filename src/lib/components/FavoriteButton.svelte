<script lang="ts">
	import { page } from '$app/state';

	let { seriesId, className = '' }: { seriesId: string; className?: string } = $props();

	let favorited = $state(false);
	let loading = $state(false);
	let checking = $state(true);

	const isLoading = $derived(checking || loading);

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
			window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}

		loading = true;
		const previous = favorited;
		favorited = !favorited;

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
	disabled={isLoading}
	aria-label={isLoading ? 'กำลังโหลด' : favorited ? 'เลิก Favorite' : 'เพิ่ม Favorite'}
	aria-pressed={isLoading ? undefined : favorited}
	class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 touch-target active:scale-[0.97] {isLoading ? 'border border-plum/5 text-plum-light/50 cursor-wait' : favorited ? 'border border-coral/25 text-coral-dark shadow-sm shadow-coral/5' : 'border border-plum/10 text-plum-light hover:shadow-sm hover:-translate-y-0.5 hover:border-coral/20 hover:text-coral-dark'} {className}"
>
	{#if isLoading}
		<svg class="w-4 h-4 animate-spin text-plum-light/60" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
	{:else if favorited}
		<div class="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center shrink-0 ring-1 ring-coral/20">
			<svg class="w-3.5 h-3.5 text-coral-dark" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		</div>
		<span class="font-semibold">Favorite</span>
	{:else}
		<div class="w-7 h-7 rounded-full bg-plum/5 flex items-center justify-center shrink-0 ring-1 ring-plum/5 group-hover:ring-coral/15 transition-all duration-300">
			<svg class="w-3.5 h-3.5 text-plum-light/70 group-hover:text-coral-dark transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
		</div>
		<span>Favorite</span>
	{/if}
</button>
