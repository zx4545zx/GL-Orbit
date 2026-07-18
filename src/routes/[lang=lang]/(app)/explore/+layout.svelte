<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';
	let { children } = $props();

	const langPrefix = $derived(`/${page.data.lang}`);
	const tabs = $derived([
		{ id: 'series', href: `${langPrefix}/explore/series`, label: m.nav_series(), icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4' },
		{ id: 'ships', href: `${langPrefix}/explore/ships`, label: m.nav_ships(), icon: 'M12 21s-6.716-4.35-9.193-7.06C.429 11.337.52 7.54 3.05 5.24 5.264 3.228 8.59 3.62 12 7.09c3.41-3.47 6.736-3.862 8.95-1.85 2.53 2.3 2.621 6.097.243 8.7C18.716 16.65 12 21 12 21z' },
		{ id: 'artists', href: `${langPrefix}/explore/artists`, label: m.nav_artists(), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
	]);

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<div class="py-6 sm:py-8 max-w-6xl mx-auto">
	<!-- Header + inline tab switcher -->
	<div class="flex flex-col items-center gap-4 mb-6 sm:mb-8">
		<div class="text-center">
			<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-1.5 sm:mb-2">
				<span class="text-gradient">{m.nav_explore()}</span>
			</h1>
			<p class="text-sm sm:text-base text-plum-light">{m.explore_subtitle()}</p>
		</div>

		<!-- Static tab switcher (in-flow, not floating) -->
		<nav>
			<div class="inline-flex glass-card-strong rounded-2xl p-0 gap-0">
				{#each tabs as tab (tab.id)}
					{@const active = isActive(tab.href)}
					<a
						href={tab.href}
						data-sveltekit-preload-data="hover"
						aria-current={active ? 'page' : undefined}
				class="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 touch-target whitespace-nowrap {active ? 'orbit-action' : 'text-plum-light hover:bg-lavender/20 hover:text-plum'}"
					>
						<svg class="hidden sm:block w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={tab.icon} /></svg>
						<span>{tab.label}</span>
					</a>
				{/each}
			</div>
		</nav>
	</div>

	{@render children()}
</div>
