<script lang="ts">
	import { onMount } from 'svelte';
	import { createAdminApi } from '$lib/admin/api.js';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	const artistsApi = createAdminApi<any>('artists');

	let result = $state<any>({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
	let allArtists = $derived(result.data ?? []);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let deleteTarget = $state<{ id: string; nickname: string } | null>(null);
	let showConfirm = $state(false);
	let formEl = $state<HTMLElement | null>(null);
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);

	async function loadData(p = 1) {
		loading = true;
		try {
			const res = await artistsApi.list(p);
			if (res.success && res.data) {
				result = res.data;
				page = res.data.page;
				totalPages = res.data.totalPages;
				total = res.data.total;
			}
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		const p = parseInt(params.get('page') ?? '1');
		await loadData(p);
	});

	function scrollToForm() {
		setTimeout(() => formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
	}

	function openCreate() {
		editingId = null;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function openEdit(artist: typeof allArtists[0]) {
		editingId = artist.id;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	async function onFormSubmit(e: Event) {
		e.preventDefault();
		formLoading = true;
		formError = '';
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const nickname = (formData.get('nickname') as string)?.trim() ?? '';
		const fullName = (formData.get('fullName') as string)?.trim() || null;
		const profileImageUrl = (formData.get('profileImageUrl') as string)?.trim() || null;

		if (!nickname) {
			formError = 'กรุณากรอกชื่อเล่น';
			formLoading = false;
			return;
		}

		try {
			let res;
			if (editingId) {
				res = await artistsApi.update(editingId, { nickname, fullName, profileImageUrl });
			} else {
				res = await artistsApi.create({ nickname, fullName, profileImageUrl });
			}
			if (res.success) {
				closeForm();
				await loadData(page);
			} else {
				formError = res.error ?? 'เกิดข้อผิดพลาด';
			}
		} catch {
			formError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		} finally {
			formLoading = false;
		}
	}

	function confirmDelete(artist: typeof allArtists[0]) {
		deleteTarget = { id: artist.id, nickname: artist.nickname };
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		try {
			const res = await artistsApi.remove(target.id);
			if (res.success) {
				result = { ...result, data: allArtists.filter((a: any) => a.id !== target.id), total: result.total - 1 };
			}
		} catch { /* ignore */ }
		deleteTarget = null;
	}

	const editingArtist = $derived(() => allArtists.find((a: any) => a.id === editingId));
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการนักแสดง</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลนักแสดง</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มนักแสดง</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขนักแสดง' : 'เพิ่มนักแสดง'}</h2>
			<form onsubmit={onFormSubmit} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="artist-nickname" class="block text-sm font-medium text-plum mb-1">ชื่อเล่น <span class="text-coral">*</span></label>
						<input id="artist-nickname" type="text" name="nickname" value={editingArtist()?.nickname ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="artist-fullname" class="block text-sm font-medium text-plum mb-1">ชื่อเต็ม</label>
						<input id="artist-fullname" type="text" name="fullName" value={editingArtist()?.fullName ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div>
					<label for="artist-image" class="block text-sm font-medium text-plum mb-1">URL รูปโปรไฟล์</label>
					<input id="artist-image" type="url" name="profileImageUrl" value={editingArtist()?.profileImageUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
				</div>
				{#if formError}
					<p class="text-sm text-coral-dark">{formError}</p>
				{/if}
				<div class="flex gap-2 pt-2">
					<button type="submit" disabled={formLoading} class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl transition-all text-sm sm:text-base touch-target disabled:opacity-50">
						{formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
					</button>
					<button type="button" onclick={closeForm} class="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all text-sm sm:text-base touch-target">ยกเลิก</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Desktop Table -->
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5 hidden md:block">
		<div class="overflow-x-auto -mx-px">
			<table class="w-full min-w-[600px]">
				<thead>
					<tr class="border-b border-lavender/20">
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">นักแสดง</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">ชื่อเต็ม</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-lavender/10">
					{#if loading}
						{#each Array(4) as _, i}
							<tr class="animate-pulse">
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-4 w-3/4 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell"><div class="h-3 w-32 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
							</tr>
						{/each}
					{:else}
						{#each allArtists as artist (artist.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="flex items-center gap-3">
										{#if artist.profileImageUrl}
											<img src={artist.profileImageUrl} alt={artist.nickname} class="w-10 h-10 rounded-full object-cover bg-gray-100" />
										{:else}
											<div class="w-10 h-10 rounded-full bg-lavender/10 flex items-center justify-center">
												<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
											</div>
										{/if}
										<span class="font-medium text-plum text-sm sm:text-base">{artist.nickname}</span>
									</div>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">
									{artist.fullName ?? '-'}
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									<div class="flex items-center justify-end gap-1 sm:gap-2">
										<button onclick={() => openEdit(artist)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => confirmDelete(artist)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Mobile Cards -->
	<div class="block md:hidden space-y-3">
		{#if loading}
			{#each Array(4) as _, i}
				<div class="glass-card rounded-2xl p-4 animate-pulse space-y-3">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-lavender/10"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
							<div class="h-3 w-1/2 bg-lavender/10 rounded"></div>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2 pt-2">
						<div class="h-8 w-16 bg-lavender/10 rounded"></div>
						<div class="h-8 w-16 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allArtists as artist (artist.id)}
				<div class="glass-card rounded-2xl p-4 transition-all overflow-hidden">
					<div class="flex items-start gap-3">
						{#if artist.profileImageUrl}
							<img src={artist.profileImageUrl} alt={artist.nickname} class="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0" />
						{:else}
							<div class="w-12 h-12 rounded-full bg-lavender/10 flex items-center justify-center flex-shrink-0">
								<svg class="w-6 h-6 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-plum text-sm truncate">{artist.nickname}</div>
							<div class="text-xs text-plum-light mt-0.5 truncate">{artist.fullName ?? '-'}</div>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-lavender/10">
						<button onclick={() => openEdit(artist)} class="px-3 py-1.5 rounded-lg bg-lavender/10 text-lavender-dark text-xs font-medium hover:bg-lavender/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							แก้ไข
						</button>
						<button onclick={() => confirmDelete(artist)} class="px-3 py-1.5 rounded-lg bg-coral/10 text-coral-dark text-xs font-medium hover:bg-coral/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							ลบ
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && result.totalPages > 1}
		<Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} />
	{/if}

	{#if !loading && allArtists.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบนักแสดง</h3>
			<p class="text-sm text-plum-light">ยังไม่มีนักแสดงในระบบ กด "เพิ่มนักแสดง" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบนักแสดง"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.nickname}"? การกระทำนี้ไม่สามารถย้อนกลับได้` : ''}
	onconfirm={handleDelete}
/>
