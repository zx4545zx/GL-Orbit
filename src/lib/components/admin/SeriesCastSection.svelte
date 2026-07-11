<script lang="ts">
	import { editorApi, unwrapCreated } from '$lib/admin/editor-api.js';
	import type { CastMember, ReferenceData } from '$lib/admin/editor-types.js';
	import SearchableSelect from './SearchableSelect.svelte';
	import EntityCreateModal from './EntityCreateModal.svelte';
	import Picture from '$lib/components/Picture.svelte';

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
	let addBusy = $state(false);
	let removingId = $state<string | null>(null);
	let addError = $state('');
	let removeError = $state('');
	let addOpen = $state(false);
	let expandedId = $state<string | null>(null);

	async function add() {
		if (!pickedArtistId) {
			addError = 'กรุณาเลือกนักแสดง';
			return;
		}
		addBusy = true;
		addError = '';
		const res = await editorApi.addArtist(seriesId, pickedArtistId, roleName.trim() || null);
		addBusy = false;
		if (!res.ok) {
			addError = res.error ?? 'เพิ่มไม่สำเร็จ';
			return;
		}
		pickedArtistId = '';
		roleName = '';
		addOpen = false;
		await onrefresh();
	}

	async function remove(artistId: string) {
		if (!window.confirm('ต้องการนำนักแสดงคนนี้ออกจากซีรีส์หรือไม่?')) return;
		removingId = artistId;
		removeError = '';
		const res = await editorApi.removeArtist(seriesId, artistId);
		removingId = null;
		if (!res.ok) {
			removeError = res.error ?? 'ลบไม่สำเร็จ';
			return;
		}
		expandedId = null;
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
	<!-- รายชื่อนักแสดง -->
	<div>
		<div class="flex items-center justify-between mb-2">
			<h3 class="text-sm font-semibold text-plum">นักแสดงในซีรีส์ <span class="text-plum-light font-normal">({cast.length})</span></h3>
			<button type="button" onclick={() => (addOpen = !addOpen)} class="px-3 py-1.5 rounded-lg bg-coral text-white text-xs font-medium touch-target">{addOpen ? 'ปิด' : '+ เพิ่มนักแสดง'}</button>
		</div>
		{#if addOpen}
			<div class="glass-card rounded-2xl p-4 space-y-3 mb-3">
				<div class="flex justify-end"><button type="button" onclick={() => (createOpen = true)} class="text-xs font-medium text-coral-dark hover:text-coral touch-target">+ สร้างนักแสดงใหม่</button></div>
				<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5"><SearchableSelect bind:value={pickedArtistId} options={available.map((a) => ({ id: a.id, label: a.fullNameEn ? `${a.nickname} (${a.fullNameEn}${a.fullNameTh ? ` · ${a.fullNameTh}` : ''})` : a.nickname }))} placeholder="ค้นหาชื่อเล่น / ชื่อ EN / ชื่อ TH..." emptyText="ไม่พบนักแสดง" /><input type="text" bind:value={roleName} placeholder="ชื่อตัวละคร (ถ้ามี)" class="w-full px-3 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum text-sm" /><button type="button" onclick={add} disabled={addBusy || !pickedArtistId} class="px-4 py-2.5 rounded-xl bg-coral text-white font-medium text-sm touch-target disabled:opacity-50">{addBusy ? 'กำลังเพิ่ม...' : 'เพิ่ม'}</button></div>
				{#if addError}<p class="text-xs text-coral-dark">{addError} กรุณาตรวจสอบรายการก่อนเพิ่มอีกครั้ง</p>{/if}
			</div>
		{/if}
		{#if removeError}<p class="mb-2 text-xs text-coral-dark">{removeError}</p>{/if}
		{#if cast.length === 0}
			<div class="text-center py-8 text-sm text-plum-light bg-white/40 rounded-2xl border border-dashed border-lavender/30">
				ยังไม่มีนักแสดงในซีรีส์นี้
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
				{#each cast as member (member.id)}
					{@const open = expandedId === member.id}
					<div class="bg-white/70 rounded-2xl border border-lavender/15 overflow-hidden">
						<button type="button" onclick={() => (expandedId = open ? null : member.id)} class="w-full flex items-center gap-3 p-3 text-left">
						<div class="w-11 h-11 rounded-full overflow-hidden bg-lavender/10 flex-shrink-0">
						{#if member.profileImageUrl}
							<Picture src={member.profileImageUrl} type="profiles" sizes="88px" alt={member.nickname} width={44} height={44} loading="lazy" class="w-full h-full object-cover" />
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
							</div><svg class="w-4 h-4 text-plum-light transition-transform {open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
						</button>
						{#if open}<div class="flex items-center justify-between border-t border-lavender/10 px-3 py-2 text-xs text-plum-light"><span>{member.fullNameEn || member.fullNameTh || 'ไม่มีรายละเอียดเพิ่มเติม'}</span><button type="button" onclick={() => remove(member.id)} disabled={removingId === member.id} class="text-coral-dark touch-target">{removingId === member.id ? 'กำลังนำออก...' : 'นำออกจากซีรีส์'}</button></div>{/if}
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
