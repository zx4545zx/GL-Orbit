<script lang="ts">
	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { ApiErrorResponse, PasswordUpdateResponse } from '$lib/types.js';

	let { lang }: { lang: 'th' | 'en' } = $props();
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let isLoading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isLoading = true;
		successMessage = '';
		errorMessage = '';
		try {
			const response = await fetch('/api/profile/password', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
			});
			if (response.status === 401) { await goto(localizedHref('/login', lang)); return; }
			if (!response.ok) { errorMessage = ((await response.json()) as ApiErrorResponse).error || m.profile_password_error(); return; }
			const payload = (await response.json()) as PasswordUpdateResponse;
			successMessage = payload.revokedCount > 0 ? m.profile_password_sessions_revoked({ count: payload.revokedCount }) : m.profile_password_success();
			currentPassword = ''; newPassword = ''; confirmNewPassword = '';
		} catch { errorMessage = m.profile_password_error(); }
		finally { isLoading = false; }
	}
</script>

{#if successMessage || errorMessage}
	<div class="form-notices" aria-live="polite">
		{#if successMessage}<p class="notice success" role="status">{successMessage}</p>{/if}
		{#if errorMessage}<p class="notice error" role="alert">{errorMessage}</p>{/if}
	</div>
{/if}
<form onsubmit={handleSubmit} aria-busy={isLoading}>
	<PasswordInput id="currentPassword" name="currentPassword" bind:value={currentPassword} label={m.profile_current_password()} autocomplete="current-password" variant="flat" />
	<PasswordInput id="newPassword" name="newPassword" bind:value={newPassword} label={m.profile_new_password()} placeholder={m.profile_new_password_placeholder()} minlength={6} autocomplete="new-password" variant="flat" />
	<PasswordInput id="confirmPassword" name="confirmPassword" bind:value={confirmNewPassword} label={m.profile_confirm_new_password()} autocomplete="new-password" variant="flat" />
	<div class="form-submit"><button type="submit" disabled={isLoading} class="orbit-action touch-target">{isLoading ? m.profile_saving() : m.profile_change_password()}</button></div>
</form>

<style>
	.form-notices { display: grid; gap: .5rem; margin-bottom: 1rem; }
	.notice { padding: .8rem 1rem; border: 1px solid var(--orbit-line); font-size: .85rem; font-weight: var(--orbit-font-label-weight); }
	.notice.success { background: color-mix(in srgb, var(--orbit-success) 12%, var(--orbit-surface)); color: var(--orbit-success); }
	.notice.error { background: color-mix(in srgb, var(--orbit-error) 12%, var(--orbit-surface)); color: var(--orbit-error); }
	form { display: grid; gap: 1rem; padding: clamp(1rem,3vw,2rem); border: 1px solid var(--orbit-line); background: var(--orbit-surface); }
	.form-submit { display: flex; justify-content: flex-end; padding-top: .5rem; }
	.form-submit button { width: 100%; justify-content: center; }
	@media (min-width:560px) { .form-submit button { width:auto; min-width:10rem; } }
</style>
