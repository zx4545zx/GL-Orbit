<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';
	const currentUser = $derived(page.data.user);
</script>

<footer class="relative mt-12 bg-plum text-white sm:mt-20">
	<div class="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12 md:grid-cols-3">
			<!-- Brand -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-md bg-coral">
						<span class="text-sm font-bold text-white">G</span>
					</div>
					<span class="font-[family-name:var(--font-display)] text-lg font-bold text-white">GL-Orbit</span>
				</div>
				<p class="max-w-xs text-sm leading-relaxed text-white/75">
					{m.footer_tagline()}
				</p>
				<div class="flex gap-3">
					{#each ['twitter', 'instagram', 'github'] as social}
						<span class="flex h-10 w-10 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/10 hover:text-white touch-target sm:h-9 sm:w-9">
							<svg class="h-5 w-5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
								{#if social === 'twitter'}
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
								{:else if social === 'instagram'}
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
								{:else}
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
								{/if}
							</svg>
						</span>
					{/each}
				</div>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="mb-4 font-[family-name:var(--font-display)] font-semibold text-white">{m.footer_quick_links()}</h3>
				<ul class="space-y-3">
					<li><a href="/{page.data.lang}/" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.nav_home()}</a></li>
					<li><a href="/{page.data.lang}/calendar" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.nav_calendar()}</a></li>
					<li><a href="/{page.data.lang}/series" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.footer_all_series()}</a></li>
					{#if currentUser}
						<li><a href="/{page.data.lang}/profile" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.nav_profile()}</a></li>
					{:else}
						<li><a href="/{page.data.lang}/login" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.nav_login()}</a></li>
						<li><a href="/{page.data.lang}/register" class="text-sm text-white/75 hover:text-coral-light transition-colors touch-target inline-flex items-center">{m.nav_register()}</a></li>
					{/if}
				</ul>
			</div>

			<!-- About -->
			<div>
				<h3 class="mb-4 font-[family-name:var(--font-display)] font-semibold text-white">{m.footer_about()}</h3>
				<ul class="space-y-3">
					<li><span class="text-sm text-white/75">{m.footer_about_1()}</span></li>
					<li><span class="text-sm text-white/75">{m.footer_about_2()}</span></li>
					<li><span class="text-sm text-white/75">{m.footer_about_3()}</span></li>
				</ul>
			</div>
		</div>

		<div class="mt-8 px-4 py-3 text-center sm:mt-10">
			<p class="text-xs text-white/60">
				{m.footer_copyright({ year: new Date().getFullYear() })} {m.footer_made_with()}
			</p>
		</div>
	</div>
</footer>
