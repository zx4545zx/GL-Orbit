<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { tick } from 'svelte';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import type { LayoutData } from './$types.js';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
	const base = $derived(`/${page.data.lang}/halo`);
	const user = $derived(page.data.user);
	const items = $derived([
		{ href: base, label: page.data.lang === 'th' ? 'หน้าแรก' : 'Home', icon: 'home' },
		{ href: `${base}/explore`, label: m.halo_explore(), icon: 'explore' },
		{ href: `${base}/saved`, label: m.halo_saved(), icon: 'bookmark' },
		{ href: `${base}/notifications`, label: m.halo_alerts(), icon: 'bell' },
		{ href: `${base}/profile/moments`, label: m.halo_profile(), icon: 'user' }
	]);
	const mobileItems = $derived([items[0], items[1], items[3], items[4]]);
	const isActive = (href: string) => page.url.pathname === href || (href !== base && page.url.pathname.startsWith(`${href}/`));
	const nextLang = $derived(page.data.lang === 'th' ? 'en' : 'th');
	const alternateHaloHref = $derived(`${page.url.pathname.replace(/^\/(th|en)(?=\/|$)/, `/${nextLang}`)}${page.url.search}${page.url.hash}`);
	const copy = $derived(page.data.lang === 'th'
		? { settings: 'ตั้งค่า', home: 'กลับสู่หน้าหลัก', language: 'เปลี่ยนภาษา', logout: 'ออกจากระบบ' }
		: { settings: 'Settings', home: 'Back to GL-Orbit', language: 'Change language', logout: 'Logout' });
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

