<script lang="ts">

	import { page } from '$app/state';
	import { localizedHref } from '$lib/i18n/link.js';	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { m } from '$lib/i18n/paraglide.js';

	let isLoading = $state(false);
	let errorMessage = $state('');
	let email = $state('');
	let password = $state('');
	const defaultDestination = $derived(localizedHref('/profile', page.data.lang));
	function destination() {
		const redirectTo = page.url.searchParams.get('redirectTo');
		if (!redirectTo) return defaultDestination;
		try {
			const url = new URL(redirectTo, page.url.origin);
			return url.origin === page.url.origin && url.pathname.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : defaultDestination;
		} catch { return defaultDestination; }
	}

	$effect(() => {
		if (page.data.user) goto(destination());
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifier: email, password })
			});
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.error || m.login_error_default();
				return;
			}
			await goto(destination(), { invalidateAll: true });
		} catch {
			errorMessage = m.login_error_default();
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.login_seo_title()}</title>
	<meta name="description" content={m.login_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-[calc(100dvh-6rem)] flex items-center justify-center px-4">
	<div class="relative w-full max-w-sm sm:max-w-md">
		<div class="text-center mb-6 sm:mb-8">
			<div class="w-14 h-14 sm:w-16 sm:h-16 mb-4 mx-auto">
				<img src="/icons/gl-orbit-logo.svg" alt="GL-Orbit" class="w-full h-full" />
			</div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2">{m.login_title()}</h1>
			<p class="text-sm sm:text-base text-plum-light">{m.login_subtitle()}</p>
		</div>

		<div class="glass-card-strong rounded-xl sm:rounded-2xl p-6 sm:p-8">
			{#if errorMessage}
				<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-5">
				<div>
					<label for="identifier" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">{m.login_label_identifier()}</label>
					<input
						id="identifier"
						name="identifier"
						type="text"
						bind:value={email}
						placeholder={m.login_placeholder_identifier()}
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg orbit-control placeholder:text-plum-light/50 transition-all text-sm sm:text-base touch-target"
						required
					/>
				</div>
				<PasswordInput bind:value={password} />
				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 sm:py-3.5 rounded-lg orbit-action font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base touch-target flex items-center justify-center"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<svg class="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
						<span>{m.login_submit_loading()}</span>
					</div>
					{:else}
						{m.login_submit()}
					{/if}
				</button>
			</form>

			<div class="mt-5 text-center">
				<p class="text-sm text-plum-light">
					{m.login_no_account()}
					<a href="/{page.data.lang}/register" class="text-coral-dark font-medium hover:underline">{m.login_register_link()}</a>
				</p>
			</div>
		</div>
	</div>
</div>
