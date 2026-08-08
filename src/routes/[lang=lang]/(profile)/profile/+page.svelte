<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Picture from '$lib/components/Picture.svelte';
	import LibraryShareCard from '$lib/components/profile/LibraryShareCard.svelte';
	import {
		getExistingSubscription,
		isPushSupported,
		requestPushPermission,
		unsubscribePush
	} from '$lib/client/push-notifications.js';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type {
		FavoriteSeriesItem,
		WatchedSeriesItem
	} from '$lib/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let libraryView = $state<'favorite' | 'watched'>('favorite');
	let successMessage = $state('');
	let errorMessage = $state('');
	let pushEnabled = $state(false);
	let pushLoading = $state(false);
	let pushSupported = $state(false);

	const profileUser = $derived(data.profileUser);
	const activeTab = $derived(
		page.url.searchParams.get('tab') === 'account' ? 'account' : 'library'
	);
	const series = $derived(
		libraryView === 'favorite' ? data.favoriteSeries : data.watchedSeries
	);
	const dateLocale = $derived(page.data.lang === 'th' ? 'th-TH' : 'en-US');

	function seriesStatusLabel(status: FavoriteSeriesItem['status']) {
		return status === 'ONGOING'
			? m.status_ongoing()
			: status === 'UPCOMING'
				? m.status_upcoming()
				: m.status_ended();
	}

	function pushPermissionDenied() {
		return typeof Notification !== 'undefined' && Notification.permission === 'denied';
	}

	$effect(() => {
		if (!successMessage && !errorMessage) return;
		const timer = setTimeout(() => {
			successMessage = '';
			errorMessage = '';
		}, 4000);
		return () => clearTimeout(timer);
	});

	onMount(async () => {
		pushSupported = isPushSupported();
		if (!pushSupported) return;

		const requestedFromLink = page.url.searchParams.get('push') === '1';

		try {
			const subscription = await getExistingSubscription();
			pushEnabled = !!subscription;

			if (requestedFromLink && !subscription) {
				localStorage.removeItem('push-prompt-dismissed');
				pushEnabled = await requestPushPermission();
				if (pushEnabled) {
					successMessage = m.push_prompt_success();
				} else {
					errorMessage =
						pushPermissionDenied()
							? m.push_prompt_blocked()
							: m.push_prompt_error();
				}
			}
		} catch {
			if (requestedFromLink) errorMessage = m.push_prompt_error();
		}
	});

	async function togglePush() {
		pushLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			if (pushEnabled) {
				if (await unsubscribePush()) {
					pushEnabled = false;
					successMessage = m.profile_push_disabled();
				} else {
					errorMessage = m.push_prompt_error();
				}
			} else {
				pushEnabled = await requestPushPermission();
				if (pushEnabled) {
					successMessage = m.push_prompt_success();
				} else {
					errorMessage =
						pushPermissionDenied()
							? m.push_prompt_blocked()
							: m.push_prompt_error();
				}
			}
		} catch {
			errorMessage = m.push_prompt_error();
		} finally {
			pushLoading = false;
		}
	}

</script>

