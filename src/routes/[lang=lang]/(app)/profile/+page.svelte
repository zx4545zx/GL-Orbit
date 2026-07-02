<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';
	import { localizedHref } from '$lib/i18n/link.js';	import { goto, invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import type { PageData } from './$types.js';
	import type {
		ProfileResponse,
		ProfileUpdateResponse,
		ApiErrorResponse,
		FavoriteSeriesItem,
		WatchedSeriesItem
	} from '$lib/types.js';

	let { data }: { data: PageData } = $props();

	let loadingProfilePage = $state(false);
	let pageError = $state('');
	let updatedProfileUser = $state<ProfileResponse['user'] | null>(null);
	const profileUser = $derived(updatedProfileUser ?? data.profileUser);
	const favoriteSeries = $derived<ProfileResponse['favoriteSeries']>(data.favoriteSeries);
	const watchedSeries = $derived<ProfileResponse['watchedSeries']>(data.watchedSeries);

	// Navigation state — tabs replace the giant vertical scroll
	let activeTab = $state<'library' | 'account'>('library');
	let libraryView = $state<'favorite' | 'watched'>('favorite');
	let accountSection = $state<'account' | 'profile' | 'security'>('account');

	const dateLocale = $derived(page.data.lang === 'th' ? 'th-TH' : 'en-US');
	const profileTabs = $derived([
		{ id: 'library', label: m.profile_library_tab(), icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
		{ id: 'account', label: m.profile_account_tab(), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
	]);
	const accountSections = $derived([
		{ id: 'account', label: m.profile_account_tab(), desc: m.profile_account_section_desc(), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ id: 'profile', label: m.profile_profile_section(), desc: m.profile_profile_section_desc(), icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
		{ id: 'security', label: m.profile_security_section(), desc: m.profile_security_section_desc(), icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
	] as { id: 'account' | 'profile' | 'security'; label: string; desc: string; icon: string }[]);

	let isLoadingProfile = $state(false);
	let isLoadingPassword = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	let displayName = $state('');
	let avatarUrl = $state('');
	let coverUrl = $state('');

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');

	// Auto-dismiss success/error after a few seconds
	$effect(() => {
		if (!successMessage && !errorMessage) return;
		const timer = setTimeout(() => {
			successMessage = '';
			errorMessage = '';
		}, 4000);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		updatedProfileUser = null;
		displayName = data.profileUser.displayName ?? '';
		avatarUrl = data.profileUser.avatarUrl ?? '';
		coverUrl = data.profileUser.coverUrl ?? '';
		loadingProfilePage = false;
		pageError = '';
	});

	async function handleUpdateProfile(e: Event) {
		e.preventDefault();
		isLoadingProfile = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, avatarUrl, coverUrl })
			});
			if (res.status === 401) { goto(localizedHref('/login', page.data.lang)); return; }
			if (!res.ok) {
				const data = await res.json() as ApiErrorResponse;
				errorMessage = data.error || m.profile_update_error();
				return;
			}
			const data: ProfileUpdateResponse = await res.json();
			updatedProfileUser = data.user;
			successMessage = data.message;
			await invalidateAll();
		} catch {
			errorMessage = m.profile_update_error();
		} finally {
			isLoadingProfile = false;
		}
	}

	async function handleChangePassword(e: Event) {
		e.preventDefault();
		isLoadingPassword = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/profile/password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
			});
			if (res.status === 401) { goto(localizedHref('/login', page.data.lang)); return; }
			if (!res.ok) {
				const data = await res.json() as ApiErrorResponse;
				errorMessage = data.error || m.profile_password_error();
				return;
			}
			const data = await res.json() as { success: true; message: string };
			successMessage = data.message;
			currentPassword = '';
			newPassword = '';
			confirmNewPassword = '';
		} catch {
			errorMessage = m.profile_password_error();
		} finally {
			isLoadingPassword = false;
		}
	}
</script>

