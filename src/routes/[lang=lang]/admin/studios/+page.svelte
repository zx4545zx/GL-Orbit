<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminFetch } from '$lib/admin/action-feedback.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	interface Studio {
		id: string;
		name: string;
		logoUrl: string | null;
		officialSite: string | null;
	}

	let studios = $state<Studio[]>([]);
	let loading = $state(true);
	let search = $state('');
	let showCreate = $state(false);
	let createLoading = $state(false);
	let createError = $state('');
	let deleteTarget = $state<Studio | null>(null);
	let showConfirm = $state(false);

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/admin/studios?limit=999', { credentials: 'include' });
			const json = await res.json();
			studios = json.data ?? [];
		} catch {
			studios = [];
		}
		loading = false;
	}

	onMount(loadData);

	const filtered = $derived(
		search.trim()
			? studios.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
			: studios
	);

	async function createStudio(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const fd = new FormData(form);
		const name = fd.get('name')?.toString().trim() ?? '';
		const logoUrl = fd.get('logoUrl')?.toString().trim() || null;
		const officialSite = fd.get('officialSite')?.toString().trim() || null;
		if (!name) {
			createError = 'กรุณากรอกชื่อสตูดิโอ';
			return;
		}
		createLoading = true;
		createError = '';
		try {
			const res = await adminFetch('/api/admin/studios', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, logoUrl, officialSite })
			});
			const json = await res.json();
			if (!res.ok) {
				createError = json.error ?? 'สร้างไม่สำเร็จ';
				return;
			}
			showCreate = false;
			goto(`/admin/studios/${json.id}`);
		} catch {
			createError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		} finally {
			createLoading = false;
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		const res = await adminFetch(`/api/admin/studios/${target.id}`, { method: 'DELETE', credentials: 'include' });
		if (res.ok) studios = studios.filter((s) => s.id !== target.id);
		deleteTarget = null;
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการสตูดิโอ</h1>
			<p class="text-sm sm:text-base text-plum-light">คลิกสตูดิโอเพื่อจัดการข้อมูลและช่องทาง</p>
		</div>
		<button onclick={() => (showCreate = !showCreate)} class="orbit-action px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
			<span>เพิ่มสตูดิโอ</span>
		</button>
	</div>

	<form class="mb-4 sm:mb-6" onsubmit={(e) => e.preventDefault()}>
		<div class="relative">
			<svg class="w-5 h-5 text-plum-light/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input type="text" bind:value={search} placeholder="ค้นหาชื่อสตูดิโอ..." class="orbit-control w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
		</div>
	</form>

	{#if showCreate}
		<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-lg shadow-lavender/5">
			<div class="mb-4">
				<h2 class="text-lg font-semibold text-plum">เพิ่มสตูดิโอ</h2>
				<p class="mt-1 text-sm text-plum-light">กรอกข้อมูลพื้นฐานแล้วกดสร้างเพื่อไปจัดการช่องทางต่อ</p>
			</div>
			<form onsubmit={createStudio} class="space-y-4">
				<div>
					<label for="studio-create-name" class="block text-sm font-medium text-plum mb-1">ชื่อสตูดิโอ <span class="text-coral">*</span></label>
					<input id="studio-create-name" name="name" required placeholder="เช่น GMMTV" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="studio-create-logo" class="block text-sm font-medium text-plum mb-1">URL โลโก้</label>
						<input id="studio-create-logo" name="logoUrl" type="url" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="studio-create-site" class="block text-sm font-medium text-plum mb-1">เว็บไซต์ทางการ</label>
						<input id="studio-create-site" name="officialSite" type="url" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				{#if createError}<p class="text-sm text-coral-dark">{createError}</p>{/if}
				<div class="flex gap-2 pt-1">
					<button type="submit" disabled={createLoading} class="orbit-action px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm sm:text-base touch-target disabled:opacity-50">{createLoading ? 'กำลังสร้าง...' : 'สร้าง & จัดการ'}</button>
					<button type="button" onclick={() => (showCreate = false)} class="orbit-control px-5 py-2.5 rounded-xl font-medium transition-colors text-sm sm:text-base touch-target">ยกเลิก</button>
				</div>
			</form>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-2.5">
			{#each Array(5) as _, i (i)}
				<div class="glass-card rounded-2xl p-3 sm:p-4 animate-pulse" class:opacity-60={i > 2}>
					<div class="flex items-center gap-3 sm:gap-4">
						<div class="w-12 h-12 rounded-xl bg-lavender/10 flex-shrink-0"></div>
						<div class="flex-1 min-w-0 space-y-2"><div class="h-4 w-1/2 bg-lavender/10 rounded"></div><div class="h-3 w-32 bg-lavender/10 rounded"></div></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">{search.trim() ? 'ไม่พบสตูดิโอ' : 'ยังไม่มีสตูดิโอ'}</h3>
			<p class="text-sm text-plum-light">{search.trim() ? 'ลองคำค้นอื่น หรือเพิ่มสตูดิโอใหม่' : 'กด "เพิ่มสตูดิโอ" เพื่อเพิ่มข้อมูล'}</p>
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each filtered as studio (studio.id)}
				<div class="group glass-card rounded-2xl p-3 sm:p-4 transition-all hover:shadow-md hover:shadow-lavender/10 cursor-pointer" role="button" tabindex="0" onclick={() => goto(`/admin/studios/${studio.id}`)} onkeydown={(e) => e.key === 'Enter' && goto(`/admin/studios/${studio.id}`)}>
					<div class="flex items-center gap-3 sm:gap-4">
						{#if studio.logoUrl}
							<img src={studio.logoUrl} alt={studio.name} width={48} height={48} loading="lazy" decoding="async" class="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
						{:else}
							<div class="w-12 h-12 rounded-xl bg-lavender/10 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg></div>
						{/if}
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-plum text-sm sm:text-base truncate">{studio.name}</h3>
							<div class="mt-1">
								{#if studio.officialSite}
									<span class="inline-flex max-w-full items-center rounded-full bg-lavender/12 px-2 py-0.5 text-[11px] font-medium text-plum-light sm:text-xs"><span class="mr-1 text-coral-dark/70">เว็บ</span><span class="truncate">{studio.officialSite}</span></span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-white/55 px-2 py-0.5 text-[11px] font-medium text-plum-light/70 sm:text-xs">ยังไม่มีเว็บไซต์</span>
								{/if}
							</div>
						</div>
						<button type="button" onclick={(e) => { e.stopPropagation(); deleteTarget = studio; showConfirm = true; }} aria-label="ลบ" class="p-2 rounded-lg hover:bg-coral/10 text-plum-light/60 hover:text-coral-dark transition-colors touch-target flex-shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
						<svg class="w-4 h-4 text-plum-light/40 group-hover:text-plum-light/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-xs sm:text-sm text-plum-light mt-4 px-2">{search.trim() ? `พบ ${filtered.length} จาก ${studios.length} สตูดิโอ` : `ทั้งหมด ${studios.length} สตูดิโอ`}</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบสตูดิโอ"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบสตูดิโอนี้? ช่องทางทั้งหมดจะถูกลบไปด้วย และไม่สามารถย้อนกลับได้"
	onconfirm={handleDelete}
	oncancel={() => (deleteTarget = null)}
/>
