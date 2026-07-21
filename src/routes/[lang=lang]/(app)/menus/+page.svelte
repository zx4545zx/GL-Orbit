<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { availableLanguageTags, type AvailableLanguageTag, m } from '$lib/i18n/paraglide.js';
	import { localizedHref, switchLanguageHref } from '$lib/i18n/link.js';
	import Picture from '$lib/components/Picture.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { themeState } from '$lib/theme.svelte.js';

	const currentUser = $derived(page.data.user);
	const currentLang = $derived(
		availableLanguageTags.find(
			(tag) => page.url.pathname === `/${tag}` || page.url.pathname.startsWith(`/${tag}/`)
		) ?? page.data.lang ?? 'th'
	);
	let isLoggingOut = $state(false);

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

	async function handleLogout(e: Event) {
		e.preventDefault();
		if (isLoggingOut) return;
		isLoggingOut = true;
		try {
			await fetch(localizedHref('/logout', page.data.lang), { method: 'POST' });
			await goto(localizedHref('/', page.data.lang), { invalidateAll: true });
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>{m.menus_seo_title()}</title>
	<meta name="description" content={m.menus_seo_description()} />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<!-- Pocket Orbit Console — compact mobile command hub -->
<div class="-mx-4 min-h-[calc(100dvh-var(--bottom-nav-reserved-space))] px-4 pb-6 pt-4 sm:py-8 md:min-h-[calc(100dvh-6rem)]">
	<div class="mx-auto flex max-w-2xl flex-col gap-3.5 sm:gap-5">
		<div class="grid gap-3 sm:gap-4">
			{#if currentUser}
				<a
					href={localizedHref('/profile', page.data.lang)}
					class="group orbit-surface flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 touch-target sm:p-5"
				>
					<div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-coral/10 sm:h-16 sm:w-16">
						{#if currentUser.avatarUrl}
							<Picture src={currentUser.avatarUrl} type="profiles" sizes="96px" alt="" loading="eager" class="h-full w-full object-cover" />
						{:else}
							<div class="grid h-full w-full place-items-center">
								<span class="font-[family-name:var(--font-display)] text-2xl font-black text-coral-dark">
									{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
					</div>
					<div class="relative min-w-0 flex-1">
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.menus_profile_title()}
						</h2>
						<p class="mt-1 line-clamp-1 text-sm leading-5 text-plum-light">
							{m.menus_profile_desc()}
						</p>
					</div>
					<div class="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-coral-dark transition-all duration-200 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-white">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</a>

				<a
					href={localizedHref('/subscriptions', page.data.lang)}
					class="group orbit-surface flex min-h-14 items-center gap-4 border border-[var(--orbit-line)] p-4 transition-colors hover:bg-cream touch-target sm:p-5"
				>
					<div class="grid h-14 w-14 shrink-0 place-items-center bg-mint/20 text-plum">
						<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h10M7 4v6m10-6v6" />
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum">{m.subscriptions_nav()}</h2>
						<p class="mt-1 text-sm text-plum-light">{m.subscriptions_subtitle()}</p>
					</div>
					<span aria-hidden="true" class="text-xl text-coral-dark">→</span>
				</a>
			{:else}
				<div class="grid grid-cols-2 gap-3">
					<a
						href={localizedHref('/login', page.data.lang)}
						class="group orbit-surface rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral-dark transition-all duration-300 group-hover:bg-coral group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_login()}
						</h2>
						<p class="mt-1 line-clamp-2 text-xs leading-5 text-plum-light sm:text-sm">
							{m.menus_login_desc()}
						</p>
					</a>

					<a
						href={localizedHref('/register', page.data.lang)}
						class="group orbit-surface rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lavender/15 text-lavender-dark transition-all duration-300 group-hover:bg-lavender-dark group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M4.5 19.5a7.5 7.5 0 0 1 15 0M12 11.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_register()}
						</h2>
						<p class="mt-1 line-clamp-2 text-xs leading-5 text-plum-light sm:text-sm">
							{m.menus_register_desc()}
						</p>
					</a>
				</div>
			{/if}

			{#if currentUser?.role === 'ADMIN'}
			<a
				href={localizedHref('/halo', page.data.lang)}
				class="group orbit-surface flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 touch-target sm:p-5"
			>
				<div class="relative grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-yellow-100 sm:h-16 sm:w-16">
					<svg class="h-7 w-7 text-yellow-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.75 14.37 8.55l5.3.77-3.84 3.74.9 5.28L12 15.85l-4.74 2.49.9-5.28-3.84-3.74 5.3-.77L12 3.75Z" /></svg>
				</div>
				<div class="relative min-w-0 flex-1">
					<h2 class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum transition-colors group-hover:text-yellow-600 sm:text-xl">
						{m.nav_halo()}
					</h2>
					<p class="mt-1 line-clamp-1 text-sm leading-5 text-plum-light">
						{m.halo_tagline()}
					</p>
				</div>
				<div class="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-yellow-600 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-yellow-500 group-hover:text-white">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{/if}

			{#if currentUser}
				<div class="contents">
					{#if currentUser.role === 'ADMIN'}
						<a
							href={localizedHref('/admin/series', page.data.lang)}
							class="order-6 group orbit-surface flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 touch-target sm:p-5"
						>
							<div class="grid h-14 w-14 shrink-0 place-items-center bg-coral/10 text-coral-dark sm:h-16 sm:w-16">
								<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" /></svg>
							</div>
							<div class="min-w-0 flex-1"><h2 class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum transition-colors group-hover:text-coral-dark sm:text-xl">{m.nav_admin()}</h2></div>
							<div class="grid h-10 w-10 shrink-0 place-items-center bg-white text-coral-dark transition-all duration-200 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-white"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></div>
						</a>
					{/if}
					<button
						type="button"
						onclick={handleLogout}
						disabled={isLoggingOut}
						class="order-7 orbit-control group flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-black text-coral-dark transition-colors hover:bg-coral/10 disabled:opacity-60 touch-target"
					>
						{#if isLoggingOut}
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
							{m.profile_logout_loading()}
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
							</svg>
							{m.profile_logout()}
						{/if}
					</button>
				</div>
			{/if}

			<section class="order-5 orbit-surface p-4 sm:p-5" aria-labelledby="menus-language-heading">
				<div class="mb-3 flex items-center gap-3">
					<div class="grid h-11 w-11 shrink-0 place-items-center rounded-[1.05rem] bg-mint/15 text-mint-dark ring-1 ring-white/70" aria-hidden="true">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c2.15 2.26 3.25 5.25 3.25 9S14.15 18.74 12 21c-2.15-2.26-3.25-5.25-3.25-9S9.85 5.26 12 3Z" />
						</svg>
					</div>
					<div class="min-w-0">
						<h2 id="menus-language-heading" class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum sm:text-xl">
							{m.menus_language_title()}
						</h2>
						<p class="text-sm leading-5 text-plum-light">{m.menus_language_desc()}</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2.5 sm:gap-3">
					{#each availableLanguageTags as lang (lang)}
						{@const active = currentLang === lang}
						<button
							type="button"
							onclick={() => switchLanguage(lang)}
							aria-pressed={active}
							class="relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-200 touch-target sm:px-4 {active ? 'border-coral bg-coral text-white' : 'border-lavender/30 bg-white text-plum hover:bg-lavender/10'}"
						>
							<span class="block text-[10px] font-black tracking-[0.18em] opacity-70">{lang.toUpperCase()}</span>
							<span class="mt-0.5 block font-[family-name:var(--font-display)] text-base font-black sm:text-lg">
								{lang === 'th' ? m.language_th() : m.language_en()}
							</span>
							{#if active}
								<span class="mt-0.5 block text-[10px] font-semibold opacity-85">{m.menus_current_language()}</span>
							{/if}
						</button>
					{/each}
				</div>
			</section>

			<section class="order-4 orbit-surface p-4 sm:p-5" aria-labelledby="menus-theme-heading">
				<div class="flex items-center gap-3">
					<div class="grid h-11 w-11 shrink-0 place-items-center rounded-[1.05rem] bg-lavender/15 text-lavender-dark" aria-hidden="true">
						{#if themeState.theme === 'dark'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
							</svg>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<h2 id="menus-theme-heading" class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum sm:text-xl">
							{m.menus_theme_title()}
						</h2>
						<p class="text-sm leading-5 text-plum-light">{themeState.theme === 'dark' ? m.menus_theme_dark() : m.menus_theme_light()}</p>
					</div>
					<ThemeToggle />
				</div>
			</section>
		</div>
	</div>
</div>