<div class="halo-universe min-h-dvh text-plum">
	<div class="mx-auto grid max-w-[1265px] grid-cols-1 md:grid-cols-[210px_minmax(0,620px)] lg:grid-cols-[230px_minmax(0,620px)_350px]">
		<aside class="sticky top-[var(--pwa-safe-top)] hidden h-dvh px-3 py-3 md:block">
			<div class="flex h-full flex-col items-start">
				<a href={base} class="halo-focus-ring mb-4 flex items-center gap-3 rounded-full px-2 py-2 pr-4 transition hover:bg-coral/[.08]" aria-label="Orbit Halo">
					<img src="/icons/gl-orbit-logo.svg" alt="" width="38" height="38" class="h-[38px] w-[38px] shrink-0 rounded-xl object-contain" />
					<span class="min-w-0 font-display text-base font-extrabold leading-tight tracking-tight">Orbit Halo</span>
				</a>
				<nav class="w-full" aria-label="Orbit Halo">
					<div class="space-y-1">
						{#each items as item}
							<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} class="halo-focus-ring flex w-fit max-w-full items-center gap-4 rounded-full px-3 py-3 text-[15px] transition hover:bg-plum/[.055] {isActive(item.href) ? 'font-bold text-plum' : 'font-medium text-plum'}">
								<HaloIcon name={item.icon} size={22} strokeWidth={isActive(item.href) ? 2.2 : 1.8} /><span class="truncate">{item.label}</span>
							</a>
						{/each}
					</div>
					<a href={`${base}/compose`} class="halo-focus-ring mt-4 flex w-full max-w-[190px] items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-bold text-white transition hover:bg-coral-dark">{m.halo_create()}</a>
				</nav>
				<div class="relative mt-auto" bind:this={settingsRoot}>
					<button bind:this={settingsButton} type="button" onclick={toggleSettings} class="halo-focus-ring flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-plum-light transition hover:bg-plum/[.05] hover:text-plum" aria-expanded={settingsOpen} aria-haspopup="menu" aria-controls="halo-settings-menu">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20.3h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.55-1H5.4v-3h.13a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.55V4.7h3v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1h.09v3h-.09a1.7 1.7 0 0 0-1.55 1Z" /></svg>
						{copy.settings}
					</button>
					{#if settingsOpen}
						<div id="halo-settings-menu" role="menu" aria-label={copy.settings} class="absolute bottom-full left-0 mb-2 w-52 overflow-hidden rounded-2xl border border-[#eee9ef] bg-white p-1.5 shadow-[0_14px_36px_rgba(45,27,46,0.16)]">
							<a bind:this={firstSettingsItem} href={`/${page.data.lang}/`} role="menuitem" onclick={() => closeSettings()} class="halo-focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-plum transition hover:bg-lavender/15"><HaloIcon name="arrow-left" size={16} />{copy.home}</a>
							<a href={alternateHaloHref} role="menuitem" onclick={() => closeSettings()} class="halo-focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-plum transition hover:bg-lavender/15"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.4 8.8 12S9.9 5.8 12 3.5Z" /></svg>{copy.language}</a>
							<form method="POST" action={`/${page.data.lang}/logout`}><button type="submit" role="menuitem" class="halo-focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-coral-dark transition hover:bg-coral/10"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 5V3.8A1.8 1.8 0 0 0 12.2 2H5.8A1.8 1.8 0 0 0 4 3.8v16.4A1.8 1.8 0 0 0 5.8 22h6.4a1.8 1.8 0 0 0 1.8-1.8V19M10 12h10m-3-3 3 3-3 3" /></svg>{copy.logout}</button></form>
						</div>
					{/if}
				</div>
			</div>
		</aside>

		<main class="min-w-0 border-[#eee9ef] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:border-x md:pb-0">{@render children()}</main>

		<aside class="sticky top-[var(--pwa-safe-top)] hidden h-dvh px-7 py-3 lg:block">
			<form action={`${base}/explore`} method="GET" class="flex h-11 items-center gap-3 rounded-full bg-[#f7f7f8] px-4 text-plum-light">
				<HaloIcon name="explore" size={17} /><label class="sr-only" for="halo-sidebar-search">Search</label><input id="halo-sidebar-search" name="search" type="search" placeholder={m.halo_explore()} class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-plum-light" />
			</form>
			<section class="mt-4 overflow-hidden rounded-2xl bg-[#f7f7f8]">
				<h2 class="px-4 pb-3 pt-4 font-display text-xl font-extrabold">{m.halo_community()}</h2>
				{#each data.haloDiscovery as item}
					<a href={`${base}?${item.kind}Id=${encodeURIComponent(item.id)}`} class="block px-4 py-3 transition hover:bg-plum/[.045]"><span class="block text-[11px] capitalize text-plum-light">{item.kind}</span><strong class="block truncate text-sm">#{item.label}</strong><span class="text-[11px] text-plum-light">{item.momentCount} moments</span></a>
				{:else}
					<p class="px-4 pb-4 text-xs leading-5 text-plum-light">{page.data.lang === 'th' ? 'ยังไม่มีหัวข้อที่กำลังได้รับความสนใจ' : 'Nothing is trending yet.'}</p>
				{/each}
			</section>
			<p class="mt-4 px-3 text-[11px] leading-5 text-plum-light">{m.halo_community_copy()}</p>
		</aside>
	</div>

	<nav class="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[#eee9ef] bg-white/95 px-2 backdrop-blur-md md:hidden" aria-label="Orbit Halo">
		<div class="mx-auto grid max-w-[620px] grid-cols-5">
			<a href={mobileItems[0].href} aria-current={isActive(mobileItems[0].href) ? 'page' : undefined} class="halo-focus-ring flex min-h-14 items-center justify-center rounded-full {isActive(mobileItems[0].href) ? 'text-coral-dark' : 'text-plum'}" aria-label={mobileItems[0].label}><HaloIcon name={mobileItems[0].icon} size={21} /></a>
			<a href={mobileItems[1].href} aria-current={isActive(mobileItems[1].href) ? 'page' : undefined} class="halo-focus-ring flex min-h-14 items-center justify-center rounded-full {isActive(mobileItems[1].href) ? 'text-coral-dark' : 'text-plum'}" aria-label={mobileItems[1].label}><HaloIcon name={mobileItems[1].icon} size={21} /></a>
			<a href={`${base}/compose`} class="halo-focus-ring flex min-h-14 items-center justify-center" aria-label={m.halo_create()}><span class="grid h-10 w-10 place-items-center rounded-full bg-coral text-white"><HaloIcon name="plus" size={20} /></span></a>
			<a href={mobileItems[2].href} aria-current={isActive(mobileItems[2].href) ? 'page' : undefined} class="halo-focus-ring flex min-h-14 items-center justify-center rounded-full {isActive(mobileItems[2].href) ? 'text-coral-dark' : 'text-plum'}" aria-label={mobileItems[2].label}><HaloIcon name={mobileItems[2].icon} size={21} /></a>
			<a href={mobileItems[3].href} aria-current={isActive(mobileItems[3].href) ? 'page' : undefined} class="halo-focus-ring flex min-h-14 items-center justify-center rounded-full {isActive(mobileItems[3].href) ? 'text-coral-dark' : 'text-plum'}" aria-label={mobileItems[3].label}><HaloIcon name={mobileItems[3].icon} size={21} /></a>
		</div>
	</nav>
</div>
