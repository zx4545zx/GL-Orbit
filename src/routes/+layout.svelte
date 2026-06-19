<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/state';

	let { children } = $props();

	const routeChanging = $derived(
		Boolean(navigating.to && (!navigating.from || navigating.to.url.pathname !== navigating.from.url.pathname))
	);
	let showRouteOverlay = $state(false);

	$effect(() => {
		if (!routeChanging) {
			showRouteOverlay = false;
			return;
		}

		const timer = setTimeout(() => {
			showRouteOverlay = true;
		}, 180);

		return () => {
			clearTimeout(timer);
			showRouteOverlay = false;
		};
	});
</script>

{#if routeChanging}
	<div class="fixed top-0 left-0 right-0 z-[60]">
		<div class="h-1 w-full bg-coral/10 overflow-hidden">
			<div class="h-full w-1/3 bg-gradient-to-r from-coral via-coral-dark to-coral animate-[loading-slide_1s_ease-in-out_infinite]"></div>
		</div>
	</div>
{/if}

{#if showRouteOverlay}
	<div
		class="fixed inset-0 z-[70] flex items-center justify-center bg-cream/75 backdrop-blur-md"
		aria-live="polite"
		aria-busy="true"
		role="status"
	>
		<div class="glass-card-strong mx-4 w-full max-w-xs rounded-3xl px-6 py-7 text-center shadow-2xl shadow-lavender/20">
			<div class="relative mx-auto mb-4 h-14 w-14">
				<div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-coral to-lavender opacity-90 animate-pulse-glow"></div>
				<div class="absolute inset-2 rounded-xl bg-white flex items-center justify-center">
					<div class="h-6 w-6 rounded-full border-2 border-coral/20 border-t-coral animate-spin"></div>
				</div>
			</div>
			<p class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">กำลังเปลี่ยนหน้า</p>
			<p class="mt-1 text-sm text-plum-light">กำลังโหลดข้อมูล รอสักครู่นะคะ</p>
		</div>
	</div>
{/if}

<div data-sveltekit-preload-data="hover" data-sveltekit-preload-code="viewport">
	{@render children()}
</div>
