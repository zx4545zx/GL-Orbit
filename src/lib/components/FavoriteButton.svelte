<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	let {
		seriesId,
		className = '',
		variant = 'command'
	}: {
		seriesId: string;
		className?: string;
		variant?: 'command' | 'compact' | 'orbit';
	} = $props();

	let favorited = $state(false);
	let loading = $state(false);
	let checking = $state(true);
	let mounted = $state(false);

	const isLoading = $derived(checking || loading);
	const buttonClass = $derived(
		variant === 'orbit'
			? `group relative flex min-h-[5rem] w-full flex-col justify-between overflow-hidden rounded-md border p-3 text-left transition duration-200 touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:pointer-events-none ${
					isLoading
						? 'cursor-wait border-[#e8b8ca] bg-[#f8e8ef] text-plum-light/55'
						: favorited
							? 'border-[#e8b8ca] bg-[#f3d5e1] text-plum'
							: 'border-[#e8b8ca] bg-[#f8e8ef] text-plum hover:bg-[#f3d5e1]'
			  } ${className}`
			: `${
					variant === 'compact'
						? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-bold touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:pointer-events-none'
						: 'inline-flex min-h-[3.35rem] items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:pointer-events-none'
			  } ${isLoading ? 'cursor-wait text-plum-light/60' : favorited ? 'bg-coral/14 text-coral-dark hover:bg-coral/20' : 'text-plum-light hover:bg-coral/8 hover:text-coral-dark'} ${className}`
	);

	onMount(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	$effect(() => {
		if (!mounted) return;
		if (!seriesId) return;

		if (!page.data.user) {
			checking = false;
			return;
		}

		let cancelled = false;
		checking = true;

		fetch(`/api/favorites?seriesId=${encodeURIComponent(seriesId)}`)
			.then((r) => r.json())
			.then((data) => {
				if (cancelled) return;
				if (data.favorited !== undefined) {
					favorited = data.favorited;
				}
				checking = false;
			})
			.catch(() => {
				if (!cancelled) checking = false;
			});

		return () => {
			cancelled = true;
		};
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
	class={buttonClass}
>
	{#if variant === 'orbit'}
		<span aria-hidden="true" class="absolute right-3 top-3 font-[family-name:var(--font-display)] text-[9px] font-black tracking-[0.2em] opacity-45">01</span>
	{/if}

	<span class="grid shrink-0 place-items-center {variant === 'compact' ? 'h-5 w-5' : variant === 'orbit' ? `h-9 w-9 rounded-md ${favorited ? 'bg-[#c75580] text-white' : 'bg-white text-[#b54972]'}` : `h-9 w-9 rounded-2xl ${favorited ? 'bg-coral text-white' : 'bg-coral/12 text-coral-dark ring-1 ring-coral/25'}`} ">
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

	{#if variant === 'orbit'}
		<span class="mt-2 block break-words text-xs font-black leading-[1.25]">
			{isLoading ? m.favorite_loading_label() : favorited ? m.favorite_favorited_label() : m.favorite_unfavorited_label()}
		</span>
	{:else if variant === 'compact'}
		<span class="truncate">{isLoading ? m.favorite_loading_label() : favorited ? m.favorite_favorited_label() : m.favorite_unfavorited_label()}</span>
	{:else}
		<span class="min-w-0 leading-none">
			<span class="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">FAV</span>
			<span class="mt-1 block truncate text-xs font-bold sm:text-sm">{isLoading ? m.favorite_loading_label() : favorited ? m.favorite_favorited_label() : m.favorite_unfavorited_label()}</span>
		</span>
	{/if}
</button>
