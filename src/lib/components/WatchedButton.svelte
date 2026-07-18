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

	let watched = $state(false);
	let loading = $state(false);
	let checking = $state(true);
	let mounted = $state(false);

	const isLoading = $derived(checking || loading);
	const buttonClass = $derived(
		variant === 'orbit'
			? `group relative flex min-h-[5rem] w-full flex-col justify-between overflow-hidden rounded-md border p-3 text-left transition duration-200 touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:pointer-events-none ${
					isLoading
						? 'cursor-wait border-[#bfdce8] bg-[#e7f2f7] text-plum-light/55'
						: watched
							? 'border-[#bfdce8] bg-[#d9edf5] text-plum'
							: 'border-[#bfdce8] bg-[#e7f2f7] text-plum hover:bg-[#d9edf5]'
			  } ${className}`
			: `${
					variant === 'compact'
						? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-bold touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:pointer-events-none'
						: 'inline-flex min-h-[3.35rem] items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:pointer-events-none'
			  } ${isLoading ? 'cursor-wait text-plum-light/60' : watched ? 'bg-mint/16 text-mint-dark hover:bg-mint/22' : 'text-plum-light hover:bg-mint/8 hover:text-mint-dark'} ${className}`
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

		fetch(`/api/watched?seriesId=${encodeURIComponent(seriesId)}`)
			.then((r) => r.json())
			.then((data) => {
				if (cancelled) return;
				if (data.watched !== undefined) {
					watched = data.watched;
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
	class={buttonClass}
>
	{#if variant === 'orbit'}
		<span aria-hidden="true" class="absolute right-3 top-3 font-[family-name:var(--font-display)] text-[9px] font-black tracking-[0.2em] opacity-45">02</span>
	{/if}

	<span class="grid shrink-0 place-items-center {variant === 'compact' ? 'h-5 w-5' : variant === 'orbit' ? `h-9 w-9 rounded-md ${watched ? 'bg-[#78b2cc] text-white' : 'bg-white text-[#4d91b0]'}` : `h-9 w-9 rounded-2xl ${watched ? 'bg-mint text-white' : 'bg-mint/16 text-mint-dark ring-1 ring-mint/30'}`} ">
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

	{#if variant === 'orbit'}
		<span class="mt-2 block break-words text-xs font-black leading-[1.25]">
			{isLoading ? m.watched_loading_label() : watched ? m.watched_watched_label() : m.watched_unwatched_label()}
		</span>
	{:else if variant === 'compact'}
		<span class="truncate">{isLoading ? m.watched_loading_label() : watched ? m.watched_watched_label() : m.watched_unwatched_label()}</span>
	{:else}
		<span class="min-w-0 leading-none">
			<span class="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">WATCH</span>
			<span class="mt-1 block truncate text-xs font-bold sm:text-sm">{isLoading ? m.watched_loading_label() : watched ? m.watched_watched_label() : m.watched_unwatched_label()}</span>
		</span>
	{/if}
</button>
