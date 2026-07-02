
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

<!-- Compact Orbit Hub — mobile-first command center for account and language controls -->
<div class="relative -mx-4 min-h-[calc(100dvh-var(--bottom-nav-reserved-space))] overflow-hidden px-4 py-5 sm:py-8 md:min-h-[calc(100dvh-6rem)]">
	<div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh"></div>
	<div class="pointer-events-none absolute -right-20 top-8 -z-10 h-56 w-56 rounded-full bg-coral/16 blur-[5rem] sm:right-1/4"></div>
	<div class="pointer-events-none absolute -left-20 bottom-16 -z-10 h-56 w-56 rounded-full bg-lavender/18 blur-[5rem] sm:left-1/4"></div>
	<div class="pointer-events-none absolute left-1/2 top-10 -z-10 h-52 w-52 -translate-x-1/2 rounded-full border border-dashed border-lavender/30 opacity-70"></div>

	<div class="relative mx-auto flex max-w-2xl flex-col gap-4 sm:gap-5">
		<header class="relative overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/60 px-5 py-4 shadow-lg shadow-lavender/15 backdrop-blur-2xl sm:px-6 sm:py-5">
			<div class="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border border-coral/20"></div>
			<div class="pointer-events-none absolute -right-4 top-8 h-16 w-16 rounded-full border border-dashed border-lavender/35"></div>
			<div class="relative flex items-start gap-3">
				<div class="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-coral via-lavender to-mint shadow-lg shadow-coral/20" aria-hidden="true">
					<div class="absolute inset-[2px] rounded-[0.9rem] bg-white/88"></div>
					<span class="relative font-[family-name:var(--font-display)] text-lg font-black text-gradient">G</span>
					<span class="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-coral shadow-[0_0_10px_rgba(255,107,157,0.85)]"></span>
				</div>
				<div class="min-w-0 flex-1">
					<p class="mb-0.5 text-[10px] font-black uppercase tracking-[0.28em] text-coral-dark/70">GL-Orbit</p>
					<h1 class="font-[family-name:var(--font-display)] text-2xl font-black leading-tight text-plum sm:text-3xl">
						{m.menus_title()}
					</h1>
					<p class="mt-1 max-w-md text-sm font-medium leading-6 text-plum-light sm:text-base">
						{m.menus_subtitle()}
					</p>
				</div>
			</div>
		</header>

		<div class="grid gap-3 sm:gap-4">
			{#if currentUser}
				<a
					href={localizedHref('/profile', page.data.lang)}
					class="glass-card group relative flex items-center gap-4 overflow-hidden rounded-[1.6rem] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-18px_rgba(255,107,157,0.35)] touch-target sm:p-5"
				>
					<div class="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-coral/12 to-transparent opacity-80"></div>
					<div class="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-coral/20 to-lavender/25 ring-1 ring-white/70 sm:h-16 sm:w-16">
						{#if currentUser.avatarUrl}
							<img src={currentUser.avatarUrl} alt="" class="h-full w-full object-cover" loading="eager" decoding="async" />
						{:else}
							<span class="font-[family-name:var(--font-display)] text-xl font-black text-coral-dark sm:text-2xl">
								{(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
							</span>
						{/if}
					</div>
					<div class="relative min-w-0 flex-1">
						<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.menus_profile_title()}
						</h2>
						<p class="mt-0.5 line-clamp-2 text-sm leading-5 text-plum-light sm:line-clamp-1">
							{m.menus_profile_desc()}
						</p>
					</div>
					<div class="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-coral-dark shadow-sm transition-all duration-300 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-white">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</div>
				</a>
			{:else}
				<div class="grid grid-cols-2 gap-3">
					<a
						href={localizedHref('/login', page.data.lang)}
						class="glass-card group relative overflow-hidden rounded-[1.6rem] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(255,107,157,0.35)] touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral-dark transition-all duration-300 group-hover:bg-coral group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_login()}
						</h2>
						<p class="mt-1 line-clamp-2 text-xs leading-5 text-plum-light sm:text-sm">
							{m.menus_login_desc()}
						</p>
					</a>

					<a
						href={localizedHref('/register', page.data.lang)}
						class="glass-card group relative overflow-hidden rounded-[1.6rem] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(139,92,246,0.35)] touch-target sm:p-5"
					>
						<div class="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lavender/15 text-lavender-dark transition-all duration-300 group-hover:bg-lavender-dark group-hover:text-white">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M4.5 19.5a7.5 7.5 0 0115 0M12 11.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
							</svg>
						</div>
						<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum transition-colors group-hover:text-coral-dark sm:text-xl">
							{m.nav_register()}
						</h2>
						<p class="mt-1 line-clamp-2 text-xs leading-5 text-plum-light sm:text-sm">
							{m.menus_register_desc()}
						</p>
					</a>
				</div>
			{/if}

			<section class="glass-card relative overflow-hidden rounded-[1.6rem] p-4 sm:p-5" aria-labelledby="menus-language-heading">
				<div class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-mint/12 blur-2xl"></div>
				<div class="relative mb-3 flex items-center gap-3">
					<div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/15 text-mint-dark ring-1 ring-white/60" aria-hidden="true">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18Z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c2.15 2.26 3.25 5.25 3.25 9S14.15 18.74 12 21c-2.15-2.26-3.25-5.25-3.25-9S9.85 5.26 12 3Z" />
						</svg>
					</div>
					<div class="min-w-0">
						<h2 id="menus-language-heading" class="font-[family-name:var(--font-display)] text-lg font-bold text-plum sm:text-xl">
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
							class="relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300 touch-target sm:px-4 {active ? 'border-coral/35 bg-gradient-to-br from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'border-white/65 bg-white/60 text-plum hover:bg-white/85 hover:shadow-md'}"
						>
							{#if active}
								<span class="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full border border-white/25"></span>
								<span class="pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full bg-white/85"></span>
							{/if}
							<span class="block text-[10px] font-black tracking-[0.18em] opacity-70">{lang.toUpperCase()}</span>
							<span class="mt-0.5 block font-[family-name:var(--font-display)] text-base font-bold sm:text-lg">
								{lang === 'th' ? m.language_th() : m.language_en()}
							</span>
							{#if active}
								<span class="mt-0.5 block text-[10px] font-medium opacity-85">{m.menus_current_language()}</span>
							{/if}
						</button>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>
