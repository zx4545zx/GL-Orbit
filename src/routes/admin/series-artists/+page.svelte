<script lang="ts">
	import { onMount } from 'svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { createAdminApi } from '$lib/admin/api.js';

	const seriesArtistsApi = createAdminApi<any>('series-artists');
	const seriesApi = createAdminApi<any>('series');
	const artistsApi = createAdminApi<any>('artists');

	let items = $state<any[]>([]);
	let page = $state(1);
	let total = $state(0);
	let totalPages = $state(1);
	let limit = $state(20);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let formEl = $state<HTMLElement | null>(null);
	let deleteTarget = $state<any>(null);
	let showConfirm = $state(false);

	// Dropdown data
	let allSeries = $state<any[]>([]);
	let allArtists = $state<any[]>([]);

	// Form fields
	let formSeriesId = $state('');
	let formArtistId = $state('');
	let formRoleName = $state('');

	// Original composite key for editing
	let origSeriesId = $state('');
	let origArtistId = $state('');

	const roleOptions = [
		{ value: 'LEAD', label: 'Lead' },
		{ value: 'SUPPORTING', label: 'Supporting' },
		{ value: 'GUEST', label: 'Guest' }
	];

	async function loadData() {
		loading = true;
		const url = new URL(window.location.href);
		const currentPage = parseInt(url.searchParams.get('page') ?? '1', 10);
		page = currentPage;
		const res = await seriesArtistsApi.list(page, limit);
		if (res.success && res.data) {
			items = res.data.data ?? [];
			page = res.data.page;
			total = res.data.total;
			totalPages = res.data.totalPages;
			limit = res.data.limit;
		} else {
			items = [];
		}
		loading = false;
	}

	async function loadDropdowns() {
		const [seriesRes, artistsRes] = await Promise.all([
			seriesApi.listAll(),
			artistsApi.listAll()
		]);
		if (seriesRes.success && seriesRes.data) {
			allSeries = seriesRes.data.data ?? [];
		}
		if (artistsRes.success && artistsRes.data) {
			allArtists = artistsRes.data.data ?? [];
		}
	}

	onMount(() => {
		loadData();
		loadDropdowns();
	});

	function scrollToForm() {
		setTimeout(() => {
			formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 50);
	}

	function openCreate() {
		editingId = null;
		formSeriesId = '';
		formArtistId = '';
		formRoleName = '';
		origSeriesId = '';
		origArtistId = '';
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function openEdit(item: typeof items[0]) {
		const compositeId = `${item.seriesId}_${item.artistId}`;
		editingId = compositeId;
		origSeriesId = item.seriesId;
		origArtistId = item.artistId;
		formSeriesId = item.seriesId;
		formArtistId = item.artistId;
		formRoleName = item.roleName ?? '';
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		formLoading = true;
		formError = '';

		const body = {
			seriesId: formSeriesId,
			artistId: formArtistId,
			roleName: formRoleName || null
		};

		try {
			if (editingId) {
				const res = await fetch('/api/admin/series-artists', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						id_seriesId: origSeriesId,
						id_artistId: origArtistId,
						...body
					})
				});
				const json = await res.json();
				if (!res.ok || !json.success) {
					formError = json.error || 'เกิดข้อผิดพลาด';
					formLoading = false;
					return;
				}
			} else {
				const res = await fetch('/api/admin/series-artists', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(body)
				});
				const json = await res.json();
				if (!res.ok || !json.success) {
					formError = json.error || 'เกิดข้อผิดพลาด';
					formLoading = false;
					return;
				}
			}

			closeForm();
			await loadData();
		} catch {
			formError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		}
		formLoading = false;
	}

	async function handleDelete() {
		if (!deleteTarget) return;

		try {
			const res = await fetch(
				`/api/admin/series-artists?seriesId=${encodeURIComponent(deleteTarget.seriesId)}&artistId=${encodeURIComponent(deleteTarget.artistId)}`,
				{ method: 'DELETE', credentials: 'include' }
			);
			const json = await res.json();
			if (res.ok && json.success) {
				deleteTarget = null;
				showConfirm = false;
				await loadData();
			}
		} catch {
			// silent fail
		}
	}

	function confirmDelete(item: typeof items[0]) {
		deleteTarget = item;
		showConfirm = true;
	}

	function roleBadgeClass(role: string) {
		if (role === 'LEAD') return 'bg-coral/10 text-coral-dark';
		if (role === 'SUPPORTING') return 'bg-lavender/10 text-lavender-dark';
		return 'bg-mint/10 text-mint-dark';
	}

	function roleLabel(role: string) {
		if (role === 'LEAD') return 'Lead';
		if (role === 'SUPPORTING') return 'Supporting';
		return 'Guest';
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการนักแสดงในซีรีส์</h1>
			<p class="text-sm sm:text-base text-plum-light">จัดการความสัมพันธ์ระหว่างซีรีส์กับนักแสดง</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มนักแสดงในซีรีส์</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไข' : 'เพิ่ม'}นักแสดงในซีรีส์</h2>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="sa-series" class="block text-sm font-medium text-plum mb-1">ซีรีส์ <span class="text-coral">*</span></label>
						<select id="sa-series" bind:value={formSeriesId} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกซีรีส์</option>
							{#each allSeries as s}
								<option value={s.id}>{s.title ?? s.titleEn ?? ''}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sa-artist" class="block text-sm font-medium text-plum mb-1">นักแสดง <span class="text-coral">*</span></label>
						<select id="sa-artist" bind:value={formArtistId} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกนักแสดง</option>
							{#each allArtists as a}
								<option value={a.id}>{a.nickname}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<label for="sa-role" class="block text-sm font-medium text-plum mb-1">บทบาท <span class="text-coral">*</span></label>
					<select id="sa-role" bind:value={formRoleName} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
						<option value="">เลือกบทบาท</option>
						{#each roleOptions as r}
							<option value={r.value}>{r.label}</option>
						{/each}
					</select>
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
	<div class="hidden md:block glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
		<div class="overflow-x-auto -mx-px">
			<table class="w-full min-w-[700px]">
				<thead>
					<tr class="border-b border-lavender/20">
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ซีรีส์</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">นักแสดง</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">บทบาท</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-lavender/10">
					{#if loading}
						{#each Array(4) as _, i}
							<tr class="animate-pulse">
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-4 w-3/4 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-4 w-24 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-3 w-16 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
							</tr>
						{/each}
					{:else}
						{#each items as item (item.seriesId + '_' + item.artistId)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-plum">{item.seriesTitle ?? '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-plum">{item.artistNickname ?? '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(item.roleName)}">
										{roleLabel(item.roleName)}
									</span>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									<div class="flex items-center justify-end gap-1 sm:gap-2">
										<button onclick={() => openEdit(item)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => confirmDelete(item)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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
			{#each Array(3) as _, i}
				<div class="glass-card rounded-2xl p-4 animate-pulse">
					<div class="space-y-3">
						<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
						<div class="h-4 w-24 bg-lavender/10 rounded"></div>
						<div class="flex gap-2">
							<div class="h-6 w-16 bg-lavender/10 rounded-full"></div>
						</div>
						<div class="flex gap-2 pt-1">
							<div class="h-8 w-16 bg-lavender/10 rounded-lg"></div>
							<div class="h-8 w-16 bg-lavender/10 rounded-lg"></div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			{#each items as item (item.seriesId + '_' + item.artistId)}
				<div class="glass-card rounded-2xl p-4 shadow-lg shadow-lavender/5 overflow-hidden">
					<div class="flex items-start justify-between mb-3">
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-plum truncate">{item.seriesTitle ?? '-'}</p>
							<p class="text-sm text-plum-light truncate">{item.artistNickname ?? '-'}</p>
						</div>
						<div class="flex items-center gap-1 ml-2 shrink-0">
							<button onclick={() => openEdit(item)} aria-label="แก้ไข" class="p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							</button>
							<button onclick={() => confirmDelete(item)} aria-label="ลบ" class="p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							</button>
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(item.roleName)}">
							{roleLabel(item.roleName)}
						</span>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && totalPages > 1}
		<Pagination {page} {totalPages} {total} {limit} />
	{/if}

	{#if !loading && items.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบข้อมูล</h3>
			<p class="text-sm text-plum-light">ยังไม่มีนักแสดงในซีรีส์ กด "เพิ่ม" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบ"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ ${deleteTarget.artistNickname ?? ''} ออกจาก ${deleteTarget.seriesTitle ?? ''}? การกระทำนี้ไม่สามารถย้อนกลับได้` : ''}
	confirmLabel="ลบ"
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
/>
