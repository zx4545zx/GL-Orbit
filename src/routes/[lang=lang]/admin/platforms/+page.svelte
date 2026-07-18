<script lang="ts">
	import { onMount } from 'svelte';
	import { createAdminApi } from '$lib/admin/api.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	const platformsApi = createAdminApi<any>('platforms');

	let result = $state<any>({ data: [], total: 0 });
	let allPlatforms = $derived(result.data ?? []);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let showConfirm = $state(false);
	let formEl = $state<HTMLDivElement | null>(null);

	async function loadData() {
		loading = true;
		try {
			const res = await platformsApi.listAll();
			if (res.success && res.data) {
				result = res.data;
			} else {
				formError = res.error || 'ไม่สามารถโหลดข้อมูลได้';
			}
		} catch {
			formError = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
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

	function openEdit(platform: typeof allPlatforms[0]) {
		editingId = platform.id;
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
		const form = e.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		const body: Record<string, string | null> = {
			name: (data.get('name') as string)?.trim() ?? '',
			logoUrl: (data.get('logoUrl') as string)?.trim() || null,
			baseUrl: (data.get('baseUrl') as string)?.trim() || null
		};
		if (!body.name) {
			formError = 'กรุณากรอกชื่อแพลตฟอร์ม';
			formLoading = false;
			return;
		}
		try {
			const res = editingId
				? await platformsApi.update(editingId, body)
				: await platformsApi.create(body);
			if (res.success) {
				closeForm();
				await loadData();
			} else {
				formError = res.error || 'เกิดข้อผิดพลาด';
			}
		} catch {
			formError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		} finally {
			formLoading = false;
		}
	}

	function confirmDelete(platform: typeof allPlatforms[0]) {
		deleteTarget = { id: platform.id, name: platform.name };
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		const target = deleteTarget;
		try {
			const res = await platformsApi.remove(target.id);
			if (res.success) {
				result = { ...result, data: result.data.filter((p: any) => p.id !== target.id), total: result.total - 1 };
			}
		} catch { /* ignore */ }
		deleteTarget = null;
	}

	const editingPlatform = $derived(() => allPlatforms.find((p: any) => p.id === editingId));
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการแพลตฟอร์ม</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลแพลตฟอร์มสตรีมมิ่ง</p>
		</div>
		<button onclick={openCreate} class="orbit-action px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มแพลตฟอร์ม</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	{#if showForm}
		<div bind:this={formEl} class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-lavender/5">
			<h2 class="text-lg font-semibold text-plum mb-4">{editingId ? 'แก้ไขแพลตฟอร์ม' : 'เพิ่มแพลตฟอร์ม'}</h2>
			<form onsubmit={handleSubmit} class="space-y-4">
				{#if editingId}
					<input type="hidden" name="id" value={editingId} />
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="platform-name" class="block text-sm font-medium text-plum mb-1">ชื่อแพลตฟอร์ม <span class="text-coral">*</span></label>
						<input id="platform-name" type="text" name="name" value={editingPlatform()?.name ?? ''} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
					<div>
						<label for="platform-logo" class="block text-sm font-medium text-plum mb-1">URL โลโก้</label>
						<input id="platform-logo" type="url" name="logoUrl" value={editingPlatform()?.logoUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
					</div>
				</div>
				<div>
					<label for="platform-url" class="block text-sm font-medium text-plum mb-1">URL หน้าแรก</label>
					<input id="platform-url" type="url" name="baseUrl" value={editingPlatform()?.baseUrl ?? ''} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base" />
				</div>
				{#if formError}
					<p class="text-sm text-coral-dark">{formError}</p>
				{/if}
				<div class="flex gap-2 pt-2">
					<button type="submit" disabled={formLoading} class="orbit-action px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm sm:text-base touch-target disabled:opacity-50">
						{formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
					</button>
					<button type="button" onclick={closeForm} class="orbit-control px-5 py-2.5 rounded-xl font-medium transition-colors text-sm sm:text-base touch-target">ยกเลิก</button>
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
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">แพลตฟอร์ม</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">URL หน้าแรก</th>
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
						{#each allPlatforms as platform (platform.id)}
							<tr class="hover:bg-white/40 transition-colors">
								<td class="px-4 sm:px-6 py-3 sm:py-4">
									<div class="flex items-center gap-3">
										{#if platform.logoUrl}
											<img src={platform.logoUrl} alt={platform.name} width={40} height={40} loading="lazy" decoding="async" class="w-10 h-10 rounded-full object-cover border border-lavender/30" />
										{:else}
											<div class="w-10 h-10 rounded-full bg-lavender/10 flex items-center justify-center border border-lavender/30">
												<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
											</div>
										{/if}
										<span class="font-medium text-plum text-sm sm:text-base">{platform.name}</span>
									</div>
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">
									{#if platform.baseUrl}
										<a href={platform.baseUrl} target="_blank" rel="noopener noreferrer" class="hover:text-coral-dark hover:underline">{platform.baseUrl}</a>
									{:else}
										<span class="text-plum-light/50">-</span>
									{/if}
								</td>
								<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
									<div class="flex items-center justify-end gap-1 sm:gap-2">
										<button onclick={() => openEdit(platform)} aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
										</button>
										<button onclick={() => confirmDelete(platform)} aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
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
						<div class="w-10 h-10 rounded-full bg-lavender/10 flex-shrink-0"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded"></div>
							<div class="h-3 w-1/2 bg-lavender/10 rounded"></div>
						</div>
					</div>
					<div class="flex justify-end pt-2">
						<div class="h-8 w-24 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		{:else}
			{#each allPlatforms as platform (platform.id)}
				<div class="glass-card rounded-2xl p-4 transition-all overflow-hidden">
					<div class="flex items-center gap-3">
						{#if platform.logoUrl}
							<img src={platform.logoUrl} alt={platform.name} width={40} height={40} loading="lazy" decoding="async" class="w-10 h-10 rounded-full object-cover border border-lavender/30 flex-shrink-0" />
						{:else}
							<div class="w-10 h-10 rounded-full bg-lavender/10 flex items-center justify-center border border-lavender/30 flex-shrink-0">
								<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-plum text-sm truncate">{platform.name}</div>
							{#if platform.baseUrl}
								<p class="text-xs text-plum-light truncate mt-0.5">{platform.baseUrl}</p>
							{:else}
								<p class="text-xs text-plum-light/50 mt-0.5">-</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-lavender/10">
						<button onclick={() => openEdit(platform)} class="px-3 py-1.5 rounded-lg bg-lavender/10 text-lavender-dark text-xs font-medium hover:bg-lavender/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
							แก้ไข
						</button>
						<button onclick={() => confirmDelete(platform)} class="px-3 py-1.5 rounded-lg bg-coral/10 text-coral-dark text-xs font-medium hover:bg-coral/20 transition-colors touch-target flex items-center gap-1">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
							ลบ
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && result.total > 0}
		<p class="text-xs sm:text-sm text-plum-light mt-4 px-2">ทั้งหมด {result.total} ช่องทาง</p>
	{/if}

	{#if !loading && allPlatforms.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบแพลตฟอร์ม</h3>
			<p class="text-sm text-plum-light">ยังไม่มีแพลตฟอร์มในระบบ กด "เพิ่มแพลตฟอร์ม" เพื่อเพิ่มข้อมูล</p>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบแพลตฟอร์ม"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้` : ''}
	onconfirm={handleDelete}
/>