<svelte:head>
	<title>{m.profile_seo_title()}</title>
	<meta name="description" content={m.profile_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#snippet seriesCard(item: FavoriteSeriesItem | WatchedSeriesItem)}
	<a
		href={localizedHref(`/series/${item.id}`, page.data.lang)}
		class="series-card"
		aria-label={`${item.title} · ${seriesStatusLabel(item.status)}`}
		title={item.title}
	>
		<span class="series-image">
			<Picture
				src={item.poster}
				type="posters"
				sizes="(max-width: 699px) calc(100vw / 3), calc((100vw - 15rem) / 4)"
				alt=""
				width={300}
				height={400}
				class="h-full w-full object-cover"
				loading="lazy"
				decoding="async"
			/>
			<span class="series-overlay" aria-hidden="true">
				<strong>{item.title}</strong>
				<span>{seriesStatusLabel(item.status)}</span>
			</span>
		</span>
	</a>
{/snippet}

{#snippet emptyState(title: string, description: string)}
	<div class="profile-empty">
		<span class="empty-orbit" aria-hidden="true">○</span>
		<h2>{title}</h2>
		<p>{description}</p>
		<a href={localizedHref('/explore?view=series', page.data.lang)} class="orbit-action">
			{m.profile_view_all_series()} <span aria-hidden="true">→</span>
		</a>
	</div>
{/snippet}

<div class="profile-page">
	<div class="notice-region" aria-live="polite">
		{#if successMessage}
			<p class="profile-notice success" role="status">{successMessage}</p>
		{/if}
		{#if errorMessage}
			<p class="profile-notice error" role="alert">{errorMessage}</p>
		{/if}
	</div>

	{#if activeTab === 'library'}
		<section aria-labelledby="library-heading">
			<header class="library-tabs">
				<h2 id="library-heading" class="sr-only">{m.profile_library_heading()}</h2>
				<div class="library-switch" role="tablist" aria-label={m.profile_library_tab()}>
					<button
						id="favorites-tab"
						role="tab"
						class="orbit-control"
						class:active={libraryView === 'favorite'}
						aria-selected={libraryView === 'favorite'}
						aria-controls="library-grid"
						title={`${m.profile_favorites_label()} ${data.favoriteSeries.length}`}
						onclick={() => (libraryView = 'favorite')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
						</svg>
						<span class="library-tab-label">{m.profile_favorites_label()}</span>
					</button>
					<button
						id="watched-tab"
						role="tab"
						class="orbit-control"
						class:active={libraryView === 'watched'}
						aria-selected={libraryView === 'watched'}
						aria-controls="library-grid"
						title={`${m.profile_watched_label()} ${data.watchedSeries.length}`}
						onclick={() => (libraryView = 'watched')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="m8 12 2.6 2.6L16.5 9" />
						</svg>
						<span class="library-tab-label">{m.profile_watched_label()}</span>
					</button>
				</div>
			</header>

			<div
				id="library-grid"
				role="tabpanel"
				aria-labelledby={libraryView === 'favorite' ? 'favorites-tab' : 'watched-tab'}
			>
				{#if series.length}
					<div class="series-grid">
						{#each series as item (item.id)}
							{@render seriesCard(item)}
						{/each}
					</div>
				{:else}
					{@render emptyState(
						libraryView === 'favorite'
							? m.profile_empty_favorites_title()
							: m.profile_empty_watched_title(),
						libraryView === 'favorite'
							? m.profile_empty_favorites_desc()
							: m.profile_empty_watched_desc()
					)}
				{/if}
			</div>

			{#if data.favoriteSeries.length || data.watchedSeries.length}
				<div class="profile-share">
					<LibraryShareCard
						lang={page.data.lang}
						displayName={profileUser.displayName}
						avatarUrl={profileUser.avatarUrl}
						favoriteCount={data.favoriteSeries.length}
						watchedCount={data.watchedSeries.length}
						favorites={data.favoriteSeries}
					/>
				</div>
			{/if}
		</section>
	{:else}
		<section aria-labelledby="account-heading">
			<header class="section-heading">
				<div class="section-heading-copy">
					<p class="section-kicker">{m.profile_account_tab()}</p>
					<h2 id="account-heading">{m.profile_account_section()}</h2>
					<p class="section-description">{m.profile_account_section_desc()}</p>
				</div>
			</header>

			<div class="account-layout">
				<dl class="profile-details">
					<div>
						<dt>{m.profile_username()}</dt>
						<dd>{profileUser.username}</dd>
					</div>
					<div>
						<dt>{m.profile_email()}</dt>
						<dd>{profileUser.email}</dd>
					</div>
					<div>
						<dt>{m.profile_display_name()}</dt>
						<dd>{profileUser.displayName || '-'}</dd>
					</div>
					<div>
						<dt>{m.profile_joined_on()}</dt>
						<dd>
							{new Date(profileUser.createdAt).toLocaleDateString(dateLocale, {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</dd>
					</div>
				</dl>

				<nav class="account-actions" aria-label={m.profile_account_tab()}>
					<a class="orbit-control" href={localizedHref('/account/profile', page.data.lang)}>
						<span><strong>{m.profile_edit()}</strong><small>{m.profile_profile_section_desc()}</small></span>
					</a>
					<a class="orbit-control" href={localizedHref('/security/password', page.data.lang)}>
						<span><strong>{m.profile_security_section()}</strong><small>{m.profile_security_section_desc()}</small></span>
					</a>
					<a class="orbit-control" href={localizedHref('/subscriptions', page.data.lang)}>
						<span><strong>{m.subscriptions_nav()}</strong><small>{m.subscriptions_subtitle()}</small></span>
					</a>
					<a class="orbit-control" href={localizedHref('/notifications', page.data.lang)}>
						<span><strong>{m.notifications_title()}</strong><small>{m.profile_notifications_desc()}</small></span>
					</a>
				</nav>
			</div>

			{#if pushSupported}
				<section class="push-panel" aria-busy={pushLoading}>
					<div>
						<p class="section-kicker">{m.notifications_title()}</p>
						<h2>{m.push_prompt_title()}</h2>
						<p>{m.push_prompt_description()}</p>
					</div>
					<button
						onclick={togglePush}
						disabled={pushLoading}
						aria-pressed={pushEnabled}
						class="orbit-action touch-target"
					>
						{pushLoading
							? pushEnabled
								? m.profile_push_disabling()
								: m.push_prompt_enabling()
							: pushEnabled
								? m.profile_push_disable()
								: m.push_prompt_enable()}
					</button>
				</section>
			{/if}
		</section>
	{/if}
</div>

<style>
	.profile-page {
		display: grid;
		gap: 1.5rem;
	}

	.notice-region:empty {
		display: none;
	}

	.notice-region {
		position: fixed;
		top: max(1rem, env(safe-area-inset-top));
		left: 50%;
		z-index: 80;
		display: grid;
		width: min(calc(100% - 2rem), 34rem);
		gap: 0.5rem;
		pointer-events: none;
		transform: translateX(-50%);
	}

	.profile-notice {
		border: var(--orbit-border-width) var(--orbit-border-style) currentColor;
		background: var(--orbit-surface);
		padding: 0.8rem 1rem;
		box-shadow: var(--orbit-shadow-interactive);
		font-size: 0.85rem;
		font-weight: var(--orbit-font-label-weight);
		pointer-events: auto;
	}

	.profile-notice.success {
		background: color-mix(in srgb, var(--orbit-success) 12%, var(--orbit-surface));
		color: var(--orbit-success);
	}

	.profile-notice.error {
		background: color-mix(in srgb, var(--orbit-error) 12%, var(--orbit-surface));
		color: var(--orbit-error);
	}

	.section-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 1rem 1.5rem;
		padding-bottom: clamp(1rem, 2vw, 1.5rem);
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.section-heading-copy {
		min-width: 0;
	}

	.section-kicker {
		margin-bottom: 0.35rem;
		color: var(--orbit-coral-dark);
		font-size: 0.68rem;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.section-heading h2,
	.profile-empty h2,
	.push-panel h2 {
		font-family: var(--orbit-font-display);
		font-size: clamp(1.75rem, 4vw, 3.25rem);
		font-weight: var(--orbit-font-heading-weight);
		letter-spacing: var(--orbit-font-letter-spacing);
		line-height: 1.05;
	}

	.section-description,
	.profile-empty p,
	.push-panel p {
		margin-top: 0.4rem;
		color: var(--orbit-muted);
		font-size: 0.9rem;
	}

	.library-tabs {
		padding: 0.75rem;
		background: var(--orbit-surface);
	}

	.library-switch {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		width: min(100%, 38rem);
		margin-inline: auto;
		gap: 0.5rem;
	}

	.library-switch button {
		display: flex;
		min-height: 3rem;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border-color: var(--orbit-border-strong);
		background: var(--orbit-surface);
		color: var(--orbit-muted);
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: var(--orbit-font-label-weight);
		box-shadow: var(--orbit-shadow-interactive);
		transition:
			background-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			border-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			box-shadow var(--orbit-motion-fast) var(--orbit-motion-ease),
			color var(--orbit-motion-fast) var(--orbit-motion-ease),
			transform var(--orbit-motion-fast) var(--orbit-motion-ease);
	}

	.library-switch button:hover {
		border-color: var(--orbit-border-interactive);
		background: var(--orbit-coral-soft);
		color: var(--orbit-coral-dark);
		box-shadow: var(--orbit-shadow-accent);
		transform: translateY(-1px);
	}

	.library-switch button:active {
		box-shadow: none;
		transform: translateY(1px);
	}

	.library-switch button.active {
		border-color: var(--orbit-border-interactive);
		background: var(--orbit-coral-soft);
		color: var(--orbit-coral-dark);
		box-shadow: var(--orbit-shadow-accent);
	}

	.library-switch svg {
		width: 1.35rem;
		height: 1.35rem;
		flex: 0 0 auto;
	}

	.library-tab-label {
		white-space: nowrap;
	}

	.series-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2px;
		background: var(--orbit-canvas);
	}

	.series-card {
		min-width: 0;
		overflow: hidden;
		border-radius: 0 !important;
		background: var(--orbit-paper-deep);
		color: white;
		text-decoration: none;
	}

	.series-image {
		position: relative;
		display: block;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		border-radius: 0 !important;
		background: var(--orbit-paper-deep);
	}

	.series-image :global(img) {
		transition: transform var(--orbit-motion-standard) var(--orbit-motion-ease);
	}

	.series-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		align-content: end;
		gap: 0.1rem;
		padding: clamp(0.35rem, 1.5vw, 0.85rem);
		border-radius: 0 !important;
		background: linear-gradient(to top, rgb(0 0 0 / 0.72), transparent 62%);
		opacity: 0;
		transition: opacity var(--orbit-motion-fast) var(--orbit-motion-ease);
	}

	.series-overlay strong {
		display: -webkit-box;
		overflow: hidden;
		font-family: var(--orbit-font-display);
		font-size: clamp(0.65rem, 1.5vw, 1rem);
		line-clamp: 2;
		line-height: 1.2;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.series-overlay span {
		font-size: clamp(0.55rem, 1vw, 0.72rem);
		opacity: 0.8;
	}

	.series-card:hover .series-image :global(img),
	.series-card:focus-visible .series-image :global(img) {
		transform: scale(1.035);
	}

	.series-card:hover .series-overlay,
	.series-card:focus-visible .series-overlay {
		opacity: 1;
	}

	.profile-empty {
		position: relative;
		display: grid;
		min-height: 19rem;
		place-items: center;
		align-content: center;
		gap: 0.55rem;
		margin-top: 1.5rem;
		overflow: hidden;
		border: var(--orbit-border-width) dashed var(--orbit-line-strong);
		background: var(--orbit-surface);
		padding: 2rem 1rem;
		text-align: center;
	}

	.empty-orbit {
		position: absolute;
		top: 50%;
		left: 50%;
		color: var(--orbit-lavender);
		font-family: var(--orbit-font-display);
		font-size: 18rem;
		line-height: 1;
		transform: translate(-50%, -52%);
		opacity: 0.35;
	}

	.profile-empty h2,
	.profile-empty p,
	.profile-empty a {
		position: relative;
		z-index: 1;
	}

	.profile-empty h2 {
		font-size: clamp(1.4rem, 3vw, 2.2rem);
	}

	.profile-empty p {
		max-width: 36rem;
	}

	.profile-empty .orbit-action {
		margin-top: 0.65rem;
		text-decoration: none;
	}

	.profile-share {
		margin-top: clamp(2rem, 5vw, 4rem);
		padding-top: clamp(1.5rem, 3vw, 2.5rem);
		border-top: 1px solid var(--orbit-line);
	}

	.account-layout {
		display: grid;
		gap: 1.25rem;
		margin-top: 1.5rem;
	}

	.profile-details {
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.profile-details div {
		display: grid;
		grid-template-columns: minmax(7rem, 9rem) minmax(0, 1fr);
		gap: 1rem;
		padding: 0.85rem 0.75rem;
		border-bottom: 1px solid var(--orbit-line);
	}

	.profile-details div:nth-child(even) {
		background: color-mix(in srgb, var(--orbit-paper-deep) 65%, transparent);
	}

	.profile-details dt {
		color: var(--orbit-muted);
		font-size: 0.72rem;
		font-weight: var(--orbit-font-label-weight);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.profile-details dd {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.85rem;
		font-weight: var(--orbit-font-label-weight);
		text-align: start;
	}

	.account-actions {
		display: grid;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.account-actions a {
		display: flex;
		min-height: 4.75rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 0.9rem;
		border-bottom: 1px solid var(--orbit-line);
		color: var(--orbit-ink);
		text-decoration: none;
		transition:
			background-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			padding-inline var(--orbit-motion-fast) var(--orbit-motion-ease);
	}

	.account-actions a:hover {
		padding-inline-start: 1.15rem;
		background: var(--orbit-coral-soft);
	}

	.account-actions a > span {
		display: grid;
		gap: 0.2rem;
	}

	.account-actions strong {
		font-family: var(--orbit-font-display);
		font-size: 1rem;
	}

	.account-actions small {
		color: var(--orbit-muted);
		font-size: 0.74rem;
	}

	.push-panel {
		display: grid;
		gap: 1.25rem;
		margin-top: clamp(2rem, 5vw, 4rem);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		background: var(--orbit-mint);
		padding: clamp(1rem, 3vw, 1.5rem);
	}

	.push-panel h2 {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
	}

	.push-panel p:not(.section-kicker) {
		color: color-mix(in srgb, var(--orbit-ink) 72%, transparent);
	}

	.push-panel .orbit-action {
		justify-content: center;
	}

	@media (min-width: 560px) {
		.push-panel {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
		}

		.push-panel .orbit-action {
			width: auto;
			min-width: 10rem;
		}
	}

	@media (min-width: 700px) {
		.series-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (min-width: 720px) {
		.account-layout {
			grid-template-columns: minmax(0, 1.05fr) minmax(15rem, 0.95fr);
			gap: clamp(1.25rem, 3vw, 2.5rem);
		}

	}

	@media (prefers-reduced-motion: reduce) {
		.series-card,
		.series-image :global(img),
		.account-actions a {
			transition-duration: 0.01ms !important;
		}

		.series-card:hover .series-image :global(img),
		.series-card:focus-visible .series-image :global(img) {
			transform: none;
		}
	}

	/* Quiet, project-native profile treatment. */
	.section-heading {
		align-items: center;
		padding-bottom: 0;
		border-bottom: 0;
	}

	.section-kicker {
		display: none;
	}

	.section-heading h2,
	.profile-empty h2,
	.push-panel h2 {
		font-size: clamp(1.6rem, 4vw, 2.5rem);
	}

	.profile-empty {
		border: 0;
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-paper-deep);
	}

	.profile-share {
		padding-top: 0;
		border-top: 0;
	}

	.account-layout {
		margin-top: 1.75rem;
	}

	.profile-details {
		display: grid;
		align-self: start;
		align-content: start;
		gap: 1rem;
		padding: clamp(1rem, 3vw, 1.5rem);
		border-top: 0;
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-paper-deep);
	}

	.profile-details div {
		padding: 0;
		border-bottom: 0;
	}

	.profile-details div:nth-child(even) {
		background: transparent;
	}

	.account-actions {
		gap: 0.65rem;
		border-top: 0;
	}

	.account-actions a {
		min-height: 4.5rem;
		padding: 0.8rem 1rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-border-strong);
		border-radius: var(--orbit-radius-control);
	}

	.account-actions a:hover {
		padding-inline: 1rem;
		background: var(--orbit-coral-soft);
	}

	.push-panel {
		border: 0;
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-surface);
	}

</style>
