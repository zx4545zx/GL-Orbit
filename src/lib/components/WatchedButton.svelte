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
	aria-label={isLoading ? 'กำลังโหลด' : watched ? 'เลิก mark ดูแล้ว' : 'mark ว่าดูแล้ว'}
	aria-pressed={isLoading ? undefined : watched}
	class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 touch-target active:scale-[0.97] {isLoading ? 'bg-white/60 border border-plum/5 text-plum-light/50 cursor-wait shadow-sm' : watched ? 'bg-gradient-to-br from-mint/[0.09] to-mint/[0.03] border border-mint/25 text-mint-dark shadow-sm shadow-mint/5' : 'bg-white border border-plum/10 text-plum-light shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-mint/20 hover:text-mint-dark hover:bg-gradient-to-br hover:from-mint/[0.04] hover:to-transparent'} {className}"
>
	{#if isLoading}
		<svg class="w-4 h-4 animate-spin text-plum-light/60" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
	{:else if watched}
		<div class="w-7 h-7 rounded-full bg-mint/10 flex items-center justify-center shrink-0 ring-1 ring-mint/20">
			<svg class="w-3.5 h-3.5 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<span class="font-semibold">ดูแล้ว</span>
	{:else}
		<div class="w-7 h-7 rounded-full bg-plum/5 flex items-center justify-center shrink-0 ring-1 ring-plum/5 group-hover:ring-mint/15 transition-all duration-300">
			<svg class="w-3.5 h-3.5 text-plum-light/70 group-hover:text-mint-dark transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<span>ดูแล้ว</span>
	{/if}
</button>
