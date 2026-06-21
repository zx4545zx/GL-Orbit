<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminFetch } from '$lib/admin/action-feedback.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	interface Artist {
		id: string;
		nickname: string;
		fullName: string | null;
		profileImageUrl: string | null;
	}

	let artists = $state<Artist[]>([]);
	let loading = $state(true);
	let search = $state('');
	let showCreate = $state(false);
	let createLoading = $state(false);
	let createError = $state('');
	let deleteTarget = $state<Artist | null>(null);
	let showConfirm = $state(false);

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/admin/artists?limit=999', { credentials: 'include' });
			const json = await res.json();
			artists = json.data ?? [];
		} catch {
			artists = [];
		}
		loading = false;
	}

	onMount(loadData);

	const filtered = $derived(
		search.trim()
			? artists.filter((a) =>
					a.nickname.toLowerCase().includes(search.toLowerCase()) ||
					(a.fullName ?? '').toLowerCase().includes(search.toLowerCase())
				)
			: artists
	);

	async function createArtist(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const fd = new FormData(form);
		const nickname = fd.get('nickname')?.toString().trim() ?? '';
		const fullName = fd.get('fullName')?.toString().trim() || null;
		const profileImageUrl = fd.get('profileImageUrl')?.toString().trim() || null;
		if (!nickname) {
			createError = 'กรุณากรอกชื่อเล่น';
			return;
		}
		createLoading = true;
		createError = '';
		try {
			const res = await adminFetch('/api/admin/artists', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nickname, fullName, profileImageUrl })
			});
			const json = await res.json();
			if (!res.ok) {
				createError = json.error ?? 'สร้างไม่สำเร็จ';
				return;
			}
			showCreate = false;
			goto(`/admin/artists/${json.id}`);
		} catch {
			createError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		} finally {
			createLoading = false;
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		const res = await adminFetch(`/api/admin/artists/${target.id}`, { method: 'DELETE', credentials: 'include' });
		if (res.ok) artists = artists.filter((a) => a.id !== target.id);
		deleteTarget = null;
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการนักแสดง</h1>
			<p class="text-sm sm:text-base text-plum-light">คลิกนักแสดงเพื่อจัดการข้อมูลและโซเชียลมีเดียในหน้าเดียว</p>
		</div>
		<button onclick={() => (showCreate = true)} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
			เพิ่มนักแสดง
		</button>
	</div>

	<form class="mb-4 sm:mb-6" onsubmit={(e) => e.preventDefault()}>
		<div class="relative">
			<svg class="w-5 h-5 text-plum-light/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input type="text" bind:value={search} placeholder="ค้นหานักแสดง..." class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-lavender/30 bg-white/70 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
		</div>
	</form>

	{#if showCreate}
		<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">เพิ่มนักแสดง</h2>
			<form onsubmit={createArtist} class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="artist-create-nickname" class="block text-sm font-medium text-plum mb-1">ชื่อเล่น <span class="text-coral">*</span></label>
						<input id="artist-create-nickname" name="nickname" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="artist-create-fullname" class="block text-sm font-medium text-plum mb-1">ชื่อเต็ม</label>
						<input id="artist-create-fullname" name="fullName" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div>
					<label for="artist-create-image" class="block text-sm font-medium text-plum mb-1">URL รูปโปรไฟล์</label>
					<input id="artist-create-image" name="profileImageUrl" type="url" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
				</div>
				{#if createError}<p class="text-sm text-coral-dark">{createError}</p>{/if}
				<div class="flex gap-2 pt-2">
					<button type="submit" disabled={createLoading} class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 text-sm sm:text-base touch-target disabled:opacity-50">{createLoading ? 'กำลังสร้าง...' : 'สร้าง & จัดการ'}</button>
					<button type="button" onclick={() => (showCreate = false)} class="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm sm:text-base touch-target">ยกเลิก</button>
				</div>
			</form>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-3">
			{#each Array(8) as _}
				<div class="glass-card rounded-2xl p-4 animate-pulse flex items-center gap-3"><div class="w-12 h-12 rounded-full bg-lavender/10"></div><div class="flex-1 space-y-2"><div class="h-4 w-1/2 bg-lavender/10 rounded"></div><div class="h-3 w-1/3 bg-lavender/10 rounded"></div></div></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="text-center py-16"><h3 class="font-semibold text-plum mb-1">ไม่พบนักแสดง</h3><p class="text-sm text-plum-light">ลองคำค้นอื่น หรือเพิ่มนักแสดงใหม่</p></div>
	{:else}
		<div class="space-y-2.5">
			{#each filtered as artist (artist.id)}
				<div class="group glass-card rounded-2xl p-3 sm:p-4 transition-all hover:shadow-md hover:shadow-lavender/10 cursor-pointer" role="button" tabindex="0" onclick={() => goto(`/admin/artists/${artist.id}`)} onkeydown={(e) => e.key === 'Enter' && goto(`/admin/artists/${artist.id}`)}>
					<div class="flex items-center gap-3 sm:gap-4">
						{#if artist.profileImageUrl}
							<img src={artist.profileImageUrl} alt={artist.nickname} width={48} height={48} loading="lazy" decoding="async" class="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0" />
						{:else}
							<div class="w-12 h-12 rounded-full bg-lavender/10 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6 text-lavender-dark/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
						{/if}
						<div class="flex-1 min-w-0"><h3 class="font-semibold text-plum text-sm sm:text-base truncate">{artist.nickname}</h3><p class="text-xs sm:text-sm text-plum-light truncate mt-0.5">{artist.fullName ?? '-'}</p></div>
						<button type="button" onclick={(e) => { e.stopPropagation(); deleteTarget = artist; showConfirm = true; }} aria-label="ลบ" class="p-2 rounded-lg hover:bg-coral/10 text-plum-light/60 hover:text-coral-dark transition-colors touch-target flex-shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
						<svg class="w-5 h-5 text-plum-light/40 group-hover:text-coral-dark group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-xs sm:text-sm text-plum-light mt-4 px-2">{search.trim() ? `พบ ${filtered.length} จาก ${artists.length} คน` : `ทั้งหมด ${artists.length} คน`}</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบนักแสดง"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.nickname}"?` : ''}
	onconfirm={handleDelete}
/>
