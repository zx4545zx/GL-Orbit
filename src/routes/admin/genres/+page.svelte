<script lang="ts">
	import { onMount } from 'svelte';
	import { createAdminApi } from '$lib/admin/api.js';

	const genresApi = createAdminApi<{ id: string; name: string }>('genres');

	let items = $state<{ id: string; name: string }[]>([]);
	let loading = $state(true);
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formLoading = $state(false);
	let formError = $state('');
	let deleteTarget = $state<string | null>(null);
	let deleteLoading = $state(false);

	async function loadData() {
		loading = true;
		const res = await genresApi.listAll();
		if (res.success && res.data) {
			items = res.data.data;
		}
		loading = false;
	}

	onMount(loadData);

	function openCreate() {
		editingId = null;
		formError = '';
		showForm = true;
	}

	function openEdit(genre: typeof items[0]) {
		editingId = genre.id;
		formError = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingId = null;
		formError = '';
	}

	async function onFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		formLoading = true;
		formError = '';
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!name) {
			formError = 'กรุณากรอกชื่อประเภท';
			formLoading = false;
			return;
		}

		let res;
		if (editingId) {
			res = await genresApi.update(editingId, { name });
		} else {
			res = await genresApi.create({ name });
		}

		formLoading = false;
		if (res.success) {
			closeForm();
			await loadData();
		} else {
			formError = res.error ?? 'เกิดข้อผิดพลาด';
		}
	}

	async function handleDelete(id: string) {
		deleteLoading = true;
		const res = await genresApi.remove(id);
		deleteLoading = false;
		if (res.success) {
			deleteTarget = null;
			await loadData();
		}
	}
</script>

<svelte:head>
	<title>จัดการประเภทซีรีส์ | GL-Orbit</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-plum">จัดการประเภทซีรีส์</h1>
		<button onclick={openCreate} class="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral/90 transition-colors">
			+ เพิ่มประเภท
		</button>
	</div>

	{#if showForm}
		<form onsubmit={onFormSubmit} class="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
			<div>
				<label for="genre-name" class="block text-sm font-medium text-plum mb-1">ชื่อประเภท</label>
				<input id="genre-name" name="name" type="text" required value={editingId ? items.find(g => g.id === editingId)?.name : ''}
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20" />
			</div>
			{#if formError}
				<p class="text-sm text-red-500">{formError}</p>
			{/if}
			<div class="flex gap-3">
				<button type="submit" disabled={formLoading} class="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral/90 disabled:opacity-50 transition-colors">
					{formLoading ? 'กำลังบันทึก...' : (editingId ? 'บันทึก' : 'สร้าง')}
				</button>
				<button type="button" onclick={closeForm} class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-plum hover:bg-gray-50 transition-colors">
					ยกเลิก
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
			<div class="space-y-3">
				{#each Array(4) as _}
					<div class="h-10 bg-gray-100 rounded"></div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-gray-600">
					<tr>
						<th class="px-4 py-3 text-left font-medium">ชื่อประเภท</th>
						<th class="px-4 py-3 text-right font-medium">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each items as genre}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-4 py-3">{genre.name}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									<button onclick={() => openEdit(genre)} class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 transition-colors" title="แก้ไข">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
									</button>
									<button onclick={() => deleteTarget = genre.id} class="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="ลบ">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="2" class="px-4 py-8 text-center text-gray-400">ยังไม่มีประเภทซีรีส์</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
		<div class="bg-white w-full max-w-sm rounded-xl p-6 space-y-4 shadow-xl">
			<h3 class="text-lg font-semibold text-plum">ยืนยันการลบ</h3>
			<p class="text-sm text-gray-600">ต้องการลบประเภทนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
			<div class="flex gap-3 justify-end">
				<button onclick={() => deleteTarget = null} class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-plum hover:bg-gray-50 transition-colors">
					ยกเลิก
				</button>
				<button onclick={() => handleDelete(deleteTarget!)} disabled={deleteLoading} class="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
					{deleteLoading ? 'กำลังลบ...' : 'ลบ'}
				</button>
			</div>
		</div>
	</div>
{/if}
