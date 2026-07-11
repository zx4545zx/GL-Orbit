<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminFetch } from '$lib/admin/action-feedback.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import EntityCreateModal from '$lib/components/admin/EntityCreateModal.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import type { SeriesStatus } from '$lib/admin/editor-types.js';

	interface SeriesListItem {
		id: string;
		title: string;
		titleTh: string;
		poster: string;
		status: SeriesStatus;
		studio: string;
		episodes: number;
	}

	let items = $state<SeriesListItem[]>([]);
	let loading = $state(true);
	let search = $state('');
	let deleteTarget = $state<{ id: string; title: string } | null>(null);
	let showConfirm = $state(false);
	let deleting = $state(false);

	// create modal
	let createOpen = $state(false);
	let createLoading = $state(false);
	let createError = $state('');
	let createValues = $state<Record<string, string>>({});

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/admin/series?limit=999', { credentials: 'include' });
			const json = await res.json();
			items = json.data ?? [];
		} catch {
			items = [];
		}
		loading = false;
	}

	onMount(loadData);

	const filtered = $derived(
		search.trim()
			? items.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.titleTh.includes(search.trim()))
			: items
	);

	function openSeries(id: string) {
		goto(`/admin/series/${id}`);
	}

	async function handleCreate(values: Record<string, string>) {
		const titleEn = values.titleEn?.trim();
		if (!titleEn) {
			createError = 'กรุณากรอกชื่อซีรีส์ (EN)';
			return;
		}
		createLoading = true;
		createError = '';
		try {
			const res = await adminFetch('/api/admin/series', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					titleEn,
					titleTh: values.titleTh?.trim() || null,
					status: values.status || 'UPCOMING'
				})
			});
			const json = await res.json();
			createLoading = false;
			if (!res.ok || !json.success) {
				createError = json.error ?? 'สร้างไม่สำเร็จ';
				return;
			}
			createOpen = false;
			goto(`/admin/series/${json.data.id}`);
		} catch {
			createLoading = false;
			createError = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		}
	}

	function confirmDelete(item: SeriesListItem) {
		deleteTarget = { id: item.id, title: item.title };
		showConfirm = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleting = true;
		await adminFetch(`/api/admin/series/${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' });
		deleting = false;
		items = items.filter((s) => s.id !== deleteTarget!.id);
		deleteTarget = null;
	}

	function onSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
	}
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการซีรีส์</h1>
			<p class="text-sm sm:text-base text-plum-light">คลิกซีรีส์เพื่อแก้ไขข้อมูลทั้งหมดในหน้าเดียว</p>
		</div>
		<button
			onclick={() => {
				createValues = { status: 'UPCOMING' };
				createOpen = true;
			}}
			class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
			เพิ่มซีรีส์ใหม่
		</button>
	</div>

	<!-- search -->
	<form onsubmit={onSearchSubmit} class="mb-4 sm:mb-6">
		<div class="relative">
			<svg class="w-5 h-5 text-plum-light/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input
				type="text"
				bind:value={search}
				placeholder="ค้นหาซีรีส์..."
				class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-lavender/30 bg-white/70 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm"
			/>
		</div>
	</form>

	<!-- list -->
	{#if loading}
		<div class="space-y-3">
			{#each Array(6) as _}
				<div class="glass-card rounded-2xl p-4 animate-pulse flex items-center gap-3">
					<div class="w-12 h-16 rounded-xl bg-lavender/10"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 w-2/3 bg-lavender/10 rounded"></div>
						<div class="h-3 w-1/3 bg-lavender/10 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">{search ? 'ไม่พบซีรีส์ที่ค้นหา' : 'ยังไม่มีซีรีส์'}</h3>
			<p class="text-sm text-plum-light">{search ? 'ลองคำค้นอื่น' : 'กด "เพิ่มซีรีส์ใหม่" เพื่อเริ่ม'}</p>
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each filtered as item (item.id)}
				<div class="group glass-card rounded-2xl p-3 sm:p-4 transition-all hover:shadow-md hover:shadow-lavender/10 cursor-pointer" role="button" tabindex="0" onclick={() => openSeries(item.id)} onkeydown={(e) => e.key === 'Enter' && openSeries(item.id)}>
					<div class="flex items-center gap-3 sm:gap-4">
						{#if item.poster}
							<Picture src={item.poster} type="posters" sizes="160px" alt={item.title} width={48} height={64} loading="lazy" class="w-12 h-16 sm:w-14 sm:h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
						{:else}
							<div class="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-lavender/10 flex items-center justify-center flex-shrink-0">
								<svg class="w-6 h-6 text-lavender-dark/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="font-semibold text-plum text-sm sm:text-base truncate">{item.title}</h3>
								<StatusBadge status={item.status} />
							</div>
							{#if item.titleTh}
								<p class="text-xs sm:text-sm text-plum-light truncate mt-0.5">{item.titleTh}</p>
							{/if}
							<div class="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-plum-light">
								<span class="truncate">{item.studio}</span>
								<span>·</span>
								<span>{item.episodes} ตอน</span>
							</div>
						</div>
						<!-- delete (stop propagation) -->
						<button
							type="button"
							onclick={(e) => { e.stopPropagation(); confirmDelete(item); }}
							onkeydown={(e) => e.stopPropagation()}
							aria-label="ลบ"
							class="p-2 rounded-lg hover:bg-coral/10 text-plum-light/60 hover:text-coral-dark transition-colors touch-target flex-shrink-0"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						</button>
						<svg class="w-5 h-5 text-plum-light/40 group-hover:text-coral-dark group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if !loading && filtered.length > 0}
		<p class="text-xs sm:text-sm text-plum-light mt-4 px-2">
			{search.trim()
				? `พบ ${filtered.length} จาก ${items.length} ซีรีส์`
				: `ทั้งหมด ${items.length} ซีรีส์`}
		</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบซีรีส์"
	message={deleteTarget ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "${deleteTarget.title}"? การกระทำนี้ไม่สามารถย้อนกลับได้` : ''}
	onconfirm={handleDelete}
/>

<EntityCreateModal
	bind:open={createOpen}
	bind:loading={createLoading}
	bind:error={createError}
	title="เพิ่มซีรีส์ใหม่"
	submitLabel="สร้าง & แก้ไข"
	fields={[
		{ key: 'titleEn', label: 'ชื่อซีรีส์ (EN)', placeholder: 'Series name', required: true },
		{ key: 'titleTh', label: 'ชื่อซีรีส์ (TH)', placeholder: 'ชื่อไทย (ถ้ามี)' }
	]}
	onsubmit={handleCreate}
/>
