<script lang="ts">

	import { page } from '$app/state';
	import { localizedHref } from '$lib/i18n/link.js';	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { m } from '$lib/i18n/paraglide.js';


	$effect(() => {
		if (page.data.user) goto(localizedHref('/profile', page.data.lang));
	});

	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let username = $state('');
	let email = $state('');
	let displayName = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';
		fieldErrors = {};

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, displayName, password, confirmPassword })
			});
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.error || m.register_error_default();
				if (data.fields) fieldErrors = data.fields;
				return;
			}
			await goto(`${localizedHref('/profile', page.data.lang)}?push=1`, { invalidateAll: true });
		} catch {
			errorMessage = m.register_error_default();
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.register_seo_title()}</title>
	<meta name="description" content={m.register_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-[calc(100dvh-6rem)] flex items-center justify-center px-4">
	<div class="relative w-full max-w-sm sm:max-w-md">
		<div class="text-center mb-6 sm:mb-8">
			<div class="w-14 h-14 sm:w-16 sm:h-16 mb-4 mx-auto">
				<img src="/icons/gl-orbit-logo.svg" alt="GL-Orbit" class="w-full h-full" />
			</div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2">{m.register_title()}</h1>
			<p class="text-sm sm:text-base text-plum-light">{m.register_subtitle()}</p>
		</div>

		<div class="glass-card-strong rounded-xl sm:rounded-2xl p-6 sm:p-8">
			{#if errorMessage}
				<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-5">
				<div>
					<label for="username" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">{m.register_label_username()}</label>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						placeholder="username"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg orbit-control placeholder:text-plum-light/50 transition-all text-sm sm:text-base touch-target {fieldErrors.username ? 'border-coral/50' : ''}"
						required
					/>
					{#if fieldErrors.username}
						<p class="text-xs text-coral mt-1">{fieldErrors.username}</p>
					{/if}
				</div>
				<div>
					<label for="displayName" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">{m.register_label_display_name()} <span class="text-plum-light/60 font-normal">{m.register_optional_note()}</span></label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						bind:value={displayName}
						placeholder={m.register_placeholder_display_name()}
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg orbit-control placeholder:text-plum-light/50 transition-all text-sm sm:text-base touch-target"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">{m.register_label_email()}</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg orbit-control placeholder:text-plum-light/50 transition-all text-sm sm:text-base touch-target {fieldErrors.email ? 'border-coral/50' : ''}"
						required
					/>
					{#if fieldErrors.email}
						<p class="text-xs text-coral mt-1">{fieldErrors.email}</p>
					{/if}
				</div>
				<PasswordInput
					id="password"
					name="password"
					bind:value={password}
					placeholder={m.register_password_placeholder()}
					minlength={6}
					label={m.register_password_label()}
				/>
				<PasswordInput
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					label={m.register_confirm_password_label()}
				/>
				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 sm:py-3.5 rounded-lg orbit-action font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base touch-target flex items-center justify-center"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<svg class="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
						<span>{m.register_submit_loading()}</span>
					</div>
					{:else}
						{m.register_submit()}
					{/if}
				</button>
			</form>

			<div class="mt-5 text-center">
				<p class="text-sm text-plum-light">
					{m.register_have_account()}
					<a href="/{page.data.lang}/login" class="text-coral-dark font-medium hover:underline">{m.register_login_link()}</a>
				</p>
			</div>
		</div>
	</div>
</div>
