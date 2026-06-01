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

	let deleteTarget = $state<string | null>(null);
	let showConfirm = $state(false);

	$effect(() => {
		const value = data.schedules;
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

	function confirmDelete(id: string) {
		deleteTarget = id;
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const fd = new FormData();
		fd.append('id', deleteTarget);
		await fetch('?/delete', { method: 'POST', body: fd });
		deleteTarget = null;
		showConfirm = false;
		window.location.reload();
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

	const editingItem = $derived(() => allItems.find((i: any) => i.id === editingId));
	const episodeOptions = $derived(data.episodes ?? []);
	const platformOptions = $derived(data.platforms ?? []);

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatTime(timeStr: string | null) {
		if (!timeStr) return '-';
		return timeStr.slice(0, 5);
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการตารางฉายรายตอน</h1>
			<p class="text-sm sm:text-base text-plum-light">จัดการตารางฉายแบบรายตอนของซีรีส์</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มตารางฉายรายตอน</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไข' : 'เพิ่ม'}ตารางฉายรายตอน</h2>
			<form method="POST" action={editingId ? '?/update' : '?/create'} use:enhance={handleEnhance} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="es-episode" class="block text-sm font-medium text-plum mb-1">ตอน <span class="text-coral">*</span></label>
						<select id="es-episode" name="episodeId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกตอน</option>
							{#each episodeOptions as e}
								<option value={e.id} selected={editingItem()?.episodeId === e.id}>{e.seriesTitle} — ตอนที่ {e.episodeNumber}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="es-platform" class="block text-sm font-medium text-plum mb-1">แพลตฟอร์ม <span class="text-coral">*</span></label>
						<select id="es-platform" name="platformId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกแพลตฟอร์ม</option>
							{#each platformOptions as p}
								<option value={p.id} selected={editingItem()?.platformId === p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="es-date" class="block text-sm font-medium text-plum mb-1">วันที่ฉาย <span class="text-coral">*</span></label>
						<input id="es-date" type="date" name="airDate" value={editingItem()?.airDate ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="es-time" class="block text-sm font-medium text-plum mb-1">เวลาฉาย <span class="text-coral">*</span></label>
						<input id="es-time" type="time" name="airTime" value={editingItem()?.airTime ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="es-url" class="block text-sm font-medium text-plum mb-1">ลิงก์สตรีม</label>
						<input id="es-url" type="url" name="streamUrl" value={editingItem()?.streamUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
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
	<div class="hidden md:block">
		<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
			<div class="overflow-x-auto -mx-px">
				<table class="w-full min-w-[700px]">
					<thead>
						<tr class="border-b border-lavender/20">
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ซีรีส์</th>
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">ตอน</th>
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">แพลตฟอร์ม</th>
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">วันที่</th>
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-lavender/10">
						{#if loading}
							{#each Array(4) as _, i}
								<tr class="animate-pulse">
									<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-4 w-24 bg-lavender/10 rounded"></div></td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell"><div class="h-3 w-12 bg-lavender/10 rounded"></div></td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell"><div class="h-3 w-16 bg-lavender/10 rounded"></div></td>
									<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-3 w-20 bg-lavender/10 rounded"></div></td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
								</tr>
							{/each}
						{:else}
							{#each allItems as item (item.id)}
								<tr class="hover:bg-white/40 transition-colors">
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-sm text-plum">{item.series?.title ?? '-'}</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">
										{#if item.episode}
											ตอนที่ {item.episode.episodeNumber}: {item.episode.title}
										{:else}
											-
										{/if}
									</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">
										{item.platform?.name ?? '-'}
									</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light">
										<div class="flex flex-col">
											<span>{formatDate(item.airDate)}</span>
											<span class="text-plum-light/60">{formatTime(item.airTime)}</span>
										</div>
									</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
										<div class="flex items-center justify-end gap-1 sm:gap-2">
											<button onclick={() => openEdit(item)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
											</button>
											<button onclick={() => confirmDelete(item.id)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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
	</div>

	<!-- Mobile Cards -->
	<div class="block md:hidden space-y-3">
		{#if loading}
			{#each Array(4) as _, i}
				<div class="glass-card rounded-2xl p-4 animate-pulse">
					<div class="h-4 w-3/4 bg-lavender/10 rounded mb-3"></div>
					<div class="space-y-2">
						<div class="h-3 w-full bg-lavender/10 rounded"></div>
						<div class="h-3 w-2/3 bg-lavender/10 rounded"></div>
					</div>
					<div class="flex justify-end gap-2 mt-3 pt-3 border-t border-lavender/10">
						<div class="h-8 w-16 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allItems as item (item.id)}
				<div class="glass-card rounded-2xl p-4 overflow-hidden">
					<div class="flex items-start justify-between mb-2">
						<h3 class="font-semibold text-plum text-sm leading-snug min-w-0 truncate">{item.series?.title ?? '-'}</h3>
						{#if item.isUncut}
							<span class="shrink-0 ml-2 px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] font-medium">Uncut</span>
						{/if}
					</div>
					<div class="space-y-1.5 mb-3">
						<div class="flex items-center gap-2 text-xs text-plum-light">
							<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
							{#if item.episode}
								<span class="truncate">ตอนที่ {item.episode.episodeNumber}: {item.episode.title}</span>
							{:else}
								<span class="truncate">-</span>
							{/if}
						</div>
						<div class="flex items-center gap-2 text-xs text-plum-light">
							<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
							<span class="truncate">{item.platform?.name ?? '-'}</span>
						</div>
						<div class="flex items-center gap-2 text-xs text-plum-light">
							<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
							<span>{formatDate(item.airDate)}</span>
							<span class="text-plum-light/60">{formatTime(item.airTime)}</span>
						</div>
					</div>
					<div class="flex items-center justify-end gap-2 pt-2.5 border-t border-lavender/10">
						<button onclick={() => openEdit(item)} aria-label="แก้ไข" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-lavender-dark hover:bg-lavender/10 transition-colors touch-target">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							แก้ไข
						</button>
						<button onclick={() => confirmDelete(item.id)} aria-label="ลบ" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-coral-dark hover:bg-coral/10 transition-colors touch-target">
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

	{#if !loading && allItems.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบข้อมูล</h3>
			<p class="text-sm text-plum-light">ยังไม่มีตารางฉายรายตอน กด "เพิ่ม" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	open={showConfirm}
	title="ยืนยันการลบ"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบตารางฉายรายตอนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
	confirmLabel="ลบ"
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
	oncancel={() => { showConfirm = false; }}
/>
