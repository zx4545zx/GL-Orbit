<script lang="ts">
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { PageData, ActionData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const dayColors: Record<string, string> = {
		'จันทร์': 'bg-coral/10 text-coral-dark',
		'อังคาร': 'bg-orange-100 text-orange-700',
		'พุธ': 'bg-lavender/10 text-lavender-dark',
		'พฤหัสบดี': 'bg-emerald-100 text-emerald-700',
		'ศุกร์': 'bg-teal-100 text-teal-700',
		'เสาร์': 'bg-blue-100 text-blue-700',
		'อาทิตย์': 'bg-rose-100 text-rose-700'
	};

	let result = $state<any>({ data: [], page: 1, limit: 20, total: 0, totalPages: 1 });
	let allSchedules = $derived(result.data ?? []);
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

	function openEdit(schedule: typeof allSchedules[0]) {
		editingId = schedule.id;
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
		try {
			await fetch('?/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ id: deleteTarget })
			});
		} catch {
			// silent
		}
		deleteTarget = null;
		showConfirm = false;
	}

	const editingSchedule = $derived(() => allSchedules.find((s: any) => s.id === editingId));
	const seriesList = $derived(data.seriesList ?? []);
	const platforms = $derived(data.platforms ?? []);
	const dayOptions = $derived(data.dayOptions ?? []);
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการตารางฉาย</h1>
			<p class="text-sm sm:text-base text-plum-light">จัดการตารางฉายประจำสัปดาห์ของซีรีส์</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มตารางฉาย</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขตารางฉาย' : 'เพิ่มตารางฉาย'}</h2>
			<form bind:this={formEl} method="POST" action={editingId ? '?/update' : '?/create'} use:enhance={handleEnhance} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="schedule-series" class="block text-sm font-medium text-plum mb-1">ซีรีส์ <span class="text-coral">*</span></label>
						<select id="schedule-series" name="seriesId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกซีรีส์</option>
							{#each seriesList as s}
								<option value={s.id} selected={s.id === editingSchedule()?.seriesId}>
									{s.titleEn}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="schedule-platform" class="block text-sm font-medium text-plum mb-1">แพลตฟอร์ม <span class="text-coral">*</span></label>
						<select id="schedule-platform" name="platformId" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							<option value="">เลือกแพลตฟอร์ม</option>
							{#each platforms as p}
								<option value={p.id} selected={p.id === editingSchedule()?.platformId}>
									{p.name}
								</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="schedule-day" class="block text-sm font-medium text-plum mb-1">วัน <span class="text-coral">*</span></label>
						<select id="schedule-day" name="dayOfWeek" required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base">
							{#each dayOptions as d}
								<option value={d.value} selected={d.value === editingSchedule()?.dayOfWeek}>
									{d.label}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="schedule-time" class="block text-sm font-medium text-plum mb-1">เวลา <span class="text-coral">*</span></label>
						<input id="schedule-time" type="time" name="airTime" value={editingSchedule()?.time ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div class="flex items-center gap-2">
					<input id="schedule-uncut" type="checkbox" name="isUncut" checked={editingSchedule()?.isUncut ?? false} class="w-4 h-4 rounded border-lavender/30 text-coral focus:ring-coral/30" />
					<label for="schedule-uncut" class="text-sm text-plum">Uncut Version</label>
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

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
			{#each Array(6) as _, i}
				<div class="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 animate-pulse">
					<div class="flex items-start justify-between mb-3 sm:mb-4">
						<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-lavender/10"></div>
						<div class="h-8 w-16 bg-lavender/10 rounded"></div>
					</div>
					<div class="h-4 w-3/4 bg-lavender/10 rounded mb-3 sm:mb-4"></div>
					<div class="space-y-2">
						<div class="h-3 w-full bg-lavender/10 rounded"></div>
						<div class="h-3 w-2/3 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
			{#each allSchedules as schedule (schedule.id)}
				<div class="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:shadow-lavender/10 transition-all group overflow-hidden">
					<div class="flex items-start justify-between mb-3 sm:mb-4">
						<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center">
							<svg class="w-5 h-5 sm:w-6 sm:h-6 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
							<button onclick={() => openEdit(schedule)} aria-label="แก้ไข" class="p-1.5 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							</button>
							<button onclick={() => { deleteTarget = schedule.id; showConfirm = true; }} aria-label="ลบ" class="p-1.5 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							</button>
						</div>
					</div>

					<h3 class="font-semibold text-plum text-sm sm:text-base mb-2 sm:mb-3 truncate">{schedule.series}</h3>

					<div class="space-y-1.5 sm:space-y-2">
						<div class="flex items-center gap-2 text-xs sm:text-sm">
							<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-lavender/20 flex items-center justify-center">
								<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
							</span>
							<span class="px-1.5 sm:px-2 py-0.5 rounded-md {dayColors[schedule.day] ?? 'bg-gray-100 text-gray-600'} text-[10px] sm:text-xs font-medium">{schedule.day}</span>
							<span class="text-plum font-medium">{schedule.time}</span>
						</div>
						<div class="flex items-center gap-2 text-xs sm:text-sm">
							<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-mint/20 flex items-center justify-center">
								<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
							</span>
							<span class="text-plum-light truncate">{schedule.platform}</span>
							{#if schedule.isUncut}
								<span class="px-1.5 sm:px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] sm:text-xs font-medium">Uncut</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if !loading && result.totalPages > 1}
		<Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} />
	{/if}

	{#if !loading && allSchedules.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบตารางฉาย</h3>
			<p class="text-sm text-plum-light">ยังไม่มีตารางฉายในระบบ กด "เพิ่มตารางฉาย" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบ"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบตารางฉายนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
	confirmLabel="ลบ"
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
	oncancel={() => { deleteTarget = null; }}
/>
