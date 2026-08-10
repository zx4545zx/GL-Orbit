<script lang="ts">
	import { page } from '$app/state';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';

	const menuItems = $derived([
		{
			href: localizedHref('/settings/ai', page.data.lang),
			title: m.ai_settings_title(),
			description: m.ai_settings_description(),
			icon: 'ai'
		},
		{
			href: localizedHref('/subscriptions', page.data.lang),
			title: m.subscriptions_nav(),
			description: m.subscriptions_subtitle(),
			icon: 'subscriptions'
		},
		{
			href: localizedHref('/account/profile', page.data.lang),
			title: m.profile_edit(),
			description: m.profile_profile_section_desc(),
			icon: 'profile'
		},
		{
			href: localizedHref('/security/password', page.data.lang),
			title: m.profile_change_password_title(),
			description: m.profile_security_section_desc(),
			icon: 'password'
		},
		{
			href: localizedHref('/security/session', page.data.lang),
			title: m.profile_sessions_title(),
			description: m.profile_menu_sessions_desc(),
			icon: 'sessions'
		}
	]);
</script>

<svelte:head>
	<title>{m.nav_menus()} | GL Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="grid w-full gap-4 pb-24 pt-5 sm:pt-8 md:pb-12" aria-labelledby="member-menu-heading">
	<MemberPageHeader
		title={m.nav_menus()}
		description={m.profile_menu_description()}
		headingId="member-menu-heading"
	/>

	<nav class="member-menu-list" aria-label={m.nav_menus()}>
		{#each menuItems as item (item.href)}
			<a class="member-menu-item orbit-control touch-target" href={item.href}>
				<span class="member-menu-icon" aria-hidden="true">
					{#if item.icon === 'subscriptions'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h3" /></svg>
					{:else if item.icon === 'profile'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m14 7 3 3" /></svg>
					{:else if item.icon === 'password'}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 11V8a5 5 0 0 1 10 0v3" /><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M12 15v2" /></svg>
			{:else if item.icon === 'ai'}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h.01M15 9h.01M9 15h6" /></svg>
			{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
					{/if}
				</span>
				<span class="member-menu-copy">
					<strong>{item.title}</strong>
					<small>{item.description}</small>
				</span>
				<span class="member-menu-arrow" aria-hidden="true">
					<OrbitIcon name="arrow-right" className="h-5 w-5" />
				</span>
			</a>
		{/each}
	</nav>
</section>

<style>
	.member-menu-list {
		display: grid;
		gap: 0.75rem;
	}

	.member-menu-item {
		display: grid;
		min-height: 5rem;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		color: var(--orbit-ink);
		text-decoration: none;
	}

	.member-menu-item:hover {
		background: var(--orbit-coral-soft);
	}

	.member-menu-icon {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		background: var(--orbit-paper-deep);
		color: var(--orbit-coral-dark);
	}

	.member-menu-icon svg {
		width: 1.35rem;
		height: 1.35rem;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.member-menu-copy {
		display: grid;
		gap: 0.2rem;
	}

	.member-menu-copy strong {
		font-family: var(--orbit-font-display);
		font-size: 1rem;
	}

	.member-menu-copy small {
		color: var(--orbit-muted);
		font-size: 0.78rem;
		line-height: 1.4;
	}

	.member-menu-arrow {
		color: var(--orbit-coral-dark);
		font-size: 1.25rem;
	}
</style>
