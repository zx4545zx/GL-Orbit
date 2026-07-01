
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { availableLanguageTags, type AvailableLanguageTag, m } from '$lib/i18n/paraglide.js';
	import { localizedHref, switchLanguageHref } from '$lib/i18n/link.js';

	const currentUser = $derived(page.data.user);
	const currentLang = $derived(
		availableLanguageTags.find(
			(tag) => page.url.pathname === `/${tag}` || page.url.pathname.startsWith(`/${tag}/`)
		) ?? page.data.lang ?? 'th'
	);

	async function switchLanguage(lang: AvailableLanguageTag) {
		const newPath = switchLanguageHref(page.url.pathname, lang) + page.url.search + page.url.hash;
		const currentPath = page.url.pathname + page.url.search + page.url.hash;
		if (newPath === currentPath) return;

		if (currentUser) {
			await fetch('/api/user/language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: lang })
			});
		}

		await goto(newPath);
	}
</script>

<svelte:head>
	<title>{m.menus_seo_title()}</title>
	<meta name="description" content={m.menus_seo_description()} />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="relative mx-auto max-w-2xl overflow-x-clip px-4 py-6 sm:py-10">
	<!-- Soft decorative glows — fully contained inside the page column -->
	<div class="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-coral/8 to-transparent sm:w-56"></div>
	<div class="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-lavender/10 to-transparent sm:w-56"></div>
	<div class="pointer-events-none absolute right-4 top-0 h-40 w-40 rounded-full bg-coral/12 blur-[4rem] sm:right-8 sm:h-48 sm:w-48"></div>
	<div class="pointer-events-none absolute bottom-12 left-4 h-40 w-40 rounded-full bg-lavender/15 blur-[4rem] sm:left-8 sm:h-48 sm:w-48"></div>

	<!-- Header -->
	<header class="relative mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum leading-tight sm:text-3xl">
			{m.menus_title()}
		</h1>
		<p class="mt-1 max-w-md text-sm font-medium text-plum-light sm:text-base">
			{m.menus_subtitle()}
		</p>
	</header>

	<!-- Cards -->
	<div class="relative space-y-3 sm:space-y-4">
		{#if currentUser}
			<a
				href={localizedHref('/profile', page.data.lang)}
				class="glass-card group flex items-center gap-4 rounded-[1.75rem] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(196,181,253,0.2)] touch-target"
			>
				<div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-coral/20 to-lavender/25">
					{#if currentUser.avatarUrl}
						<img src={currentUser.avatarUrl} alt="" class="h-full w-full object-cover" loading="eager" decoding="async" />
					{:else}
						<span class="font-[family-name:var(--font-display)] text-xl font-black text-coral-dark">
							{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
						</span>
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
						{m.menus_profile_title()}
					</h2>
					<p class="mt-0.5 line-clamp-1 text-sm text-plum-light">
						{m.menus_profile_desc()}
					</p>
				</div>
				<div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender/15 text-coral-dark transition-all duration-300 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-white">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				<a
					href={localizedHref('/login', page.data.lang)}
					class="glass-card group flex flex-col items-center gap-3 rounded-[1.75rem] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(196,181,253,0.2)] touch-target"
				>
					<div class="grid h-12 w-12 place-items-center rounded-2xl bg-coral/10 text-coral-dark transition-all duration-300 group-hover:bg-coral group-hover:text-white">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
						</svg>
					</div>
					<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
						{m.nav_login()}
					</h2>
					<p class="text-xs text-plum-light sm:text-sm">{m.menus_login_desc()}</p>
				</a>

				<a
					href={localizedHref('/register', page.data.lang)}
					class="glass-card group flex flex-col items-center gap-3 rounded-[1.75rem] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(196,181,253,0.2)] touch-target"
				>
					<div class="grid h-12 w-12 place-items-center rounded-2xl bg-lavender/15 text-lavender-dark transition-all duration-300 group-hover:bg-lavender-dark group-hover:text-white">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M4.5 19.5a7.5 7.5 0 0115 0M12 11.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
						</svg>
					</div>
					<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
						{m.nav_register()}
					</h2>
					<p class="text-xs text-plum-light sm:text-sm">{m.menus_register_desc()}</p>
				</a>
			</div>
		{/if}

		<!-- Language module -->
		<div class="glass-card rounded-[1.75rem] p-4 sm:p-5">
			<div class="mb-4 flex items-center gap-3">
				<div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/15 text-mint-dark">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c2.15 2.26 3.25 5.25 3.25 9S14.15 18.74 12 21c-2.15-2.26-3.25-5.25-3.25-9S9.85 5.26 12 3Z" />
					</svg>
				</div>
				<div>
					<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum sm:text-xl">
						{m.menus_language_title()}
					</h2>
					<p class="text-sm text-plum-light">{m.menus_language_desc()}</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				{#each availableLanguageTags as lang (lang)}
					{@const active = currentLang === lang}
					<button
						type="button"
						onclick={() => switchLanguage(lang)}
						aria-pressed={active}
						class="relative rounded-2xl border px-4 py-3 text-left transition-all duration-300 touch-target sm:px-5 sm:py-4 {active ? 'border-coral/30 bg-gradient-to-br from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'border-white/60 bg-white/60 text-plum hover:bg-white/85 hover:shadow-md'}"
					>
						{#if active}
							<span class="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-white/80 sm:right-3 sm:top-3"></span>
						{/if}
						<span class="block text-xs font-black tracking-[0.18em] opacity-70">{lang.toUpperCase()}</span>
						<span class="mt-1 block font-[family-name:var(--font-display)] text-lg font-bold sm:text-xl">
							{lang === 'th' ? m.language_th() : m.language_en()}
						</span>
						{#if active}
							<span class="mt-1 block text-[10px] font-medium opacity-80 sm:text-[11px]">{m.menus_current_language()}</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
