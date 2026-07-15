<script lang="ts">
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import MomentFeed from '$lib/components/moments/MomentFeed.svelte';
	import { toProfileMoment } from '$lib/components/moments/types.js';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	const isThai = $derived(page.data.lang === 'th');
	const displayName = $derived(data.profile.displayName || data.profile.username);
	const initial = $derived(displayName.trim().charAt(0).toUpperCase() || '✦');
	const profileMoments = $derived(data.moments.map((moment) => toProfileMoment(moment, page.data.lang)));
	const nextLang = $derived(page.data.lang === 'th' ? 'en' : 'th');
	const alternateProfileHref = $derived(`${page.url.pathname.replace(/^\/(th|en)(?=\/|$)/, `/${nextLang}`)}${page.url.search}${page.url.hash}`);
	const copy = $derived(isThai
		? { settings: 'ตั้งค่า', edit: 'แก้ไขโปรไฟล์', home: 'กลับสู่หน้าหลัก', language: 'เปลี่ยนภาษา', logout: 'ออกจากระบบ' }
		: { settings: 'Settings', edit: 'Edit profile', home: 'Back to GL-Orbit', language: 'Change language', logout: 'Logout' });
	let settingsOpen = $state(false);
	let settingsRoot = $state<HTMLDivElement>();
	let settingsButton = $state<HTMLButtonElement>();
	let firstSettingsItem = $state<HTMLAnchorElement>();

	async function toggleSettings() {
		settingsOpen = !settingsOpen;
		if (settingsOpen) { await tick(); firstSettingsItem?.focus(); }
	}

	function closeSettings(returnFocus = false) {
		settingsOpen = false;
		if (returnFocus) settingsButton?.focus();
	}

	function handleWindowClick(event: MouseEvent) {
		if (settingsRoot && event.target instanceof Node && !settingsRoot.contains(event.target)) closeSettings();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && settingsOpen) closeSettings(true);
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<header class="border-b border-[#eee9ef] bg-white">
	<div class="relative">
		{#if data.profile.coverUrl}<img src={data.profile.coverUrl} alt="" class="h-28 w-full object-cover" />{:else}<div class="h-28 bg-[#f4edf4]"></div>{/if}
		<div bind:this={settingsRoot} class="absolute right-3 top-3 z-10">
			<button bind:this={settingsButton} type="button" onclick={toggleSettings} class="halo-focus-ring grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/50" aria-expanded={settingsOpen} aria-haspopup="menu" aria-controls="profile-settings-menu" aria-label={copy.settings}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20.3h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.55-1H5.4v-3h.13a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.55V4.7h3v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1h.09v3h-.09a1.7 1.7 0 0 0-1.55 1Z" /></svg>
			</button>
			{#if settingsOpen}
				<div id="profile-settings-menu" role="menu" aria-label={copy.settings} class="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-[#eee9ef] bg-white p-1.5 shadow-[0_14px_36px_rgba(45,27,46,0.16)]">
					<a bind:this={firstSettingsItem} href={`/${data.lang}/`} role="menuitem" onclick={() => closeSettings()} class="halo-focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-plum transition hover:bg-lavender/15">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 10.8 8.5-7 8.5 7v8.7a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" /></svg>
						{copy.home}
					</a>
					<a href={`/${data.lang}/profile`} role="menuitem" onclick={() => closeSettings()} class="halo-focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-plum transition hover:bg-lavender/15">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
						{copy.edit}
					</a>
					<a href={alternateProfileHref} role="menuitem" onclick={() => closeSettings()} class="halo-focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-plum transition hover:bg-lavender/15">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.4 8.8 12S9.9 5.8 12 3.5Z" /></svg>
						{copy.language}
					</a>
					<form method="POST" action={`/${data.lang}/logout`}><button type="submit" role="menuitem" class="halo-focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-coral-dark transition hover:bg-coral/10">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 5V3.8A1.8 1.8 0 0 0 12.2 2H5.8A1.8 1.8 0 0 0 4 3.8v16.4A1.8 1.8 0 0 0 5.8 22h6.4a1.8 1.8 0 0 0 1.8-1.8V19M10 12h10m-3-3 3 3-3 3" /></svg>
						{copy.logout}
					</button></form>
				</div>
			{/if}
		</div>
	</div>
	<div class="px-4 pb-4 sm:px-5">
		<div class="-mt-10 flex items-end">{#if data.profile.avatarUrl}<img src={data.profile.avatarUrl} alt="" class="relative z-10 h-20 w-20 rounded-full border-4 border-white object-cover" />{:else}<div class="relative z-10 grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-coral/20 text-xl font-bold text-coral-dark">{initial}</div>{/if}</div>
		<h1 class="mt-3 font-display text-xl font-extrabold">{displayName}</h1><p class="text-sm text-plum-light">@{data.profile.username}</p>
	</div>
	<div class="grid grid-cols-3 border-t border-[#eee9ef] text-center text-sm font-bold">
		<div class="relative py-3">Moments<span class="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-coral"></span></div>
		<div class="py-3 text-plum-light">Media</div>
		<div class="py-3 text-plum-light">Links</div>
	</div>
</header>
<MomentFeed moments={profileMoments} initialCursor={data.nextCursor} authorId={data.profile.id} />
