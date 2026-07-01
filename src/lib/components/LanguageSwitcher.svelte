<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { availableLanguageTags, type AvailableLanguageTag, m } from '$lib/i18n/paraglide.js';
	import { switchLanguageHref } from '$lib/i18n/link.js';

	let {
		className = '',
		variant = 'segmented'
	}: {
		className?: string;
		variant?: 'segmented' | 'icon';
	} = $props();

	const currentLang = $derived(
		availableLanguageTags.find(
			(tag) => page.url.pathname === `/${tag}` || page.url.pathname.startsWith(`/${tag}/`)
		) ?? page.data.lang ?? 'th'
	);
	const nextLang = $derived<AvailableLanguageTag>(currentLang === 'th' ? 'en' : 'th');

	async function switchLanguage(lang: AvailableLanguageTag) {
		const newPath = switchLanguageHref(page.url.pathname, lang) + page.url.search + page.url.hash;
		const currentPath = page.url.pathname + page.url.search + page.url.hash;

		if (newPath === currentPath) return;

		// Persist preference if logged in
		if (page.data.user) {
			await fetch('/api/user/language', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ language: lang })
			});
		}

		await goto(newPath);
	}
</script>

{#if variant === 'icon'}
	<button
		type="button"
		onclick={() => switchLanguage(nextLang)}
		class="group inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-lavender/20 bg-white/65 px-2.5 text-plum-light shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-coral/25 hover:bg-white/85 hover:text-coral-dark hover:shadow-lg hover:shadow-coral/10 touch-target {className}"
		aria-label={`Switch to ${nextLang === 'th' ? m.language_th() : m.language_en()}`}
		title={nextLang === 'th' ? m.language_th() : m.language_en()}
	>
		<svg class="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18Z" />
			<path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c2.15 2.26 3.25 5.25 3.25 9S14.15 18.74 12 21c-2.15-2.26-3.25-5.25-3.25-9S9.85 5.26 12 3Z" />
		</svg>
		<span class="rounded-md bg-coral/10 px-1.5 py-0.5 text-[10px] font-black tracking-[0.14em] text-coral-dark">{currentLang.toUpperCase()}</span>
	</button>
{:else}
	<div class="inline-flex max-w-full {className}">
		<div
			class="relative isolate inline-grid w-fit max-w-full grid-cols-2 items-center overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,245,247,0.48))] p-0.5 shadow-[0_8px_24px_rgba(196,181,253,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl sm:p-1 sm:shadow-[0_10px_30px_rgba(196,181,253,0.22),inset_0_1px_0_rgba(255,255,255,0.85)]"
			aria-label="Language switcher"
		>
			<span class="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_18%_12%,rgba(255,107,157,0.18),transparent_36%),radial-gradient(circle_at_88%_82%,rgba(110,231,183,0.18),transparent_38%)]"></span>
			<span
				class="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-0.125rem)] rounded-full bg-gradient-to-br from-coral via-coral-dark to-lavender shadow-[0_7px_16px_rgba(255,107,157,0.32)] transition-transform duration-300 ease-out sm:bottom-1 sm:left-1 sm:top-1 sm:w-[calc(50%-0.25rem)] sm:shadow-[0_8px_18px_rgba(255,107,157,0.34)] {currentLang === 'en' ? 'translate-x-[calc(100%+0.25rem)] sm:translate-x-[calc(100%+0.5rem)]' : 'translate-x-0'}"
			></span>
			<span class="pointer-events-none absolute left-1/2 top-1/2 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 opacity-45 sm:block"></span>

			{#each availableLanguageTags as lang (lang)}
				{@const active = currentLang === lang}
				<button
					type="button"
					onclick={() => switchLanguage(lang)}
					class="group relative z-10 flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-[10px] font-black tracking-[0.12em] transition-all duration-300 sm:min-w-12 sm:gap-1.5 sm:px-3 sm:text-[11px] sm:tracking-[0.16em] {active ? 'text-white' : 'text-plum-light hover:text-plum'}"
					aria-pressed={active}
					aria-label={lang === 'th' ? m.language_th() : m.language_en()}
				>
					<span class="h-1.5 w-1.5 rounded-full transition-all duration-300 {active ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]' : 'bg-plum-light/25 group-hover:bg-coral/60'}"></span>
					<span>{lang.toUpperCase()}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}
