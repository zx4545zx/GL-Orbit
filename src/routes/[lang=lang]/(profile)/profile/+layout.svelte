<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { LayoutData } from './$types.js';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const editProfileHref = $derived(localizedHref('/account/profile', page.data.lang));
	const name = $derived(data.profileUser.displayName || data.profileUser.username);
</script>

<div class="profile-shell">
	<header class="profile-hero">
		<div class="profile-cover" aria-hidden="true">
			{#if data.profileUser.coverUrl}
				<img src={data.profileUser.coverUrl} alt="" />
			{/if}
		</div>

		<div class="profile-summary">
			<div class="profile-avatar orbit-round-data">
				{#if data.profileUser.avatarUrl}
					<Picture
						src={data.profileUser.avatarUrl}
						type="profiles"
						sizes="(max-width: 640px) 96px, 136px"
						alt=""
						width={136}
						height={136}
						loading="eager"
						class="h-full w-full object-cover"
					/>
				{:else}
					<span>{name.charAt(0).toUpperCase()}</span>
				{/if}
			</div>

			<div class="profile-identity">
				<h1>{name}</h1>
				<p>@{data.profileUser.username}</p>
				<dl class="profile-stats">
					<div><dd>{data.favoriteCount}</dd><dt>{m.profile_favorites_label()}</dt></div>
					<div><dd>{data.watchedCount}</dd><dt>{m.profile_watched_label()}</dt></div>
					<div><dd>{new Date(data.profileUser.createdAt).getFullYear()}</dd><dt>{m.profile_member_since()}</dt></div>
				</dl>
			</div>

			<a
				class="orbit-action touch-target profile-edit"
				href={editProfileHref}
			>
				{m.profile_edit()}
			</a>
		</div>
	</header>

	<main class="profile-content">{@render children()}</main>
</div>

<style>
	.profile-shell {
		width: 100%;
		margin: 0;
		padding: 0;
	}

	.profile-hero {
		container-name: profile-hero;
		container-type: inline-size;
		background: var(--orbit-surface);
	}

	.profile-cover {
		height: clamp(8.5rem, 24vw, 17rem);
		overflow: hidden;
		border-radius: 0 !important;
		background:
			radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--orbit-mint) 70%, transparent), transparent 34%),
			linear-gradient(125deg, var(--orbit-lavender), var(--orbit-coral-soft));
	}

	.profile-cover img {
		height: 100%;
		width: 100%;
		border-radius: 0 !important;
		object-fit: cover;
	}

	.profile-summary {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: end;
		gap: 1rem;
		padding: 0 1rem 1.25rem;
	}

	.profile-avatar {
		display: grid;
		width: clamp(6rem, 14vw, 8.5rem);
		aspect-ratio: 1;
		place-items: center;
		margin-top: clamp(-4.25rem, -7vw, -3rem);
		overflow: hidden;
		border: 5px solid var(--orbit-surface);
		background: var(--orbit-coral-soft);
		color: var(--orbit-coral-dark);
		font-family: var(--orbit-font-display);
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: var(--orbit-font-heading-weight);
		box-shadow: var(--orbit-shadow-raised);
	}

	.profile-identity {
		min-width: 0;
		padding-top: 0.85rem;
	}

	.profile-identity h1 {
		overflow-wrap: anywhere;
		font-family: var(--orbit-font-display);
		font-size: clamp(1.45rem, 4vw, 2.4rem);
		font-weight: var(--orbit-font-heading-weight);
		line-height: 1.1;
	}

	.profile-identity > p {
		margin-top: 0.2rem;
		color: var(--orbit-muted);
		font-size: 0.85rem;
	}

	.profile-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1rem;
		margin-top: 0.85rem;
	}

	.profile-stats div {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}

	.profile-stats dd {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight);
	}

	.profile-stats dt {
		color: var(--orbit-muted);
		font-size: 0.72rem;
	}

	.profile-edit {
		grid-column: 1 / -1;
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.25rem;
		font-size: 0.875rem;
		text-decoration: none;
	}

	:global([data-theme='y2k']) .profile-identity h1 {
		font-size: clamp(1.05rem, 4vw, 2rem);
	}

	@container profile-hero (max-width: 24rem) {
		.profile-summary {
			grid-template-columns: 1fr;
			align-items: start;
			gap: 0.75rem;
		}

		.profile-identity {
			padding-top: 0;
		}

		.profile-edit {
			width: 100%;
		}
	}

	@media (min-width: 640px) {
		.profile-summary {
			grid-template-columns: auto minmax(0, 1fr) auto;
			align-items: center;
			gap: 1.5rem;
			padding-inline: 1.75rem;
		}

		.profile-edit {
			grid-column: 3;
			min-width: 8.5rem;
		}
	}
</style>