<svelte:head>
	<title>{m.profile_seo_title()}</title>
	<meta name="description" content={m.profile_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#snippet seriesCard(s: FavoriteSeriesItem | WatchedSeriesItem)}
	<a href="/{page.data.lang}/series/{s.id}" class="group block">
		<div class="glass-card rounded-2xl overflow-hidden hover:shadow-2xl {libraryView === 'watched' ? 'hover:shadow-mint/25' : 'hover:shadow-lavender/25'} transition-all duration-500 hover:-translate-y-1">
			<div class="relative aspect-[3/4] overflow-hidden">
				<img
					src={s.poster}
					alt={s.title}
					width={400}
					height={533}
					class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
					loading="lazy"
					decoding="async"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-plum/90 via-plum/10 to-transparent"></div>
				<div class="absolute top-2.5 left-2.5">
					<span class="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md {s.status === 'ONGOING' ? 'bg-mint/25 text-mint-dark' : s.status === 'UPCOMING' ? 'bg-lavender/25 text-lavender-dark' : 'bg-coral/15 text-coral-dark'}">
						{s.status === 'ONGOING' ? m.status_ongoing() : s.status === 'UPCOMING' ? m.status_upcoming() : m.status_ended()}
					</span>
				</div>
				<div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
					<p class="text-white/70 text-[10px] sm:text-xs mb-0.5">{s.studio}</p>
					<h3 class="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2">{s.title}</h3>
					{#if s.subtitle}
						<p class="text-white/80 text-[10px] sm:text-xs mt-0.5 line-clamp-1">{s.subtitle}</p>
					{/if}
				</div>
			</div>
		</div>
	</a>
{/snippet}

{#snippet emptyState(icon: 'fav' | 'watch', title: string, desc: string, href: string)}
	<div class="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center" in:fly={{ y: 8, duration: 200 }}>
		<div class="w-16 h-16 rounded-2xl {icon === 'watch' ? 'bg-mint/10' : 'bg-coral/10'} flex items-center justify-center mx-auto mb-4">
			{#if icon === 'watch'}
				<svg class="w-8 h-8 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			{:else}
				<svg class="w-8 h-8 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
			{/if}
		</div>
		<h3 class="font-semibold text-plum mb-1">{title}</h3>
		<p class="text-sm text-plum-light mb-4">{desc}</p>
		<a href={href} class="inline-flex px-6 py-2.5 rounded-xl {icon === 'watch' ? 'bg-gradient-to-r from-mint to-mint-dark text-plum' : 'bg-gradient-to-r from-coral to-coral-dark text-white'} font-semibold shadow-lg {icon === 'watch' ? 'shadow-mint/25' : 'shadow-coral/25'} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm touch-target">
			{m.profile_view_all_series()}
		</a>
	</div>
{/snippet}

<div class="py-4 sm:py-6 pb-8">
	<div class="max-w-5xl mx-auto px-3 sm:px-6">
		{#if loadingProfilePage}
			<!-- Loading state -->
			<div class="glass-card rounded-3xl overflow-hidden">
				<div class="h-40 sm:h-56 bg-lavender/10 animate-pulse"></div>
				<div class="px-6 pb-6">
					<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-cream -mt-12 sm:-mt-16 p-1.5">
						<div class="w-full h-full rounded-full bg-lavender/10 animate-pulse"></div>
					</div>
					<div class="h-7 w-48 rounded-lg bg-lavender/10 animate-pulse mt-4 mb-2"></div>
					<div class="h-4 w-36 rounded-lg bg-lavender/10 animate-pulse"></div>
				</div>
			</div>
		{:else if pageError}
			<div class="glass-card rounded-2xl p-8 text-center">
				<p class="text-coral">{pageError}</p>
				<button onclick={() => window.location.reload()} class="mt-4 px-6 py-2 rounded-xl bg-coral/10 text-coral-dark font-medium touch-target">
					{m.profile_retry()}
				</button>
			</div>
		{:else if profileUser}
			<!-- ================= FACEBOOK-STYLE PROFILE CARD ================= -->
			<div class="glass-card rounded-3xl overflow-hidden animate-slide-up">
				<!-- COVER -->
				<div class="relative h-36 sm:h-52 md:h-60 lg:h-72 bg-gradient-to-br from-lavender/40 via-coral/20 to-mint/30 overflow-hidden">
					{#if profileUser.coverUrl}
						<img
							src={profileUser.coverUrl}
							alt=""
							class="absolute inset-0 w-full h-full object-cover"
							loading="eager"
							decoding="async"
						/>
					{:else}
						<!-- Decorative mesh when no cover set -->
						<div class="absolute inset-0 bg-gradient-mesh"></div>
						<div class="absolute inset-0 noise-overlay"></div>
						<!-- Floating decorative blobs -->
						<div class="absolute top-6 left-8 w-24 h-24 rounded-full bg-coral/20 blur-2xl animate-float"></div>
						<div class="absolute bottom-4 right-12 w-32 h-32 rounded-full bg-lavender/20 blur-3xl animate-float-delayed"></div>
						<div class="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-mint/20 blur-2xl animate-float float-delay-profile"></div>
					{/if}
					<!-- bottom fade into card -->
					<div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/50 to-transparent pointer-events-none"></div>
				</div>

				<!-- IDENTITY ROW: avatar (overlap up) + name + actions -->
				<div class="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5">
					<div class="flex flex-col items-center sm:flex-row sm:items-end sm:justify-between gap-4">
						<!-- Avatar overlapping the cover -->
						<div class="relative -mt-14 sm:-mt-20 md:-mt-24">
							<div class="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full p-1.5 sm:p-2 bg-cream shadow-xl">
								<div class="w-full h-full rounded-full overflow-hidden bg-cream">
									{#if profileUser.avatarUrl}
										<img src={profileUser.avatarUrl} alt="" width={160} height={160} loading="eager" decoding="async" class="w-full h-full object-cover" />
									{:else}
										<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-coral/20 to-lavender/20">
											<span class="text-4xl sm:text-5xl md:text-6xl font-bold text-coral-dark font-[family-name:var(--font-display)]">
												{(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
											</span>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Action button (desktop: inline, mobile: full width below) -->
						<div class="w-full sm:w-auto flex gap-2 sm:pb-2">
							<button
								onclick={() => { activeTab = 'account'; accountSection = 'profile'; }}
								class="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm touch-target flex items-center justify-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
								{m.profile_edit()}
							</button>
						</div>
					</div>

					<!-- Name + role -->
					<div class="mt-3 text-center sm:text-left">
						<div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
							<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum">
								{profileUser.displayName || profileUser.username}
							</h1>
							{#if profileUser.role === 'ADMIN'}
								<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white shrink-0" title={m.profile_admin_badge()}>
									<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
								</span>
							{/if}
						</div>
						<p class="text-sm text-plum-light mt-0.5">{profileUser.email}</p>
					</div>

					<!-- STATS ROW -->
					<div class="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5">
						<div class="glass-card-strong rounded-2xl p-3 sm:p-4 text-center">
							<div class="flex items-center justify-center mb-1.5 text-coral-dark">
								<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
							</div>
							<div class="text-xl sm:text-2xl font-bold text-plum font-[family-name:var(--font-display)]">{favoriteSeries.length}</div>
							<div class="text-[11px] sm:text-xs text-plum-light">{m.profile_favorites_label()}</div>
						</div>
						<div class="glass-card-strong rounded-2xl p-3 sm:p-4 text-center">
							<div class="flex items-center justify-center mb-1.5 text-mint-dark">
								<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							</div>
							<div class="text-xl sm:text-2xl font-bold text-plum font-[family-name:var(--font-display)]">{watchedSeries.length}</div>
							<div class="text-[11px] sm:text-xs text-plum-light">{m.profile_watched_label()}</div>
						</div>
						<div class="glass-card-strong rounded-2xl p-3 sm:p-4 text-center">
							<div class="flex items-center justify-center mb-1.5 text-lavender-dark">
								<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
							</div>
							<div class="text-xl sm:text-2xl font-bold text-plum font-[family-name:var(--font-display)]">{new Date(profileUser.createdAt).getFullYear()}</div>
							<div class="text-[11px] sm:text-xs text-plum-light">{m.profile_member_since()}</div>
						</div>
					</div>
				</div>

				<!-- STICKY TAB BAR (Facebook-style underline tabs) -->
				<div class="border-t border-lavender/15 px-2 sm:px-6">
					<div class="flex gap-1 sm:gap-2 relative">
						{#each profileTabs as tab}
							<button
								onclick={() => (activeTab = tab.id as 'library' | 'account')}
								aria-pressed={activeTab === tab.id}
								class="relative flex-1 sm:flex-none sm:px-8 py-3.5 text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2 touch-target {activeTab === tab.id ? 'text-coral-dark' : 'text-plum-light hover:text-plum'}"
							>
								<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} /></svg>
								{tab.label}
								<!-- underline indicator -->
								<span class="absolute bottom-0 left-2 sm:left-8 right-2 sm:right-8 h-0.5 rounded-full bg-gradient-to-r from-coral to-coral-dark transition-all duration-300 {activeTab === tab.id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}"></span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- TOAST MESSAGES -->
			<div class="mt-4">
				{#if successMessage}
					<div class="p-3 rounded-xl bg-mint/10 border border-mint/30 text-mint-dark text-sm text-center flex items-center justify-center gap-2" in:fly={{ y: -10, duration: 250 }}>
						<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
						{successMessage}
					</div>
				{/if}
				{#if errorMessage}
					<div class="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral-dark text-sm text-center flex items-center justify-center gap-2" in:fly={{ y: -10, duration: 250 }}>
						<svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
						{errorMessage}
					</div>
				{/if}
			</div>

			<!-- ================= TAB CONTENT ================= -->
			<div class="mt-4">
				{#if activeTab === 'library'}
					<div in:fly={{ y: 8, duration: 250 }}>
						<!-- Sub-toggle: Favorite / Watched -->
						<div class="relative grid grid-cols-2 p-1 rounded-xl bg-white/50 backdrop-blur-md border border-white/50 mb-5 max-w-xs mx-auto">
							<div
								class="absolute top-1 bottom-1 left-1 rounded-lg transition-all duration-300 ease-out library-toggle-indicator {libraryView === 'favorite' ? 'bg-coral/15 shadow-sm translate-x-0' : 'bg-mint/20 shadow-sm translate-x-full'}"
							></div>
							<button
								onclick={() => (libraryView = 'favorite')}
								class="relative z-10 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 touch-target {libraryView === 'favorite' ? 'text-coral-dark' : 'text-plum-light'}"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
								{m.profile_favorites_label()}
							</button>
							<button
								onclick={() => (libraryView = 'watched')}
								class="relative z-10 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 touch-target {libraryView === 'watched' ? 'text-mint-dark' : 'text-plum-light'}"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
								{m.profile_watched_label()}
							</button>
						</div>

						{#if libraryView === 'favorite'}
							{#if favoriteSeries.length > 0}
								<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" in:fly={{ y: 8, duration: 200 }}>
									{#each favoriteSeries as s (s.id)}
										{@render seriesCard(s)}
									{/each}
								</div>
							{:else}
								{@render emptyState('fav', m.profile_empty_favorites_title(), m.profile_empty_favorites_desc(), localizedHref('/series', page.data.lang))}
							{/if}
						{:else}
							{#if watchedSeries.length > 0}
								<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" in:fly={{ y: 8, duration: 200 }}>
									{#each watchedSeries as s (s.id)}
										{@render seriesCard(s)}
									{/each}
								</div>
							{:else}
								{@render emptyState('watch', m.profile_empty_watched_title(), m.profile_empty_watched_desc(), localizedHref('/series', page.data.lang))}
							{/if}
						{/if}
					</div>
				{:else}
					<!-- TAB: ACCOUNT (settings sidebar) -->
					<div in:fly={{ y: 8, duration: 250 }} class="lg:grid lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-6">
						<!-- SIDEBAR: section nav + account actions -->
						<aside class="lg:sticky lg:top-24 lg:self-start mb-4 lg:mb-0 space-y-3">
							<nav class="glass-card rounded-2xl sm:rounded-3xl p-2 grid grid-cols-3 lg:grid-cols-1 gap-1">
								{#each accountSections as section}
									<button
										onclick={() => { accountSection = section.id; }}
										aria-pressed={accountSection === section.id}
										title={section.label}
										class="relative flex flex-col lg:flex-row items-center lg:items-center justify-center gap-1.5 lg:gap-3 p-2.5 lg:p-3 rounded-xl text-center lg:text-left transition-all duration-200 touch-target {accountSection === section.id ? 'bg-coral/10 text-coral-dark' : 'text-plum-light hover:bg-white/50 hover:text-plum'}"
									>
										<span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 {accountSection === section.id ? 'bg-coral/15' : 'bg-lavender/10'}">
											<svg class="w-5 h-5 {accountSection === section.id ? 'text-coral-dark' : 'text-lavender-dark'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={section.icon} /></svg>
										</span>
										<span class="flex-1 min-w-0 w-full lg:w-auto">
											<span class="block text-xs lg:text-sm font-semibold truncate">{section.label}</span>
											<span class="hidden lg:block text-xs {accountSection === section.id ? 'text-coral-dark/70' : 'text-plum-light/70'} truncate">{section.desc}</span>
										</span>
									</button>
								{/each}
							</nav>

						</aside>

						<!-- MAIN: active section content -->
						<div class="space-y-3">
							{#if accountSection === 'account'}
								<div in:fly={{ y: 8, duration: 200 }} class="space-y-3">
									<!-- read-only account info -->
									<div class="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6">
										<div class="flex items-center gap-2 mb-4">
											<svg class="w-4 h-4 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
											<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{m.profile_account_section()}</h2>
										</div>
										<div class="space-y-3">
											<div class="flex items-center justify-between gap-3 pb-3 border-b border-lavender/10">
												<span class="text-sm text-plum-light shrink-0">{m.profile_username()}</span>
												<span class="text-sm font-medium text-plum text-right truncate">{profileUser.username}</span>
											</div>
											<div class="flex items-center justify-between gap-3 pb-3 border-b border-lavender/10">
												<span class="text-sm text-plum-light shrink-0">{m.profile_email()}</span>
												<span class="text-sm font-medium text-plum text-right truncate">{profileUser.email}</span>
											</div>
											<div class="flex items-center justify-between gap-3 pb-3 border-b border-lavender/10">
												<span class="text-sm text-plum-light shrink-0">{m.profile_display_name()}</span>
												<span class="text-sm font-medium text-plum text-right truncate">{profileUser.displayName || '-'}</span>
											</div>
											<div class="flex items-center justify-between gap-3">
												<span class="text-sm text-plum-light shrink-0">{m.profile_joined_on()}</span>
												<span class="text-sm font-medium text-plum text-right">{new Date(profileUser.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
											</div>
										</div>
									</div>
							</div>
						{:else if accountSection === 'profile'}
							<div in:fly={{ y: 8, duration: 200 }} class="space-y-3">
								<!-- edit profile form -->
									<div class="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6">
										<div class="flex items-center gap-2 mb-4">
											<span class="w-8 h-8 rounded-lg bg-coral/10 flex items-center justify-center"><svg class="w-4 h-4 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></span>
											<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{m.profile_edit()}</h2>
										</div>
										<form onsubmit={handleUpdateProfile} class="space-y-4">
											<div>
												<label for="displayName" class="block text-sm font-medium text-plum mb-1.5">{m.profile_display_name()}</label>
												<input id="displayName" name="displayName" type="text" bind:value={displayName} placeholder={m.profile_display_name_placeholder()} class="w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target" />
											</div>
											<div>
												<label for="avatarUrl" class="block text-sm font-medium text-plum mb-1.5">{m.profile_avatar_url()}</label>
												<input id="avatarUrl" name="avatarUrl" type="url" bind:value={avatarUrl} placeholder="https://example.com/avatar.jpg" class="w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target" />
											</div>
											<div>
												<label for="coverUrl" class="block text-sm font-medium text-plum mb-1.5">{m.profile_cover_url()} <span class="text-plum-light font-normal">({m.profile_cover_url_hint()})</span></label>
												<input id="coverUrl" name="coverUrl" type="url" bind:value={coverUrl} placeholder="https://example.com/cover.jpg" class="w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target" />
												{#if coverUrl}
													<div class="mt-2 rounded-xl overflow-hidden border border-lavender/20 aspect-[3/1]"><img src={coverUrl} alt={m.profile_cover_preview_alt()} class="w-full h-full object-cover" loading="lazy" decoding="async" /></div>
												{/if}
											</div>
											<button type="submit" disabled={isLoadingProfile} class="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 text-sm sm:text-base touch-target flex items-center justify-center gap-2">
												{#if isLoadingProfile}
													<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
													{m.profile_saving()}
												{:else}
													{m.profile_save_profile()}
												{/if}
											</button>
										</form>
									</div>
								</div>
							{:else}
								<div in:fly={{ y: 8, duration: 200 }} class="space-y-3">
									<!-- change password form -->
									<div class="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6">
										<div class="flex items-center gap-2 mb-4">
											<span class="w-8 h-8 rounded-lg bg-lavender/10 flex items-center justify-center"><svg class="w-4 h-4 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
											<h2 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{m.profile_change_password_title()}</h2>
										</div>
										<form onsubmit={handleChangePassword} class="space-y-4">
											<PasswordInput id="currentPassword" name="currentPassword" bind:value={currentPassword} label={m.profile_current_password()} />
											<PasswordInput id="newPassword" name="newPassword" bind:value={newPassword} label={m.profile_new_password()} placeholder={m.profile_new_password_placeholder()} minlength={6} />
											<PasswordInput id="confirmPassword" name="confirmPassword" bind:value={confirmNewPassword} label={m.profile_confirm_new_password()} />
											<button type="submit" disabled={isLoadingPassword} class="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 text-sm sm:text-base touch-target flex items-center justify-center gap-2">
												{#if isLoadingPassword}
													<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
													{m.profile_saving()}
												{:else}
													{m.profile_change_password()}
												{/if}
											</button>
										</form>
									</div>
								</div>
							{/if}
						</div>

					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
