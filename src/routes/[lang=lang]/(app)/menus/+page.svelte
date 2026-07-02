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
<div class="relative -mx-4 min-h-[calc(100dvh-var(--bottom-nav-reserved-space))] overflow-hidden px-4 pb-6 pt-4 sm:py-8 md:min-h-[calc(100dvh-6rem)]">
	<div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh"></div>
	<div class="pointer-events-none absolute -right-24 top-3 -z-10 h-64 w-64 rounded-full bg-coral/18 blur-[5rem]"></div>
	<div class="pointer-events-none absolute -left-28 top-64 -z-10 h-72 w-72 rounded-full bg-lavender/20 blur-[5rem]"></div>
	<div class="pointer-events-none absolute bottom-10 right-8 -z-10 h-56 w-56 rounded-full bg-mint/14 blur-[5rem]"></div>

	<div class="relative mx-auto flex max-w-2xl flex-col gap-3.5 sm:gap-5">
		<header class="glass-card-strong relative overflow-hidden rounded-[1.8rem] p-4 shadow-xl shadow-lavender/20 sm:p-5">
			<div class="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full border border-coral/25"></div>
			<div class="pointer-events-none absolute right-0 top-8 h-20 w-20 rounded-full border border-dashed border-lavender/40"></div>
			<div class="relative flex items-center gap-3.5">
				<div class="h-14 w-14 shrink-0 overflow-hidden rounded-[1.25rem] shadow-lg shadow-lavender/25">
					<img src="/icons/gl-orbit-logo.svg" alt="GL-Orbit" class="h-full w-full" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[10px] font-black uppercase tracking-[0.34em] text-coral-dark/70">GL-Orbit</p>
					<h1 class="font-[family-name:var(--font-display)] text-2xl font-black leading-tight text-plum sm:text-3xl">
						{m.menus_title()}
					</h1>
				</div>
			</div>
		</header>

		<div class="grid gap-3 sm:gap-4">
			{#if currentUser}
				<a
					href={localizedHref('/profile', page.data.lang)}
					class="group relative flex items-center gap-4 overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/76 p-4 shadow-lg shadow-lavender/16 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgba(255,107,157,0.45)] touch-target sm:p-5"
				>
					<div class="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-coral/16 to-transparent"></div>
					<div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-coral/20 to-lavender/25 ring-2 ring-white/80 sm:h-16 sm:w-16">
						{#if currentUser.avatarUrl}
							<img src={currentUser.avatarUrl} alt="" class="h-full w-full object-cover" loading="eager" decoding="async" />
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
					</div>
					<div class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-coral-dark shadow-md shadow-lavender/15 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-white">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</a>
			{:else}
				<div class="grid grid-cols-2 gap-3">
					<a
						href={localizedHref('/login', page.data.lang)}
						class="group relative overflow-hidden rounded-[1.6rem] border border-white/65 bg-white/76 p-4 text-left shadow-lg shadow-lavender/16 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(255,107,157,0.35)] touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral-dark transition-all duration-300 group-hover:bg-coral group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_login()}
						</h2>
					</a>

					<a
						href={localizedHref('/register', page.data.lang)}
						class="group relative overflow-hidden rounded-[1.6rem] border border-white/65 bg-white/76 p-4 text-left shadow-lg shadow-lavender/16 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(139,92,246,0.35)] touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lavender/15 text-lavender-dark transition-all duration-300 group-hover:bg-lavender-dark group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M4.5 19.5a7.5 7.5 0 0 1 15 0M12 11.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-black text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_register()}
						</h2>
					</a>
				</div>
			{/if}

			<a
				href={localizedHref('/chat', page.data.lang)}
				class="group relative flex items-center gap-4 overflow-hidden rounded-[1.65rem] border border-white/65 bg-white/76 p-4 shadow-lg shadow-lavender/16 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-18px_rgba(139,92,246,0.42)] touch-target sm:p-5"
			>
				<div class="pointer-events-none absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-lavender/18 via-coral/8 to-transparent"></div>
				<div class="relative grid h-12 w-12 shrink-0 place-items-center rounded-[1.15rem] bg-gradient-to-br from-lavender/20 to-coral/14 text-lavender-dark ring-1 ring-white/75 transition-all duration-300 group-hover:bg-lavender-dark group-hover:text-white sm:h-14 sm:w-14" aria-hidden="true">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 12c0 4.142-4.03 7.5-9 7.5a10.55 10.55 0 0 1-3.72-.66L3 20.25l1.46-3.98A6.82 6.82 0 0 1 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5Z" />
					</svg>
					<span class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-mint shadow-[0_0_10px_rgba(110,231,183,0.75)]"></span>
				</div>
				<div class="relative min-w-0 flex-1">
					<h2 class="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
						{m.nav_chat()}
					</h2>
				</div>
				<div class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lavender-dark shadow-md shadow-lavender/15 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-lavender-dark group-hover:text-white">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>

			{#if currentUser}
				<div class="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
					{#if currentUser.role === 'ADMIN'}
						<a
							href={localizedHref('/admin/series', page.data.lang)}
							class="group flex items-center justify-center gap-2 rounded-[1.35rem] bg-gradient-to-r from-coral to-coral-dark px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-coral/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-coral/35 touch-target"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" />
							</svg>
							{m.nav_admin()}
						</a>
					{/if}
					<button
						type="button"
						onclick={handleLogout}
						disabled={isLoggingOut}
						class="group flex items-center justify-center gap-2 rounded-[1.35rem] border border-coral/35 bg-white/78 px-4 py-3.5 text-sm font-black text-coral-dark shadow-md shadow-lavender/12 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-coral/50 hover:bg-coral/10 disabled:opacity-60 touch-target {currentUser.role === 'ADMIN' ? '' : 'sm:col-span-2'}"
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

			<section class="relative overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/72 p-4 shadow-lg shadow-lavender/16 backdrop-blur-2xl sm:p-5" aria-labelledby="menus-language-heading">
				<div class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-mint/16 blur-2xl"></div>
				<div class="relative mb-3 flex items-center gap-3">
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
							class="relative overflow-hidden rounded-[1.2rem] border px-3 py-3 text-left transition-all duration-300 touch-target sm:px-4 {active ? 'border-coral/30 bg-gradient-to-br from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'border-white/70 bg-white/68 text-plum shadow-sm shadow-lavender/10 hover:bg-white/90 hover:shadow-md'}"
						>
							{#if active}
								<span class="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full border border-white/25"></span>
								<span class="pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full bg-white/85"></span>
							{/if}
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
		</div>
	</div>
</div>
