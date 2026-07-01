<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { availableLanguageTags, type AvailableLanguageTag, m } from '$lib/i18n/paraglide.js';

	let { className = '' }: { className?: string } = $props();

	async function switchLanguage(lang: AvailableLanguageTag) {
		const current = page.url.pathname;
		const currentLang = page.data.lang ?? 'th';
		const newPath = current.startsWith(`/${currentLang}/`)
			? current.replace(`/${currentLang}/`, `/${lang}/`)
			: `/${lang}${current}`;

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

<div class="flex items-center gap-1 rounded-full border border-white/70 bg-white/55 p-1 shadow-sm backdrop-blur-xl {className}">
	{#each availableLanguageTags as lang (lang)}
		{@const active = page.data.lang === lang}
		<button
			type="button"
			onclick={() => switchLanguage(lang)}
			class="px-2.5 py-1 rounded-full text-xs font-semibold transition-all touch-target {active
				? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-sm'
				: 'text-plum-light hover:text-plum hover:bg-white/60'}"
			aria-pressed={active}
		>
			{lang === 'th' ? m.language_th() : m.language_en()}
		</button>
	{/each}
</div>
