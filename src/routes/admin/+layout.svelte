<script lang="ts">
	import { page } from '$app/state';
	import AdminActionFeedback from '$lib/components/admin/AdminActionFeedback.svelte';
	import { slide } from 'svelte/transition';

	let { children } = $props();
	let mobileOpen = $state(false);

	type NavItem = { href: string; label: string; hint?: string; icon: string };
	const navSections: { title: string; items: NavItem[] }[] = [
		{
			title: 'จัดการซีรีส์',
			items: [
				{ href: '/admin/series', label: 'ซีรีส์', hint: 'จัดการครบในที่เดียว', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' }
			]
		},
		{
			title: 'ข้อมูลพื้นฐาน',
			items: [
				{ href: '/admin/artists', label: 'นักแสดง', hint: 'ข้อมูล + โซเชียล', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
				{ href: '/admin/studios', label: 'สตูดิโอ', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
				{ href: '/admin/platforms', label: 'แพลตฟอร์ม', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
				{ href: '/admin/genres', label: 'ประเภทซีรีส์', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' }
			]
		}
	];

	// active เมื่อ path ตรง หรืออยู่ใต้ path นั้น (เช่น /admin/series/[id])
	function isActive(href: string) {
		const p = page.url.pathname;
		return p === href || p.startsWith(href + '/');
	}

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<svelte:head>
	<title>ผู้ดูแลระบบ | GL-Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-dvh bg-gray-50 flex">
	<!-- Desktop Sidebar -->
	<aside class="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
		<div class="h-16 flex items-center px-6 border-b border-gray-100">
			<a href="/admin/series" class="text-lg font-bold text-plum tracking-tight">GL-Orbit</a>
			<span class="ml-2 px-2 py-0.5 rounded-md bg-coral/10 text-coral-dark text-xs font-semibold">Admin</span>
		</div>

		<nav class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
			{#each navSections as section}
				<div>
					<p class="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-plum-light/50">{section.title}</p>
					<div class="space-y-1">
						{#each section.items as item}
							{@const active = isActive(item.href)}
							<a
								href={item.href}
								class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 {active ? 'bg-gradient-to-r from-coral/10 to-lavender/10 text-coral-dark shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-plum'}"
							>
								<svg class="w-5 h-5 flex-shrink-0 {active ? 'text-coral-dark' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon}/>
								</svg>
								<span class="flex-1">{item.label}</span>
								{#if item.hint}
									<span class="text-[10px] text-plum-light/50 hidden xl:inline">{item.hint}</span>
								{/if}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>

		<div class="p-3 border-t border-gray-100">
			<a href="/" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-plum transition-all">
				<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
				<span>กลับหน้าหลัก</span>
			</a>
		</div>
	</aside>

	<!-- Mobile Header -->
	<header class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between h-14 px-4">
			<button onclick={() => mobileOpen = !mobileOpen} class="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors touch-target" aria-label="เปิดเมนู">
				<svg class="w-6 h-6 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
			</button>
			<div class="flex items-center gap-2">
				<span class="text-base font-bold text-plum">GL-Orbit</span>
				<span class="px-1.5 py-0.5 rounded-md bg-coral/10 text-coral-dark text-[10px] font-semibold">Admin</span>
			</div>
			<div class="w-10"></div>
		</div>
	</header>

	<!-- Mobile Sidebar Overlay -->
	{#if mobileOpen}
		<div class="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
			<button type="button" class="absolute inset-0 bg-plum/30 backdrop-blur-sm" onclick={closeMobile} aria-label="ปิดเมนู"></button>
			<div transition:slide={{ axis: 'x', duration: 200 }} class="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
				<div class="h-14 flex items-center justify-between px-4 border-b border-gray-100">
					<div class="flex items-center gap-2">
						<span class="text-base font-bold text-plum">GL-Orbit</span>
						<span class="px-1.5 py-0.5 rounded-md bg-coral/10 text-coral-dark text-[10px] font-semibold">Admin</span>
					</div>
					<button onclick={closeMobile} class="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target" aria-label="ปิดเมนู">
						<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>

				<nav class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
					{#each navSections as section}
						<div>
							<p class="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-plum-light/50">{section.title}</p>
							<div class="space-y-1">
								{#each section.items as item}
									{@const active = isActive(item.href)}
									<a
										href={item.href}
										onclick={closeMobile}
										class="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all {active ? 'bg-gradient-to-r from-coral/10 to-lavender/10 text-coral-dark shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-plum'}"
									>
										<svg class="w-5 h-5 flex-shrink-0 {active ? 'text-coral-dark' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon}/>
										</svg>
										<span>{item.label}</span>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</nav>

				<div class="p-3 border-t border-gray-100">
					<a href="/" onclick={closeMobile} class="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-plum transition-all">
						<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
						<span>กลับหน้าหลัก</span>
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-dvh overflow-x-hidden">
		<div class="max-w-6xl mx-auto px-4 py-6 overflow-x-hidden">
			{@render children()}
		</div>
	</main>

	<AdminActionFeedback />
</div>
