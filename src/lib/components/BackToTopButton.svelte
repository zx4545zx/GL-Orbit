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
		class="group fixed right-4 sm:right-6 z-[55] floating-action-above-nav {bottomNavHidden ? 'nav-hidden' : ''} w-12 h-12 rounded-full bg-gradient-to-br from-coral to-coral-dark text-white shadow-xl shadow-coral/40 hover:shadow-2xl hover:shadow-coral/50 hover:scale-110 active:scale-95 transition-all duration-300 touch-target flex items-center justify-center"
		in:fly={{ y: 20, duration: 250 }}
		out:fly={{ y: 20, duration: 200 }}
	>
		<svg class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
		</svg>
	</button>
{/if}
