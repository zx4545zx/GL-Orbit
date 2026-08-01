<script lang="ts">
import { m } from '$lib/i18n/paraglide.js';
import { navigating, page } from '$app/state';

	let { bottomNavHidden = false }: { bottomNavHidden?: boolean } = $props();

	const homeItem = $derived({
		href: `/${page.data.lang}/`,
		label: m.nav_home(),
		icon: (active: boolean) => `
			<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
			</svg>
		`
	});

	const secondaryItems = $derived([
		{
			href: `/${page.data.lang}/calendar`,
			label: m.nav_calendar(),
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
					</svg>
				`
			},
			{
				href: `/${page.data.lang}/explore`,
				label: m.nav_explore(),
				icon: (active: boolean) => `
					<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.75-12.75-2.68 5.357a1.125 1.125 0 0 1-.536.536L7.5 16.5l2.68-5.357a1.125 1.125 0 0 1 .536-.536L15.75 8.25Z" />
					</svg>
				`
			},
			// Orbit Halo hidden while the feature is closed — restore the /halo item here.
		]);

	const menuItem = $derived({
		href: `/${page.data.lang}/menus`,
		label: m.nav_menus(),
		icon: (active: boolean) => `
			<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-[var(--orbit-coral)]' : 'opacity-70'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '2.3' : '1.7'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
			</svg>
		`
	});

	const navItems = $derived.by(() => {
		const items = [homeItem, ...secondaryItems];
		items.push(menuItem);
		return items;
	});

	const activePathname = $derived(navigating.to?.url.pathname ?? page.url.pathname);

	function isActive(href: string) {
		const langPrefix = `/${page.data.lang}`;
		if (href === `${langPrefix}/`) {
			return activePathname === langPrefix || activePathname === `${langPrefix}/`;
		}
		if (href.startsWith(`${langPrefix}/explore`)) {
			return activePathname.startsWith(`${langPrefix}/explore`);
		}
		return activePathname === href || activePathname.startsWith(href + '/');
	}
</script>

<nav
	class="orbit-navigation fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 {bottomNavHidden ? 'translate-y-full' : 'translate-y-0'}"
>
	<div class="shell-bottomnav safe-area-bottom">
		<div class="flex items-stretch px-0">
			{#each navItems as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					data-sveltekit-preload-data="hover"
					aria-current={active ? 'page' : undefined}
					class="orbit-nav-item group relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-2 touch-target {active ? 'orbit-nav-active' : ''}"
				>
					<div class="relative flex items-center justify-center">
						<div class="relative {active ? 'zine-tilt' : ''}">
							{@html item.icon(active)}
						</div>
					</div>
					<span
						class="zine-nav-label block max-w-full truncate text-center text-[10px] font-medium leading-none {active ? 'font-semibold' : 'opacity-70'}"
					>
						{item.label}
					</span>
					<div class="orbit-nav-indicator mt-0.5 h-px w-5" aria-hidden="true"></div>
				</a>
			{/each}
		</div>
	</div>
</nav>
