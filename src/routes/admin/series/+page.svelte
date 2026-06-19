<script lang="ts">
	import { onMount } from 'svelte';
	import { createAdminApi } from '$lib/admin/api.js';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	const seriesApi = createAdminApi<any>('series');
	const studiosApi = createAdminApi<{ id: string; name: string }>('studios');
	const genresApi = createAdminApi<{ id: string; name: string }>('genres');

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: ' upcoming', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	let items = $state<any[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let deleteTarget = $state<{ id: string; title: string } | null>(null);
	let showConfirm = $state(false);
	let formEl = $state<HTMLElement | null>(null);
	let studios = $state<{ id: string; name: string }[]>([]);
	let allGenres = $state<{ id: string; name: string }[]>([]);

	async function loadData() {
		loading = true;
		const res = await seriesApi.list(page);
		if (res.success && res.data) {
			items = res.data.data;
			totalPages = res.data.totalPages;
			total = res.data.total;
		}
		loading = false;
	}

	async function loadDropdowns() {
		const [sRes, gRes] = await Promise.all([
			studiosApi.listAll(),
			genresApi.listAll()
		]);
		if (sRes.success && sRes.data) studios = sRes.data.data;
		if (gRes.success && gRes.data) allGenres = gRes.data.data;
	}

	onMount(() => {
		loadData();
		loadDropdowns();
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

	function openEdit(seriesItem: typeof items[0]) {
		editingId = seriesItem.id;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	async function handleCreate(body: Record<string, unknown>) {
		formLoading = true;
		formError = '';
		const res = await seriesApi.create(body);
		formLoading = false;
		if (res.success) {
			closeForm();
			await loadData();
		} else {
			formError = res.error ?? 'เกิดข้อผิดพลาด';
		}
	}

	async function handleUpdate(id: string, body: Record<string, unknown>) {
		formLoading = true;
		formError = '';
		const res = await seriesApi.update(id, body);
		formLoading = false;
		if (res.success) {
			closeForm();
			await loadData();
		} else {
			formError = res.error ?? 'เกิดข้อผิดพลาด';
		}
	}

	function confirmDelete(seriesItem: typeof items[0]) {
		deleteTarget = { id: seriesItem.id, title: seriesItem.title };
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		const res = await seriesApi.remove(target.id);
		if (res.success) {
			items = items.filter((s: any) => s.id !== target.id);
		}
		deleteTarget = null;
	}

	const editingSeries = $derived(() => items.find((s: any) => s.id === editingId));

	function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const body: Record<string, unknown> = {};
		formData.forEach((value, key) => {
			if (key === 'genreIds') {
				if (!body[key]) body[key] = [];
				(body[key] as string[]).push(value.toString());
			} else {
				body[key] = value.toString();
			}
		});
		// Get selected genres properly from multi-select
		const select = form.querySelector('select[name="genreIds"]') as HTMLSelectElement;
		if (select) {
			body.genreIds = Array.from(select.selectedOptions).map(o => (o as HTMLOptionElement).value);
		}
		if (editingId) {
			handleUpdate(editingId, body);
		} else {
			handleCreate(body);
		}
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการซีรีส์</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลซีรีส์</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มซีรีส์ใหม่</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขซีรีส์' : 'เพิ่มซีรีส์ใหม่'}</h2>
			<form onsubmit={onFormSubmit} class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="series-title-en" class="block text-sm font-medium text-plum mb-1">ชื่อซีรีส์ (EN) <span class="text-coral">*</span></label>
						<input id="series-title-en" type="text" name="titleEn" value={editingSeries()?.title ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="series-title-th" class="block text-sm font-medium text-plum mb-1">ชื่อซีรีส์ (TH)</label>
						<input id="series-title-th" type="text" name="titleTh" value={editingSeries()?.titleTh ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="series-studio" class="block text-sm font-medium text-plum mb-1">สตูดิโอ</label>
						<select id="series-studio" name="studioId" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">ไม่ระบุสตูดิโอ</option>
							{#each studios as studio}
								<option value={studio.id} selected={studio.id === editingSeries()?.studioId}>
									{studio.name}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="series-status" class="block text-sm font-medium text-plum mb-1">สถานะ</label>
						<select id="series-status" name="status" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="UPCOMING" selected={editingSeries()?.status === 'UPCOMING'}> upcoming</option>
							<option value="ONGOING" selected={editingSeries()?.status === 'ONGOING'}>กำลังฉาย</option>
							<option value="ENDED" selected={editingSeries()?.status === 'ENDED'}>จบแล้ว</option>
						</select>
					</div>
				</div>
				<div>
					<label for="series-genres" class="block text-sm font-medium text-plum mb-1">ประเภท</label>
					<select id="series-genres" name="genreIds" multiple size="4"
						class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
						{#each allGenres as genre}
							<option value={genre.id} selected={editingId && editingSeries()?.genres?.includes(genre.id)}>
								{genre.name}
							</option>
						{/each}
					</select>
					<p class="text-xs text-plum-light mt-1">กด Ctrl/Cmd เพื่อเลือกหลายประเภท</p>
				</div>
				<div>
					<label for="series-poster" class="block text-sm font-medium text-plum mb-1">URL โปสเตอร์</label>
					<input id="series-poster" type="url" name="posterUrl" value={editingSeries()?.poster ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
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
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ซีรีส์</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">สตูดิโอ</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-plum-light uppercase tracking-wider">สถานะ</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-plum-light uppercase tracking-wider">ตอน</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-lavender/10">
					{#if loading}
						{#each Array(4) as _, i}
							<tr class="animate-pulse">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="space-y-2">
										<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
										<div class="h-3 w-1/2 bg-lavender/10 rounded"></div>
									</div>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell"><div class="h-3 w-20 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center"><div class="h-5 w-16 bg-lavender/10 rounded-full mx-auto"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center"><div class="h-4 w-8 bg-lavender/10 rounded mx-auto"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
							</tr>
						{/each}
					{:else}
						{#each items as seriesItem (seriesItem.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="flex items-center gap-3">
										{#if seriesItem.poster}
											<img src={seriesItem.poster} alt={seriesItem.title} width={40} height={56} loading="lazy" decoding="async" class="w-10 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
										{:else}
											<div class="w-10 h-14 rounded-lg bg-lavender/10 flex items-center justify-center flex-shrink-0">
												<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
											</div>
										{/if}
										<div>
											<div class="font-medium text-plum text-sm sm:text-base">{seriesItem.title}</div>
											<div class="text-xs sm:text-sm text-plum-light">{seriesItem.titleTh}</div>
										</div>
									</div>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">{seriesItem.studio}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center">
									<span class="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium {statusConfig[seriesItem.status]?.class ?? 'bg-gray-100 text-gray-600'}">
										{statusConfig[seriesItem.status]?.text ?? seriesItem.status}
									</span>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm text-plum">{seriesItem.episodes || '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									<div class="flex items-center justify-end gap-1 sm:gap-2">
										<button onclick={() => openEdit(seriesItem)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => confirmDelete(seriesItem)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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
						<div class="w-12 h-16 rounded-lg bg-lavender/10"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
							<div class="h-3 w-1/2 bg-lavender/10 rounded"></div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-5 w-16 bg-lavender/10 rounded-full"></div>
						<div class="h-3 w-12 bg-lavender/10 rounded"></div>
						<div class="flex-1"></div>
						<div class="h-8 w-16 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each items as seriesItem (seriesItem.id)}
				<div class="glass-card rounded-2xl p-4 transition-all overflow-hidden">
					<div class="flex items-start gap-3">
						{#if seriesItem.poster}
							<img src={seriesItem.poster} alt={seriesItem.title} width={56} height={80} loading="lazy" decoding="async" class="w-14 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
						{:else}
							<div class="w-14 h-20 rounded-xl bg-lavender/10 flex items-center justify-center flex-shrink-0">
								<svg class="w-6 h-6 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-plum text-sm truncate">{seriesItem.title}</div>
							<div class="text-xs text-plum-light mt-0.5 truncate">{seriesItem.titleTh}</div>
							<div class="flex items-center gap-2 mt-2 flex-wrap">
								<span class="px-2 py-0.5 rounded-full text-[10px] font-medium {statusConfig[seriesItem.status]?.class ?? 'bg-gray-100 text-gray-600'}">
									{statusConfig[seriesItem.status]?.text ?? seriesItem.status}
								</span>
								{#if seriesItem.studio}
									<span class="text-[10px] text-plum-light truncate">{seriesItem.studio}</span>
								{/if}
								<span class="text-[10px] text-plum-light">{seriesItem.episodes || 0} ตอน</span>
							</div>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-lavender/10">
						<button onclick={() => openEdit(seriesItem)} class="px-3 py-1.5 rounded-lg bg-lavender/10 text-lavender-dark text-xs font-medium hover:bg-lavender/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							แก้ไข
						</button>
						<button onclick={() => confirmDelete(seriesItem)} class="px-3 py-1.5 rounded-lg bg-coral/10 text-coral-dark text-xs font-medium hover:bg-coral/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							ลบ
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && totalPages > 1}
		<Pagination page={page} totalPages={totalPages} total={total} limit={20} />
	{/if}

	{#if !loading && items.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบซีรีส์</h3>
			<p class="text-sm text-plum-light">ยังไม่มีซีรีส์ในระบบ กด "เพิ่มซีรีส์ใหม่" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบซีรีส์"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.title}"? การกระทำนี้ไม่สามารถย้อนกลับได้` : ''}
	onconfirm={handleDelete}
/>
