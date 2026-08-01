<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { ApiErrorResponse, ProfileResponse, ProfileUpdateResponse } from '$lib/types.js';

	let { user, lang }: { user: ProfileResponse['user']; lang: 'th' | 'en' } = $props();
	let displayName = $state('');
	let avatarUrl = $state('');
	let coverUrl = $state('');
	let isLoading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	$effect(() => {
		displayName = user.displayName ?? '';
		avatarUrl = user.avatarUrl ?? '';
		coverUrl = user.coverUrl ?? '';
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isLoading = true;
		successMessage = '';
		errorMessage = '';

		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, avatarUrl, coverUrl })
			});
			if (response.status === 401) {
				await goto(localizedHref('/login', lang));
				return;
			}
			if (!response.ok) {
				errorMessage = ((await response.json()) as ApiErrorResponse).error || m.profile_update_error();
				return;
			}
			const payload = (await response.json()) as ProfileUpdateResponse;
			displayName = payload.user.displayName ?? '';
			avatarUrl = payload.user.avatarUrl ?? '';
			coverUrl = payload.user.coverUrl ?? '';
			successMessage = m.profile_update_success();
			await invalidateAll();
		} catch {
			errorMessage = m.profile_update_error();
		} finally {
			isLoading = false;
		}
	}
</script>

{#if successMessage || errorMessage}
	<div class="form-notices" aria-live="polite">
		{#if successMessage}<p class="notice success" role="status">{successMessage}</p>{/if}
		{#if errorMessage}<p class="notice error" role="alert">{errorMessage}</p>{/if}
	</div>
{/if}

<form onsubmit={handleSubmit} aria-busy={isLoading}>
	<div class="form-field">
		<label for="displayName">{m.profile_display_name()}</label>
		<input id="displayName" name="displayName" type="text" autocomplete="name" maxlength="255" bind:value={displayName} placeholder={m.profile_display_name_placeholder()} class="orbit-field touch-target" />
	</div>
	<div class="form-field">
		<label for="avatarUrl">{m.profile_avatar_url()}</label>
		<input id="avatarUrl" name="avatarUrl" type="url" bind:value={avatarUrl} placeholder="https://example.com/avatar.jpg" class="orbit-field touch-target" />
	</div>
	<div class="form-field wide">
		<label for="coverUrl">{m.profile_cover_url()} <span>({m.profile_cover_url_hint()})</span></label>
		<input id="coverUrl" name="coverUrl" type="url" bind:value={coverUrl} placeholder="https://example.com/cover.jpg" class="orbit-field touch-target" />
		{#if coverUrl}
			<span class="cover-preview"><Picture src={coverUrl} type="posters" sizes="(max-width: 768px) 100vw, 960px" alt={m.profile_cover_preview_alt()} width={960} height={320} loading="lazy" class="h-full w-full object-cover" /></span>
		{/if}
	</div>
	<div class="form-submit wide">
		<button type="submit" disabled={isLoading} class="orbit-action touch-target">{isLoading ? m.profile_saving() : m.profile_save_profile()}</button>
	</div>
</form>

<style>
	.form-notices { display: grid; gap: .5rem; margin-bottom: 1rem; }
	.notice { padding: .8rem 1rem; border: 1px solid var(--orbit-line); font-size: .85rem; font-weight: var(--orbit-font-label-weight); }
	.notice.success { background: color-mix(in srgb, var(--orbit-success) 12%, var(--orbit-surface)); color: var(--orbit-success); }
	.notice.error { background: color-mix(in srgb, var(--orbit-error) 12%, var(--orbit-surface)); color: var(--orbit-error); }
	form { display: grid; gap: 1rem; padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--orbit-line); background: var(--orbit-surface); }
	.form-field { display: grid; gap: .45rem; }
	label { font-size: .78rem; font-weight: var(--orbit-font-label-weight); }
	label span { color: var(--orbit-muted); font-size: .7rem; font-weight: 400; }
	input { width: 100%; }
	.cover-preview { display: block; overflow: hidden; aspect-ratio: 3/1; border: 1px solid var(--orbit-line); background: var(--orbit-paper-deep); }
	.form-submit { display: flex; justify-content: flex-end; padding-top: .5rem; }
	.form-submit button { width: 100%; justify-content: center; }
	@media (min-width: 720px) { form { grid-template-columns: repeat(2,minmax(0,1fr)); } .wide { grid-column: 1/-1; } .form-submit button { width: auto; min-width: 10rem; } }
</style>
