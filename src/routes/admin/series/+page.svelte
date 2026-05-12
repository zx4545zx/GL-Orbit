<script lang="ts">
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: ' upcoming', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	let result = $state<any>({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
	let allSeries = $derived(result.data ?? []);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');

	$effect(() => {
		const value = data.series;
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

	function openCreate() {
		editingId = null;
		formError = '';
		showForm = true;
	}

	function openEdit(seriesItem: typeof allSeries[0]) {
		editingId = seriesItem.id;
		formError = '';
		showForm = true;
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

	const editingSeries = $derived(() => allSeries.find((s: any) => s.id === editingId));
	const studios = $derived(data.studios ?? []);
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
		<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขซีรีส์' : 'เพิ่มซีรีส์ใหม่'}</h2>
			<form method="POST" action={editingId ? '?/update' : '?/create'} use:enhance={handleEnhance} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
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

	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
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
						{#each allSeries as seriesItem (seriesItem.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="flex items-center gap-3">
										{#if seriesItem.poster}
											<img src={seriesItem.poster} alt={seriesItem.title} class="w-10 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
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
										<form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { await update(); }} class="inline">
											<input type="hidden" name="id" value={seriesItem.id} />
											<button type="submit" aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	{#if !loading && result.totalPages > 1}
		<Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} />
	{/if}

	{#if !loading && allSeries.length === 0}
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
