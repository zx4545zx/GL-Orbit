<script lang="ts">
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let result = $state<any>({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
	let allEpisodes = $derived(result.data ?? []);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');

	let formEl = $state<HTMLElement | null>(null);
	let deleteTarget = $state<string | null>(null);
	let showConfirm = $state(false);

	$effect(() => {
		const value = data.episodes;
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

	function openEdit(episode: typeof allEpisodes[0]) {
		editingId = episode.id;
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
		window.location.reload();
	}

	function cancelDelete() {
		deleteTarget = null;
	}

	const editingEpisode = $derived(() => allEpisodes.find((e: any) => e.id === editingId));
	const seriesList = $derived(data.seriesList ?? []);
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการตอน</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลตอนของซีรีส์</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มตอน</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขตอน' : 'เพิ่มตอน'}</h2>
			<form bind:this={formEl} method="POST" action={editingId ? '?/update' : '?/create'} use:enhance={handleEnhance} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="ep-series" class="block text-sm font-medium text-plum mb-1">ซีรีส์ <span class="text-coral">*</span></label>
						<select id="ep-series" name="seriesId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกซีรีส์</option>
							{#each seriesList as s}
								<option value={s.id} selected={s.id === editingEpisode()?.seriesId}>
									{s.titleEn}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="ep-number" class="block text-sm font-medium text-plum mb-1">ตอนที่ <span class="text-coral">*</span></label>
						<input id="ep-number" type="number" name="episodeNumber" min="1" value={editingEpisode()?.episodeNumber ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div>
					<label for="ep-title" class="block text-sm font-medium text-plum mb-1">ชื่อตอน</label>
					<input id="ep-title" type="text" name="title" value={editingEpisode()?.title ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="ep-cover" class="block text-sm font-medium text-plum mb-1">URL รูปปก</label>
						<input id="ep-cover" type="url" name="coverUrl" value={editingEpisode()?.coverUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="ep-trailer" class="block text-sm font-medium text-plum mb-1">URL ตัวอย่าง</label>
						<input id="ep-trailer" type="url" name="trailerUrl" value={editingEpisode()?.trailerUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
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

	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
		<!-- Desktop table -->
		<div class="hidden md:block overflow-x-auto -mx-px">
			<table class="w-full min-w-[600px]">
				<thead>
					<tr class="border-b border-lavender/20">
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ซีรีส์</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-plum-light uppercase tracking-wider">ตอนที่</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">ชื่อตอน</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-lavender/10">
					{#if loading}
						{#each Array(4) as _, i}
							<tr class="animate-pulse">
								<td class="px-4 sm:px-6 py-3 sm:py-4"><div class="h-4 w-3/4 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center"><div class="h-4 w-8 bg-lavender/10 rounded mx-auto"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell"><div class="h-3 w-32 bg-lavender/10 rounded"></div></td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right"><div class="h-8 w-16 bg-lavender/10 rounded ml-auto"></div></td>
							</tr>
						{/each}
					{:else}
						{#each allEpisodes as episode (episode.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="font-medium text-plum text-sm sm:text-base">{episode.seriesTitle}</div>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm text-plum font-semibold">{episode.episodeNumber}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">{episode.title ?? '-'}</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									<div class="flex items-center justify-end gap-1 sm:gap-2">
										<button onclick={() => openEdit(episode)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => confirmDelete(episode.id)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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

		<!-- Mobile cards -->
		<div class="block md:hidden p-4 space-y-3">
			{#if loading}
				{#each Array(4) as _, i}
					<div class="glass-card rounded-2xl p-4 animate-pulse">
						<div class="h-4 w-3/4 bg-lavender/10 rounded mb-3"></div>
						<div class="h-3 w-12 bg-lavender/10 rounded mb-2"></div>
						<div class="h-3 w-2/3 bg-lavender/10 rounded mb-4"></div>
						<div class="flex gap-2">
							<div class="h-8 w-14 bg-lavender/10 rounded"></div>
							<div class="h-8 w-14 bg-lavender/10 rounded"></div>
						</div>
					</div>
				{/each}
			{:else}
				{#each allEpisodes as episode (episode.id)}
					<div class="glass-card rounded-2xl p-4 overflow-hidden">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<h3 class="font-medium text-plum text-sm truncate">{episode.seriesTitle}</h3>
								<p class="text-xs text-plum-light mt-0.5">ตอนที่ {episode.episodeNumber}</p>
								<p class="text-xs text-plum-light mt-0.5 truncate">{episode.title ?? '-'}</p>
							</div>
							<div class="flex items-center gap-1 shrink-0">
								<button onclick={() => openEdit(episode)} aria-label="แก้ไข" class="p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
								</button>
								<button onclick={() => confirmDelete(episode.id)} aria-label="ลบ" class="p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	{#if !loading && result.totalPages > 1}
		<Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} />
	{/if}

	{#if !loading && allEpisodes.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบตอน</h3>
			<p class="text-sm text-plum-light">ยังไม่มีตอนในระบบ กด "เพิ่มตอน" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบตอน"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบตอนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
	confirmLabel="ลบ"
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
	oncancel={cancelDelete}
/>
