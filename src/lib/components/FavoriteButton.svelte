<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

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
	aria-label={isLoading ? m.favorite_loading_aria() : favorited ? m.favorite_unmark_aria() : m.favorite_mark_aria()}
	aria-pressed={isLoading ? undefined : favorited}
	class="group relative isolate inline-flex min-h-[3.35rem] items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left text-sm transition-all duration-300 touch-target active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:pointer-events-none {isLoading ? 'border border-plum/5 bg-white/35 text-plum-light/45 shadow-inner cursor-wait' : favorited ? 'border border-coral/30 bg-coral/10 text-coral-dark shadow-lg shadow-coral/15 hover:-translate-y-0.5' : 'border border-white/70 bg-white/60 text-plum hover:-translate-y-0.5 hover:-rotate-[0.35deg] hover:border-coral/25 hover:bg-coral/5 hover:shadow-lg hover:shadow-coral/10'} {className}"
>
	<span class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(255,107,157,0.22),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,255,255,0.25))] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>

	<span class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl transition-all duration-300 {favorited ? 'bg-coral text-white shadow-md shadow-coral/25 rotate-[-6deg]' : 'bg-plum/5 text-plum-light ring-1 ring-plum/5 group-hover:bg-coral group-hover:text-white group-hover:rotate-[-6deg]'}">
		{#if isLoading}
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		{:else}
			<svg class="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width={favorited ? '0' : '1.9'} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		{/if}
	</span>

	<span class="min-w-0 leading-none">
		<span class="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-55">FAV</span>
		<span class="mt-1 block truncate text-xs font-bold sm:text-sm">{isLoading ? m.favorite_loading_label() : favorited ? m.favorite_favorited_label() : m.favorite_unfavorited_label()}</span>
	</span>
</button>
