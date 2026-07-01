<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

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
		watched = !watched;

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
	aria-label={isLoading ? m.watched_loading_aria() : watched ? m.watched_unmark_aria() : m.watched_mark_aria()}
	aria-pressed={isLoading ? undefined : watched}
	class="group relative isolate inline-flex min-h-[3.35rem] items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left text-sm transition-all duration-300 touch-target active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:pointer-events-none {isLoading ? 'border border-plum/5 bg-white/35 text-plum-light/45 shadow-inner cursor-wait' : watched ? 'border border-mint/35 bg-mint/10 text-mint-dark shadow-lg shadow-mint/15 hover:-translate-y-0.5' : 'border border-white/70 bg-white/60 text-plum hover:-translate-y-0.5 hover:rotate-[0.35deg] hover:border-mint/30 hover:bg-mint/5 hover:shadow-lg hover:shadow-mint/10'} {className}"
>
	<span class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_0%,rgba(110,231,183,0.22),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,255,255,0.25))] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>

	<span class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl transition-all duration-300 {watched ? 'bg-mint text-white shadow-md shadow-mint/25 rotate-[6deg]' : 'bg-plum/5 text-plum-light ring-1 ring-plum/5 group-hover:bg-mint group-hover:text-white group-hover:rotate-[6deg]'}">
		{#if isLoading}
			<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		{:else}
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width={watched ? '3' : '1.9'} d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</span>

	<span class="min-w-0 leading-none">
		<span class="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-55">WATCH</span>
		<span class="mt-1 block truncate text-xs font-bold sm:text-sm">{isLoading ? m.watched_loading_label() : watched ? m.watched_watched_label() : m.watched_unwatched_label()}</span>
	</span>
</button>
