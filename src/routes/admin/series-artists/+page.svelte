<script lang="ts">
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let result = $state<any>({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
	let allItems = $derived(result.data ?? []);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let formEl = $state<HTMLElement | null>(null);
	let deleteTarget = $state<any>(null);
	let showConfirm = $state(false);

	$effect(() => {
		const value = data.seriesArtists;
		if (value && typeof value === 'object' && 'data' in value) {
			result = value;
			loading = false;
		} else {
			loading = true;
			Promise.resolve(value).then((s) => {
				result = s;
				loading = false;
			});
		}
	});

	$effect(() => {
		if (form?.error) {
			formError = form.error;
		}
	});

	function scrollToForm() {
		setTimeout(() => {
			formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 50);
	}

	function openCreate() {
		editingId = null;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function openEdit(item: typeof allItems[0]) {
		editingId = item.id;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	function handleEnhance() {
		formLoading = true;
		formError = '';
		return async ({ update, result: actionResult }: { update: () => Promise<void>; result: { type: string } }) => {
			formLoading = false;
			if (actionResult.type === 'success') {
				closeForm();
			}
			await update();
		};
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const fd = new FormData();
		fd.set('seriesId', deleteTarget.seriesId);
		fd.set('artistId', deleteTarget.artistId);
		await fetch('?/delete', { method: 'POST', body: fd });
		deleteTarget = null;
	}

	function confirmDelete(item: typeof allItems[0]) {
		deleteTarget = item;
		showConfirm = true;
	}

	const editingItem = $derived(() => allItems.find((i: any) => i.id === editingId));
	const seriesOptions = $derived(data.seriesList ?? []);
	const artistOptions = $derived(data.artists ?? []);

	const roleOptions = [
		{ value: 'LEAD', label: 'Lead' },
		{ value: 'SUPPORTING', label: 'Supporting' },
		{ value: 'GUEST', label: 'Guest' },
	];

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
			<form method="POST" action={editingId ? '?/update' : '?/create'} use:enhance={handleEnhance} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="sa-series" class="block text-sm font-medium text-plum mb-1">ซีรีส์ <span class="text-coral">*</span></label>
						<select id="sa-series" name="seriesId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกซีรีส์</option>
							{#each seriesOptions as s}
								<option value={s.id} selected={editingItem()?.seriesId === s.id}>{s.titleEn}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sa-artist" class="block text-sm font-medium text-plum mb-1">นักแสดง <span class="text-coral">*</span></label>
						<select id="sa-artist" name="artistId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกนักแสดง</option>
							{#each artistOptions as a}
								<option value={a.id} selected={editingItem()?.artistId === a.id}>{a.nickname}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="sa-role" class="block text-sm font-medium text-plum mb-1">บทบาท <span class="text-coral">*</span></label>
						<select id="sa-role" name="role" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกบทบาท</option>
							{#each roleOptions as r}
								<option value={r.value} selected={editingItem()?.role === r.value}>{r.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="sa-char" class="block text-sm font-medium text-plum mb-1">ชื่อตัวละคร</label>
						<input id="sa-char" type="text" name="characterName" value={editingItem()?.characterName ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
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
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ตัวละคร</th>
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
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-3 w-24 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
							</tr>
						{/each}
					{:else}
						{#each allItems as item (item.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-plum">{item.series?.title ?? '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-plum">{item.artist?.nickname ?? '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(item.role)}">
										{roleLabel(item.role)}
									</span>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light">
									{item.characterName ?? '-'}
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
							<div class="h-6 w-20 bg-lavender/10 rounded"></div>
						</div>
						<div class="flex gap-2 pt-1">
							<div class="h-8 w-16 bg-lavender/10 rounded-lg"></div>
							<div class="h-8 w-16 bg-lavender/10 rounded-lg"></div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allItems as item (item.id)}
				<div class="glass-card rounded-2xl p-4 shadow-lg shadow-lavender/5 overflow-hidden">
					<div class="flex items-start justify-between mb-3">
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-plum truncate">{item.series?.title ?? '-'}</p>
							<p class="text-sm text-plum-light truncate">{item.artist?.nickname ?? '-'}</p>
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
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {roleBadgeClass(item.role)}">
							{roleLabel(item.role)}
						</span>
						{#if item.characterName}
							<span class="text-xs text-plum-light truncate">{item.characterName}</span>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && result.totalPages > 1}
		<Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} />
	{/if}

	{#if !loading && allItems.length === 0}
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
	message="คุณแน่ใจหรือไม่ว่าต้องการลบ{deleteTarget ? ` ${deleteTarget.artist?.nickname ?? ''} ออกจาก ${deleteTarget.series?.title ?? ''}` : ''}? การกระทำนี้ไม่สามารถย้อนกลับได้"
	confirmLabel="ลบ"
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
/>
