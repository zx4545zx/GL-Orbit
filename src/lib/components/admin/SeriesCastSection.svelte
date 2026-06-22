<script lang="ts">
	import { editorApi, unwrapCreated } from '$lib/admin/editor-api.js';
	import type { CastMember, ReferenceData } from '$lib/admin/editor-types.js';
	import SearchableSelect from './SearchableSelect.svelte';
	import EntityCreateModal from './EntityCreateModal.svelte';

	let {
		seriesId,
		cast,
		reference,
		onrefresh
	}: {
		seriesId: string;
		cast: CastMember[];
		reference: ReferenceData;
		onrefresh: () => void | Promise<void>;
	} = $props();

	// available = artists not yet in cast
	const castIds = $derived(new Set(cast.map((c) => c.id)));
	const available = $derived(reference.artists.filter((a) => !castIds.has(a.id)));

	let pickedArtistId = $state('');
	let roleName = $state('');
	let busy = $state(false);
	let error = $state('');

	async function add() {
		if (!pickedArtistId) {
			error = 'กรุณาเลือกนักแสดง';
			return;
		}
		busy = true;
		error = '';
		const res = await editorApi.addArtist(seriesId, pickedArtistId, roleName.trim() || null);
		busy = false;
		if (!res.ok) {
			error = res.error ?? 'เพิ่มไม่สำเร็จ';
			return;
		}
		pickedArtistId = '';
		roleName = '';
		await onrefresh();
	}

	async function remove(artistId: string) {
		busy = true;
		const res = await editorApi.removeArtist(seriesId, artistId);
		busy = false;
		if (!res.ok) {
			error = res.error ?? 'ลบไม่สำเร็จ';
			return;
		}
		error = '';
		await onrefresh();
	}

	// create new artist
	let createOpen = $state(false);
	let createLoading = $state(false);
	let createError = $state('');

	async function handleCreate(values: Record<string, string>) {
		createLoading = true;
		createError = '';
		const nickname = values.nickname?.trim();
		if (!nickname) {
			createError = 'กรุณากรอกชื่อเล่น';
			createLoading = false;
			return;
		}
		const fullNameEn = values.fullNameEn?.trim();
		if (!fullNameEn) {
			createError = 'กรุณากรอกชื่อเต็ม (EN)';
			createLoading = false;
			return;
		}
		const res = await editorApi.createArtist(
			nickname,
			fullNameEn,
			values.fullNameTh?.trim() || null,
			values.profileImageUrl?.trim() || null
		);
		createLoading = false;
		if (!res.ok || !res.data) {
			createError = res.error ?? 'สร้างไม่สำเร็จ';
			return;
		}
		pickedArtistId = (res.data as { id: string }).id;
		createOpen = false;
		await onrefresh();
	}
</script>

<div class="space-y-5">
	<!-- เพิ่มนักแสดง -->
	<div class="glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-semibold text-plum">เพิ่มนักแสดงในซีรีส์</h3>
			<button type="button" onclick={() => (createOpen = true)} class="text-xs font-medium text-coral-dark hover:text-coral flex items-center gap-0.5 touch-target">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
				สร้างนักแสดงใหม่
			</button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5">
			<SearchableSelect bind:value={pickedArtistId} options={available.map((a) => ({ id: a.id, label: a.fullNameEn ? `${a.nickname} (${a.fullNameEn}${a.fullNameTh ? ` · ${a.fullNameTh}` : ''})` : a.nickname }))} placeholder="ค้นหาชื่อเล่น / ชื่อ EN / ชื่อ TH..." emptyText="ไม่พบนักแสดง" />
			<input type="text" bind:value={roleName} placeholder="ชื่อตัวละคร (ถ้ามี)" class="w-full px-3 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
			<button type="button" onclick={add} disabled={busy || !pickedArtistId} class="px-4 py-2.5 rounded-xl bg-coral text-white font-medium hover:bg-coral-dark transition-colors text-sm touch-target disabled:opacity-50 whitespace-nowrap">
				เพิ่ม
			</button>
		</div>
		{#if error}
			<p class="text-xs text-coral-dark">{error}</p>
		{/if}
	</div>

	<!-- รายชื่อนักแสดง -->
	<div>
		<div class="flex items-center justify-between mb-2">
			<h3 class="text-sm font-semibold text-plum">นักแสดงในซีรีส์ <span class="text-plum-light font-normal">({cast.length})</span></h3>
		</div>
		{#if cast.length === 0}
			<div class="text-center py-8 text-sm text-plum-light bg-white/40 rounded-2xl border border-dashed border-lavender/30">
				ยังไม่มีนักแสดงในซีรีส์นี้
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
				{#each cast as member (member.id)}
					<div class="flex items-center gap-3 bg-white/70 rounded-2xl p-3 border border-lavender/15">
						<div class="w-11 h-11 rounded-full overflow-hidden bg-lavender/10 flex-shrink-0">
							{#if member.profileImageUrl}
								<img src={member.profileImageUrl} alt={member.nickname} class="w-full h-full object-cover" />
							{:else}
								<div class="w-full h-full flex items-center justify-center text-lavender-dark font-semibold text-sm">{member.nickname.charAt(0)}</div>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="font-medium text-plum text-sm truncate">{member.nickname}</div>
							{#if member.roleName}
								<div class="text-xs text-plum-light truncate">รับบท: {member.roleName}</div>
							{:else if member.fullNameEn}
								<div class="text-xs text-plum-light truncate">{member.fullNameEn}{member.fullNameTh ? ` · ${member.fullNameTh}` : ''}</div>
							{/if}
						</div>
						<button type="button" onclick={() => remove(member.id)} disabled={busy} aria-label="นำออก" class="p-2 rounded-lg hover:bg-coral/10 text-plum-light hover:text-coral-dark transition-colors touch-target disabled:opacity-50 flex-shrink-0">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<EntityCreateModal
	bind:open={createOpen}
	bind:loading={createLoading}
	bind:error={createError}
	title="สร้างนักแสดงใหม่"
	fields={[
		{ key: 'nickname', label: 'ชื่อเล่น', placeholder: 'เช่น Engfa', required: true },
		{ key: 'fullNameEn', label: 'ชื่อเต็มภาษาอังกฤษ', placeholder: 'Full name in English', required: true },
		{ key: 'fullNameTh', label: 'ชื่อเต็มภาษาไทย', placeholder: 'ชื่อเต็มภาษาไทย (ถ้ามี)' },
		{ key: 'profileImageUrl', label: 'URL รูปโปรไฟล์', type: 'url', placeholder: 'https://...' }
	]}
	onsubmit={handleCreate}
/>
