<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	let { children } = $props();
	const base = $derived(`/${page.data.lang}/halo`);
	const user = $derived(page.data.user);
	const items = $derived([
		{ href: base, label: m.halo_feed(), icon: '✦' }, { href: `${base}/explore`, label: m.halo_explore(), icon: '⌕' },
		{ href: `${base}/saved`, label: m.halo_saved(), icon: '⌑' }, { href: `${base}/notifications`, label: m.halo_alerts(), icon: '◌' },
		{ href: `${base}/profile/moments`, label: m.halo_profile(), icon: '◒' }
	]);
	const isActive = (href: string) => page.url.pathname === href || (href !== base && page.url.pathname.startsWith(`${href}/`));
</script>

<div class="min-h-dvh bg-[#fcf8ff] text-plum">
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden"><div class="absolute -left-32 top-20 h-96 w-96 rounded-full bg-coral/10 blur-3xl"></div><div class="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-lavender/20 blur-3xl"></div></div>
	<header class="sticky top-[var(--pwa-safe-top)] z-40 border-b border-white/60 bg-[#fcf8ff]/85 px-4 py-3 backdrop-blur-xl md:hidden"><div class="mx-auto flex max-w-2xl items-center justify-between"><a href={`/${page.data.lang}/`} class="text-xs font-bold text-plum-light">← GL-Orbit</a><a href={base} class="font-display text-lg font-extrabold tracking-tight">Orbit <span class="text-coral-dark">Halo</span></a><a href={`${base}/profile/moments`} class="grid h-8 w-8 place-items-center rounded-xl bg-lavender/20 text-xs font-bold">{user?.username?.[0]?.toUpperCase() ?? '✦'}</a></div></header>
	<div class="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-[210px_minmax(0,740px)] md:gap-8 lg:grid-cols-[230px_minmax(0,740px)_260px] lg:gap-10">
		<aside class="sticky top-0 hidden h-dvh py-8 md:block"><div class="flex h-full flex-col"><a href={base} class="mb-8 flex items-center gap-2 font-display text-xl font-extrabold">✦ Orbit <span class="text-coral-dark">Halo</span></a><nav aria-label="Orbit Halo"><div class="space-y-1">{#each items as item}<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} class="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition {isActive(item.href) ? 'bg-plum text-white shadow-lg shadow-plum/15' : 'text-plum-light hover:bg-white hover:text-plum'}"><span class="text-lg">{item.icon}</span>{item.label}</a>{/each}</div><a href={`${base}#compose`} class="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral to-coral-dark px-4 py-3 text-sm font-bold text-white shadow-lg shadow-coral/25">＋ {m.halo_create()}</a></nav><a href={`/${page.data.lang}/`} class="mt-auto rounded-xl px-3 py-2 text-xs font-bold text-plum-light hover:text-plum">← {m.halo_return()}</a></div></aside>
		<main class="min-w-0 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-5 md:px-0 md:pb-10 md:pt-9">{@render children()}</main>
		<aside class="sticky top-8 hidden h-fit py-9 lg:block"><section class="rounded-[1.75rem] border border-white bg-white/70 p-5 shadow-[0_12px_34px_rgba(88,66,130,.08)]"><p class="font-display text-lg font-bold">{m.halo_community()}</p><p class="mt-2 text-sm leading-6 text-plum-light">{m.halo_community_copy()}</p><div class="mt-5 flex -space-x-2"><span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-coral/30 text-xs">M</span><span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-mint/40 text-xs">J</span><span class="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-lavender/40 text-xs">N</span></div></section></aside>
	</div>
	<nav class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/80 bg-white/90 px-2 pt-2 backdrop-blur-xl md:hidden safe-area-bottom" aria-label="Orbit Halo"><div class="mx-auto flex max-w-md items-end justify-around">{#each items as item, index}<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} class="flex min-w-[3.5rem] flex-col items-center gap-1 pb-2 text-[10px] font-bold {isActive(item.href) ? 'text-coral-dark' : 'text-plum-light'}">{#if index === 2}<span class="-mt-7 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-coral to-coral-dark text-xl text-white shadow-lg shadow-coral/35">＋</span>{:else}<span class="text-lg">{item.icon}</span>{/if}{item.label}</a>{/each}</div></nav>
</div>
