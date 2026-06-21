<script lang="ts">
	import { onMount } from 'svelte';
	import { createAdminApi } from '$lib/admin/api.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	interface Studio {
		id: string;
		name: string;
		logoUrl?: string;
		officialSite?: string;
	}

	const studiosApi = createAdminApi<Studio>('studios');

	let items = $state<Studio[]>([]);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let total = $state(0);

	let formEl = $state<HTMLElement | null>(null);
	let showConfirm = $state(false);
	let deleteTarget = $state<string | null>(null);
	let deleteLoading = $state(false);

	function scrollToForm() {
		setTimeout(() => {
			formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 50);
	}

	async function loadData() {
		loading = true;
		const res = await studiosApi.listAll();
		if (res.success && res.data) {
			items = res.data.data;
			total = res.data.total;
		}
		loading = false;
	}

	onMount(() => {
		loadData();
	});

	function openCreate() {
		editingId = null;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function openEdit(studio: Studio) {
		editingId = studio.id;
		formError = '';
		showForm = true;
		scrollToForm();
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	const editingStudio = $derived(() => items.find((s) => s.id === editingId));

	async function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		formLoading = true;
		formError = '';
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const name = formData.get('name')?.toString().trim() ?? '';
		const logoUrl = formData.get('logoUrl')?.toString().trim() || undefined;
		const officialSite = formData.get('officialSite')?.toString().trim() || undefined;

		if (!name) {
			formError = 'กรุณากรอกชื่อสตูดิโอ';
			formLoading = false;
			return;
		}

		let res;
		if (editingId) {
			res = await studiosApi.update(editingId, { name, logoUrl, officialSite });
		} else {
			res = await studiosApi.create({ name, logoUrl, officialSite });
		}

		formLoading = false;
		if (res.success) {
			closeForm();
			await loadData();
		} else {
			formError = res.error ?? 'เกิดข้อผิดพลาด';
		}
	}

	function confirmDelete(studio: Studio) {
		deleteTarget = studio.id;
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleteLoading = true;
		const res = await studiosApi.remove(deleteTarget);
		deleteLoading = false;
		if (res.success) {
			deleteTarget = null;
			showConfirm = false;
			await loadData();
		} else {
			deleteTarget = null;
			showConfirm = false;
		}
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการสตูดิโอ</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลสตูดิโอ</p>
		</div>
		<button onclick={openCreate} class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มสตูดิโอ</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขสตูดิโอ' : 'เพิ่มสตูดิโอ'}</h2>
			<form onsubmit={onFormSubmit} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="studio-name" class="block text-sm font-medium text-plum mb-1">ชื่อสตูดิโอ <span class="text-coral">*</span></label>
						<input id="studio-name" type="text" name="name" value={editingStudio()?.name ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="studio-logo" class="block text-sm font-medium text-plum mb-1">URL โลโก้</label>
						<input id="studio-logo" type="url" name="logoUrl" value={editingStudio()?.logoUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div>
					<label for="studio-site" class="block text-sm font-medium text-plum mb-1">เว็บไซต์ทางการ</label>
					<input id="studio-site" type="url" name="officialSite" value={editingStudio()?.officialSite ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
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

	<!-- Desktop: Table -->
	<div class="hidden md:block">
		<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
			<div class="overflow-x-auto -mx-px">
				<table class="w-full min-w-[600px]">
					<thead>
						<tr class="border-b border-lavender/20">
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">สตูดิโอ</th>
							<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">เว็บไซต์</th>
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
							{#each items as studio (studio.id)}
								<tr class="hover:bg-white/40 transition-colors">
									<td class="px-4 sm:px-6 py-3 sm:py-4">
										<div class="flex items-center gap-3">
											{#if studio.logoUrl}
												<img src={studio.logoUrl} alt={studio.name} width={40} height={40} loading="lazy" decoding="async" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
											{:else}
												<div class="w-10 h-10 rounded-lg bg-lavender/10 flex items-center justify-center">
													<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg>
												</div>
											{/if}
											<span class="font-medium text-plum text-sm sm:text-base">{studio.name}</span>
										</div>
									</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">
										{#if studio.officialSite}
											<a href={studio.officialSite} target="_blank" rel="noopener noreferrer" class="hover:text-coral-dark hover:underline">{studio.officialSite}</a>
										{:else}
											<span class="text-plum-light/50">-</span>
										{/if}
									</td>
									<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
										<div class="flex items-center justify-end gap-1 sm:gap-2">
											<button onclick={() => openEdit(studio)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
											</button>
											<button onclick={() => confirmDelete(studio)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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

	<!-- Mobile: Card Grid -->
	<div class="block md:hidden space-y-3">
		{#if loading}
			{#each Array(4) as _, i}
				<div class="glass-card rounded-xl p-4 animate-pulse" class:opacity-60={i > 1}>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-lavender/10 shrink-0"></div>
						<div class="flex-1 min-w-0 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
							<div class="h-3 w-32 bg-lavender/10 rounded"></div>
						</div>
						<div class="flex gap-1 shrink-0">
							<div class="w-8 h-8 rounded-lg bg-lavender/10"></div>
							<div class="w-8 h-8 rounded-lg bg-coral/10"></div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			{#each items as studio (studio.id)}
				<div class="glass-card rounded-xl p-3 sm:p-4 overflow-hidden">
					<div class="flex items-center gap-3">
						{#if studio.logoUrl}
							<img src={studio.logoUrl} alt={studio.name} width={40} height={40} loading="lazy" decoding="async" class="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
						{:else}
							<div class="w-10 h-10 rounded-lg bg-lavender/10 flex items-center justify-center shrink-0">
								<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium text-plum text-sm truncate">{studio.name}</p>
							{#if studio.officialSite}
								<a href={studio.officialSite} target="_blank" rel="noopener noreferrer" class="text-xs text-plum-light hover:text-coral-dark truncate block max-w-[180px] sm:max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{studio.officialSite}</a>
							{:else}
								<span class="text-xs text-plum-light/50">-</span>
							{/if}
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button onclick={() => openEdit(studio)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg glass-card text-plum-light hover:text-lavender-dark touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							</button>
							<button onclick={() => confirmDelete(studio)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg glass-card text-plum-light hover:text-coral-dark touch-target">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && total > 0}
		<p class="text-xs sm:text-sm text-plum-light mt-4 px-2">ทั้งหมด {total} สตูดิโอ</p>
	{/if}

	{#if !loading && items.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบสตูดิโอ</h3>
			<p class="text-sm text-plum-light">ยังไม่มีสตูดิโอในระบบ กด "เพิ่มสตูดิโอ" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบสตูดิโอ"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบสตูดิโอนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
	confirmLabel={deleteLoading ? 'กำลังลบ...' : 'ลบ'}
	cancelLabel="ยกเลิก"
	danger={true}
	onconfirm={handleDelete}
/>
