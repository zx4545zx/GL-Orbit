<script lang="ts">
	import { page } from '$app/state';

	const user = $derived(page.data.user);

	const baseItems = [
		{
			href: '/',
			label: 'หน้าแรก',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
				</svg>
			`
		},
		{
			href: '/calendar',
			label: 'ตารางฉาย',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
				</svg>
			`
		},
		{
			href: '/series',
			label: 'ซีรีส์',
			icon: (active: boolean) => `
				<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0v-11.25c0-1.036.84-1.875 1.875-1.875h13.5c1.035 0 1.875.84 1.875 1.875v11.25m-18 0a1.125 1.125 0 0 0 1.125 1.125M18.75 19.5v-2.625a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v2.625m0 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125M21 19.5v-2.625a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v2.625m0 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125M9.75 9.75v2.625m3-.375v2.625m3-.375v2.625" />
				</svg>
			`
		}
	];

	const authItem = $derived(
		user
			? {
					href: '/profile',
					label: 'โปรไฟล์',
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
						</svg>
					`
				}
			: {
					href: '/login',
					label: 'เข้าสู่ระบบ',
					icon: (active: boolean) => `
						<svg class="w-6 h-6 transition-all duration-300 ${active ? 'text-coral-dark' : 'text-plum-light'}" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="${active ? '0' : '1.5'}">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
						</svg>
					`
				}
	);

	const navItems = $derived([...baseItems, authItem]);

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 md:hidden"
	style="padding-bottom: env(safe-area-inset-bottom, 0px);"
>
	<div class="glass-card rounded-t-2xl border-b-0 border-x-0 shadow-[0_-8px_32px_rgba(196,181,253,0.15)]">
		<div class="flex items-center justify-around px-2">
			{#each navItems as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					class="group flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] touch-target transition-all duration-300"
				>
					<div class="relative flex items-center justify-center">
						{#if active}
							<div
								class="absolute inset-0 -m-1 bg-coral/10 rounded-xl transition-all duration-300"
							></div>
						{/if}
						<div class="relative">
							{@html item.icon(active)}
						</div>
					</div>
					<span
						class="text-[10px] font-medium leading-none transition-all duration-300 {active ? 'text-coral-dark font-semibold' : 'text-plum-light/70'}"
					>
						{item.label}
					</span>
					{#if active}
						<div class="w-1 h-1 rounded-full bg-coral-dark mt-0.5"></div>
					{:else}
						<div class="w-1 h-1 rounded-full bg-transparent mt-0.5"></div>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</nav>
