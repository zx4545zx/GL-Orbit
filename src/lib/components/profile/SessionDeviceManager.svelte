<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { m, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type {
		ApiErrorResponse,
		DeviceSessionItem,
		SessionMutationResponse,
		SessionsResponse
	} from '$lib/types.js';

	interface Props {
		lang: AvailableLanguageTag;
	}

	let { lang }: Props = $props();
	let sessions = $state<DeviceSessionItem[]>([]);
	let loading = $state(true);
	let mutationInFlight = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let dialogOpen = $state(false);
	let pendingAction = $state<{ type: 'one'; id: string } | { type: 'others' } | null>(null);

	const otherSessions = $derived(sessions.filter((session) => !session.isCurrent));
	const dialogTitle = $derived(
		pendingAction?.type === 'others'
			? m.profile_sessions_logout_others_dialog_title()
			: m.profile_sessions_revoke_dialog_title()
	);
	const dialogMessage = $derived(
		pendingAction?.type === 'others'
			? m.profile_sessions_logout_others_dialog_message({ count: otherSessions.length })
			: m.profile_sessions_revoke_dialog_message()
	);

	function redirectToLogin() {
		void goto(localizedHref('/login', lang));
	}

	async function loadSessions() {
		loading = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/profile/sessions');
			if (response.status === 401) {
				redirectToLogin();
				return;
			}
			if (!response.ok) throw new Error('SESSION_LIST_FAILED');
			const data = (await response.json()) as SessionsResponse;
			sessions = data.sessions;
		} catch {
			errorMessage = m.profile_sessions_error();
		} finally {
			loading = false;
		}
	}

	function askToRevoke(id: string) {
		pendingAction = { type: 'one', id };
		dialogOpen = true;
	}

	function askToRevokeOthers() {
		pendingAction = { type: 'others' };
		dialogOpen = true;
	}

	async function revokePending() {
		if (!pendingAction || mutationInFlight) return;
		const action = pendingAction;
		mutationInFlight = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch(
				action.type === 'one'
					? `/api/profile/sessions/${encodeURIComponent(action.id)}`
					: '/api/profile/sessions/logout-others',
				{ method: action.type === 'one' ? 'DELETE' : 'POST' }
			);
			if (response.status === 401) {
				redirectToLogin();
				return;
			}
			if (!response.ok) {
				const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
				throw new Error(body?.error ?? 'SESSION_MUTATION_FAILED');
			}

			const data = (await response.json()) as SessionMutationResponse;
			sessions = action.type === 'one'
				? sessions.filter((session) => session.id !== action.id)
				: sessions.filter((session) => session.isCurrent);
			successMessage = m.profile_sessions_success({ count: data.revokedCount });
			pendingAction = null;
		} catch {
			errorMessage = m.profile_sessions_error();
		} finally {
			mutationInFlight = false;
		}
	}

	function deviceLabel(type: DeviceSessionItem['deviceType']) {
		if (type === 'desktop') return m.profile_sessions_device_desktop();
		if (type === 'mobile') return m.profile_sessions_device_mobile();
		if (type === 'tablet') return m.profile_sessions_device_tablet();
		return m.profile_sessions_device_unknown();
	}

	function locationLabel(session: DeviceSessionItem) {
		const parts = [session.city, session.countryCode].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : m.profile_sessions_unknown_location();
	}

	function formatDate(value: string) {
		return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	onMount(loadSessions);
</script>

<section class="border border-[var(--orbit-line)] bg-[var(--orbit-surface)]" aria-labelledby="session-devices-title">
	<header class="flex flex-col gap-3 border-b border-[var(--orbit-line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
		<div>
			<h2 id="session-devices-title" class="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--orbit-ink)]">
				{m.profile_sessions_title()}
			</h2>
			<p class="mt-1 text-sm text-[var(--orbit-muted)]">
				{m.profile_sessions_active_count({ count: sessions.length })}
			</p>
		</div>
		{#if otherSessions.length > 0}
			<button
				type="button"
				disabled={mutationInFlight}
				onclick={askToRevokeOthers}
				class="touch-target border border-coral px-4 py-2 text-sm font-semibold text-coral-dark transition-colors hover:bg-coral/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-50"
			>
				{m.profile_sessions_logout_others()}
			</button>
		{/if}
	</header>

	{#if loading}
		<p class="p-5 text-sm text-[var(--orbit-muted)]" role="status">{m.profile_sessions_loading()}</p>
	{:else if sessions.length === 0 && !errorMessage}
		<p class="p-5 text-sm text-[var(--orbit-muted)]">{m.profile_sessions_empty()}</p>
	{:else}
		<ul aria-label={m.profile_sessions_title()}>
			{#each sessions as session (session.id)}
				<li class="grid gap-4 border-b border-[var(--orbit-line)] p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<strong class="text-sm text-[var(--orbit-ink)] sm:text-base">
								{session.browser ?? m.profile_sessions_unknown_browser()}
							</strong>
							{#if session.isCurrent}
								<span class="border border-mint-dark bg-mint/15 px-2 py-0.5 text-xs font-semibold text-mint-dark">
									{m.profile_sessions_current_device()}
								</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-[var(--orbit-muted)]">
							{session.operatingSystem ?? m.profile_sessions_unknown_os()} · {deviceLabel(session.deviceType)}
						</p>
						<dl class="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 sm:text-sm">
							<div>
								<dt class="text-[var(--orbit-muted)]">{m.profile_sessions_approximate_location()}</dt>
								<dd class="font-medium text-[var(--orbit-ink)]">{locationLabel(session)}</dd>
							</div>
							<div>
								<dt class="text-[var(--orbit-muted)]">{m.profile_sessions_masked_ip()}</dt>
								<dd class="font-medium text-[var(--orbit-ink)]">{session.maskedIp ?? '—'}</dd>
							</div>
							<div>
								<dt class="text-[var(--orbit-muted)]">{m.profile_sessions_signed_in()}</dt>
								<dd class="font-medium text-[var(--orbit-ink)]">{formatDate(session.createdAt)}</dd>
							</div>
							<div>
								<dt class="text-[var(--orbit-muted)]">{m.profile_sessions_last_active()}</dt>
								<dd class="font-medium text-[var(--orbit-ink)]">{formatDate(session.lastSeenAt)}</dd>
							</div>
						</dl>
					</div>
					{#if !session.isCurrent}
						<button
							type="button"
							disabled={mutationInFlight}
							onclick={() => askToRevoke(session.id)}
							class="touch-target self-start border border-[var(--orbit-line-strong)] px-4 py-2 text-sm font-semibold text-coral-dark transition-colors hover:border-coral hover:bg-coral/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-50"
						>
							{m.profile_sessions_revoke()}
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if errorMessage}
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--orbit-line)] bg-coral/5 p-4" role="alert">
			<p class="text-sm font-medium text-coral-dark">{errorMessage}</p>
			<button type="button" onclick={loadSessions} class="touch-target border border-coral px-3 py-2 text-sm font-semibold text-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">
				{m.profile_sessions_retry()}
			</button>
		</div>
	{/if}

	{#if successMessage}
		<p class="border-t border-[var(--orbit-line)] bg-mint/10 p-4 text-sm font-medium text-mint-dark" role="status">
			{successMessage}
		</p>
	{/if}

	<p class="border-t border-[var(--orbit-line)] bg-[var(--orbit-paper-deep)] p-4 text-xs leading-relaxed text-[var(--orbit-muted)] sm:px-5">
		{m.profile_sessions_privacy()}
	</p>
</section>

<ConfirmDialog
	bind:open={dialogOpen}
	title={dialogTitle}
	message={dialogMessage}
	confirmLabel={m.profile_sessions_confirm()}
	cancelLabel={m.profile_sessions_cancel()}
	danger={true}
	onconfirm={revokePending}
/>
