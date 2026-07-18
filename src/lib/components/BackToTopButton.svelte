<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { fly } from 'svelte/transition';

	let { bottomNavHidden = false }: { bottomNavHidden?: boolean } = $props();

	let visible = $state(false);

	$effect(() => {
		function onScroll() {
			visible = window.scrollY > 300;
		}
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function scrollTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if visible}
	<button
		onclick={scrollTop}
		aria-label={m.back_to_top_aria()}
		class="group fixed right-4 sm:right-6 z-[55] floating-action-above-nav {bottomNavHidden ? 'nav-hidden' : ''} flex h-12 w-12 items-center justify-center rounded-full border border-[var(--orbit-line)] bg-white text-plum hover:border-coral/40 hover:text-coral-dark active:scale-95 transition-colors touch-target"
		in:fly={{ y: 20, duration: 250 }}
		out:fly={{ y: 20, duration: 200 }}
	>
		<svg class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
		</svg>
	</button>
{/if}
