<script lang="ts">
	import { page } from '$app/state';
	import {
		createUnreadNotifications,
		provideUnreadNotifications
	} from '$lib/client/unread-notifications.js';
	import NotificationBadge from '$lib/components/NotificationBadge.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	const unreadState = $state({ count: 0 });
	const unreadNotifications = createUnreadNotifications(unreadState, async () => {
		const response = await fetch('/api/notifications/unread-count');
		if (!response.ok) throw new Error('Unread notification count request failed');
		const payload = (await response.json()) as { count?: unknown };
		return typeof payload.count === 'number' ? payload.count : 0;
	});
	provideUnreadNotifications(unreadNotifications);

	const lang = $derived(page.data.lang);
	const profileHref = $derived(`/${lang}/profile`);
	const subscriptionsHref = $derived(`/${lang}/subscriptions`);
	const notificationsHref = $derived(`/${lang}/notifications`);
	const menuHref = $derived(`/${lang}/settings`);
	const homeHref = $derived(`/${lang}/`);
	const editProfileHref = $derived(`/${lang}/account/profile`);
	const passwordHref = $derived(`/${lang}/security/password`);
	const sessionsHref = $derived(`/${lang}/security/session`);
	const isProfilePath = $derived(page.url.pathname === profileHref);
	const isEditProfileRoute = $derived(isCurrentRoute(editProfileHref));
	const isSecurityRoute = $derived(page.url.pathname.startsWith(`/${lang}/security/`));
	const notificationsActive = $derived(isCurrentRoute(notificationsHref));
	const isMenuArea = $derived(
		isCurrentRoute(menuHref) ||
		isCurrentRoute(subscriptionsHref) ||
		isEditProfileRoute ||
		isSecurityRoute
	);
	const profileName = $derived(data.profileUser.displayName || data.profileUser.username);

	function isCurrentRoute(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

	<div class="profile-route-shell">
	<aside class="profile-sidebar" aria-label={m.profile_sidebar_label()}>
		<a class="profile-sidebar-media" href={profileHref} aria-label={m.profile_sidebar_profile()}>
			<span class="profile-sidebar-cover" aria-hidden="true">
				{#if data.profileUser.coverUrl}
					<img src={data.profileUser.coverUrl} alt="" />
				{/if}
			</span>
			<span class="profile-sidebar-avatar orbit-round-data">
				{#if data.profileUser.avatarUrl}
					<Picture
						src={data.profileUser.avatarUrl}
						type="profiles"
						sizes="(max-width: 699px) 44px, 64px"
						alt=""
						width={64}
						height={64}
						loading="eager"
						class="h-full w-full object-cover"
					/>
				{:else}
					<span>{profileName.charAt(0).toUpperCase()}</span>
				{/if}
			</span>
		</a>

		<nav class="profile-sidebar-nav" aria-label={m.profile_sidebar_label()}>
			<a
				class:active={isProfilePath}
				class="profile-sidebar-link touch-target"
				href={profileHref}
				aria-current={isProfilePath ? 'page' : undefined}
				title={m.profile_sidebar_profile()}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
					<circle cx="12" cy="8" r="4" />
					<path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
				</svg>
				<span>{m.profile_sidebar_profile()}</span>
			</a>

			<a
				class:active={isCurrentRoute(subscriptionsHref)}
				class="profile-sidebar-link touch-target"
				href={subscriptionsHref}
				aria-current={isCurrentRoute(subscriptionsHref) ? 'page' : undefined}
				title={m.subscriptions_nav()}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<path d="M3 9h18M7 15h3" />
				</svg>
				<span>{m.subscriptions_nav()}</span>
			</a>

			<a
				class:active={isCurrentRoute(notificationsHref)}
				class="profile-sidebar-link touch-target"
				href={notificationsHref}
				aria-current={isCurrentRoute(notificationsHref) ? 'page' : undefined}
				title={m.nav_notifications()}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
					<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
					<path d="M10 21h4" />
				</svg>
				<span>{m.nav_notifications()}</span>
			</a>

			<div class="profile-sidebar-group">
				<a
					class:active={isEditProfileRoute}
					class="profile-sidebar-link touch-target"
					href={editProfileHref}
					title={m.profile_nav_account()}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
						<circle cx="12" cy="12" r="9" />
						<path d="M8 9h8M8 13h8M8 17h5" />
					</svg>
					<span>{m.profile_nav_account()}</span>
				</a>

				<div class="profile-sidebar-subnav">
					<a
						class:active={isEditProfileRoute}
						class="profile-sidebar-link profile-sidebar-sublink touch-target"
						href={editProfileHref}
						aria-current={isEditProfileRoute ? 'page' : undefined}
						title={m.profile_edit()}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
							<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
							<path d="m14 7 3 3" />
						</svg>
						<span>{m.profile_edit()}</span>
					</a>

				</div>
			</div>

			<div class="profile-sidebar-group">
				<a class:active={isSecurityRoute} class="profile-sidebar-link touch-target" href={passwordHref} title={m.profile_security_section()}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.5-3.7" /></svg>
					<span>{m.profile_security_section()}</span>
				</a>
				<div class="profile-sidebar-subnav">
					<a class:active={isCurrentRoute(passwordHref)} class="profile-sidebar-link profile-sidebar-sublink touch-target" href={passwordHref} aria-current={isCurrentRoute(passwordHref) ? 'page' : undefined} title={m.profile_change_password_title()}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" /><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M12 15v2" /></svg>
						<span>{m.profile_change_password_title()}</span>
					</a>
					<a class:active={isCurrentRoute(sessionsHref)} class="profile-sidebar-link profile-sidebar-sublink touch-target" href={sessionsHref} aria-current={isCurrentRoute(sessionsHref) ? 'page' : undefined} title={m.profile_sessions_title()}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
						<span>{m.profile_sessions_title()}</span>
					</a>
				</div>
			</div>
		</nav>

		<a class="profile-sidebar-link profile-sidebar-home touch-target" href={homeHref} title={m.profile_back_home()}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
				<path d="m3 11 9-8 9 8" />
				<path d="M5 10v11h14V10M9 21v-7h6v7" />
			</svg>
			<span>{m.profile_back_home()}</span>
		</a>
	</aside>

	<nav class="profile-bottom-nav orbit-navigation fixed bottom-0 left-0 right-0 z-50" aria-label={m.profile_sidebar_label()}>
		<div class="shell-bottomnav safe-area-bottom">
			<div class="flex items-stretch px-0">
				<a
					class="orbit-nav-item group relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target"
					href={homeHref}
					data-sveltekit-preload-data="hover"
				>
					<div class="relative flex items-center justify-center">
						<div class="relative">
							<svg class="h-6 w-6 opacity-70 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
							</svg>
						</div>
					</div>
					<span class="zine-nav-label block max-w-full truncate text-center text-[10px] font-medium leading-none opacity-70">{m.nav_home()}</span>
					<div class="orbit-nav-indicator mt-0.5 h-px w-5" aria-hidden="true"></div>
				</a>

				<a
					class="orbit-nav-item group relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target {isMenuArea ? 'orbit-nav-active' : ''}"
					href={menuHref}
					data-sveltekit-preload-data="hover"
					aria-current={isMenuArea ? 'page' : undefined}
				>
					<div class="relative flex items-center justify-center">
						<div class="relative {isMenuArea ? 'zine-tilt' : ''}">
							<svg class="h-6 w-6 transition-all duration-300 {isMenuArea ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={isMenuArea ? '2.3' : '1.7'} aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
							</svg>
						</div>
					</div>
					<span class="zine-nav-label block max-w-full truncate text-center text-[10px] font-medium leading-none {isMenuArea ? 'font-semibold' : 'opacity-70'}">{m.nav_menus()}</span>
					<div class="orbit-nav-indicator mt-0.5 h-px w-5" aria-hidden="true"></div>
				</a>

				<a
					class="orbit-nav-item group relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target {notificationsActive ? 'orbit-nav-active' : ''}"
					href={notificationsHref}
					data-sveltekit-preload-data="hover"
					aria-current={notificationsActive ? 'page' : undefined}
				>
					<div class="relative flex items-center justify-center">
						<div class="relative {notificationsActive ? 'zine-tilt' : ''}">
							<svg class="h-6 w-6 transition-all duration-300 {notificationsActive ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" viewBox="0 0 24 24" fill={notificationsActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={notificationsActive ? '0' : '1.5'} aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
							</svg>
							<NotificationBadge count={unreadState.count} />
						</div>
					</div>
					<span class="zine-nav-label block max-w-full truncate text-center text-[10px] font-medium leading-none {notificationsActive ? 'font-semibold' : 'opacity-70'}">{m.nav_notifications()}</span>
					<div class="orbit-nav-indicator mt-0.5 h-px w-5" aria-hidden="true"></div>
				</a>

				<a
					class="orbit-nav-item group relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target {isProfilePath ? 'orbit-nav-active' : ''}"
					href={profileHref}
					data-sveltekit-preload-data="hover"
					aria-current={isProfilePath ? 'page' : undefined}
				>
					<div class="relative flex items-center justify-center">
						<div class="relative {isProfilePath ? 'zine-tilt' : ''}">
							<svg class="h-6 w-6 transition-all duration-300 {isProfilePath ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" viewBox="0 0 24 24" fill={isProfilePath ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isProfilePath ? '0' : '1.5'} aria-hidden="true">
								<circle cx="12" cy="8" r="4" />
								<path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
							</svg>
						</div>
					</div>
					<span class="zine-nav-label block max-w-full truncate text-center text-[10px] font-medium leading-none {isProfilePath ? 'font-semibold' : 'opacity-70'}">{m.profile_sidebar_profile()}</span>
					<div class="orbit-nav-indicator mt-0.5 h-px w-5" aria-hidden="true"></div>
				</a>
			</div>
		</div>
	</nav>

	<main class:contained={!isProfilePath} class="profile-route-content">
		{@render children()}
	</main>
</div>

<style>
	.profile-route-shell {
		min-height: 100dvh;
		padding-top: var(--pwa-safe-top, 0px);
		padding-bottom: var(--bottom-nav-reserved-space);
		background: var(--orbit-paper);
		color: var(--orbit-ink);
	}

	.profile-sidebar {
		display: none;
		position: sticky;
		top: var(--pwa-safe-top, 0px);
		min-width: 0;
		height: calc(100dvh - var(--pwa-safe-top, 0px));
		min-height: 24rem;
		flex-direction: column;
		overflow-x: clip;
		padding: 0;
		border-right: 1px solid var(--orbit-line);
		background: color-mix(in srgb, var(--orbit-surface) 86%, var(--orbit-paper));
	}

	.profile-sidebar-media {
		position: relative;
		display: block;
		height: 3.75rem;
		margin: 0 0 1.6rem;
		color: var(--orbit-ink);
		text-decoration: none;
	}

	.profile-sidebar-cover {
		display: block;
		height: 100%;
		overflow: hidden;
		background:
			radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--orbit-mint) 70%, transparent), transparent 34%),
			linear-gradient(125deg, var(--orbit-lavender), var(--orbit-coral-soft));
	}

	.profile-sidebar-cover img {
		display: block;
		height: 100%;
		width: 100%;
		max-width: 100%;
		object-fit: cover;
	}

	.profile-sidebar-avatar {
		position: absolute;
		bottom: -1.3rem;
		left: 50%;
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		overflow: hidden;
		border: 3px solid var(--orbit-surface);
		background: var(--orbit-coral-soft);
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
		transform: translateX(-50%);
	}

	.profile-sidebar-nav {
		display: grid;
	}

	.profile-sidebar-group,
	.profile-sidebar-subnav {
		display: grid;
	}

	.profile-sidebar-link {
		display: flex;
		min-width: 0;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.7rem;
		color: var(--orbit-muted);
		font-size: 0.88rem;
		font-weight: var(--orbit-font-label-weight);
		text-decoration: none;
		transition:
			background-color var(--orbit-motion-fast) var(--orbit-motion-ease),
			color var(--orbit-motion-fast) var(--orbit-motion-ease),
			transform var(--orbit-motion-fast) var(--orbit-motion-ease);
	}

	.profile-sidebar-link svg {
		width: 1.35rem;
		height: 1.35rem;
		flex: 0 0 auto;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.profile-sidebar-link span {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.profile-sidebar-link:hover {
		background: color-mix(in srgb, var(--orbit-coral) 9%, transparent);
		color: var(--orbit-coral-dark);
	}

	.profile-sidebar-link.active {
		background: color-mix(in srgb, var(--orbit-coral) 15%, var(--orbit-surface));
		color: var(--orbit-coral-dark);
	}

	.profile-sidebar-sublink {
		min-height: 2.75rem;
		color: color-mix(in srgb, var(--orbit-muted) 88%, transparent);
	}

	.profile-sidebar-sublink svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.profile-sidebar-home {
		margin-top: auto;
	}

	.profile-bottom-nav {
		display: block;
	}

	.profile-route-content {
		min-width: 0;
		padding: 0;
	}

	.profile-route-content.contained {
		width: 100%;
		max-width: calc(72rem + 2rem);
		margin-inline: auto;
		padding-inline: 1rem;
	}

	@media (min-width: 700px) {
		.profile-route-shell {
			display: grid;
			grid-template-columns: 15rem minmax(0, 1fr);
			padding-bottom: 0;
		}

		.profile-sidebar {
			display: flex;
		}

		.profile-bottom-nav {
			display: none;
		}

		.profile-sidebar-media {
			height: 5.25rem;
			margin-bottom: 2.25rem;
		}

		.profile-sidebar-avatar {
			bottom: -1.8rem;
			width: 4rem;
			height: 4rem;
			border-width: 4px;
		}

		.profile-sidebar-subnav {
			margin-left: 1.65rem;
			padding-left: 0.55rem;
			border-left: 1px solid color-mix(in srgb, var(--orbit-line) 72%, transparent);
		}

		.profile-sidebar-link {
			justify-content: flex-start;
			padding-inline: 1rem;
		}

		.profile-sidebar-link span {
			position: static;
			width: auto;
			height: auto;
			margin: 0;
			overflow: visible;
			clip: auto;
			white-space: normal;
		}

		.profile-sidebar-sublink {
			padding-inline: 0.75rem;
			font-size: 0.8rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.profile-sidebar-link {
			transition: none;
		}
	}
</style>
