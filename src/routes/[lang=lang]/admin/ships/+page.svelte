<script lang="ts">
	import { onMount } from 'svelte';
	import { adminFetch } from '$lib/admin/action-feedback.js';

	type AdminShip = {
		id: string;
		name: string;
		slug: string;
		imageUrl: string | null;
		isFeatured: boolean;
		isPublished: boolean;
		artist1Name: string;
		artist2Name: string;
	};

	type ArtistOption = { id: string; nickname: string; fullNameEn: string };
	type SeriesOption = { id: string; title: string; titleTh?: string };

	let ships = $state<AdminShip[]>([]);
	let artists = $state<ArtistOption[]>([]);
	let seriesOptions = $state<SeriesOption[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let errorMessage = $state('');
	let search = $state('');
	let editingId = $state<string | null>(null);

	let form = $state({
		name: '',
		slug: '',
		artist1Id: '',
		artist2Id: '',
		imageUrl: '',
		description: '',
		startedAt: '',
		hashtags: '',
		isFeatured: false,
		isPublished: false,
		seriesIds: [] as string[]
	});

	async function loadShips() {
		loading = true;
		errorMessage = '';
		try {
			const params = new URLSearchParams();
			params.set('limit', '1000');
			if (search.trim()) params.set('search', search.trim());
			const response = await adminFetch(`/api/admin/ships?${params.toString()}`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || result.error || 'โหลดข้อมูลไม่สำเร็จ');
			ships = result.data ?? [];
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ';
		} finally {
			loading = false;
		}
	}

	async function loadReferences() {
		const [artistsResponse, seriesResponse] = await Promise.all([
			adminFetch('/api/admin/artists?limit=1000'),
			adminFetch('/api/admin/series?limit=1000')
		]);
		const artistsResult = await artistsResponse.json();
		const seriesResult = await seriesResponse.json();
		artists = artistsResult.data ?? [];
		seriesOptions = (seriesResult.data ?? []).map((item: { id: string; title: string; titleTh?: string }) => ({
			id: item.id,
			title: item.title,
			titleTh: item.titleTh
		}));
	}

	onMount(async () => {
		await Promise.all([loadShips(), loadReferences()]);
	});

	function resetForm() {
		editingId = null;
		form = { name: '', slug: '', artist1Id: '', artist2Id: '', imageUrl: '', description: '', startedAt: '', hashtags: '', isFeatured: false, isPublished: false, seriesIds: [] };
		errorMessage = '';
	}

	function toggleSeries(id: string) {
		form.seriesIds = form.seriesIds.includes(id) ? form.seriesIds.filter((item) => item !== id) : [...form.seriesIds, id];
	}

	async function editShip(id: string) {
		const response = await adminFetch(`/api/admin/ships/${id}`);
		const result = await response.json();
		if (!response.ok) {
			errorMessage = result.message || result.error || 'โหลดข้อมูล Ship ไม่สำเร็จ';
			return;
		}
		const ship = result.data;
		editingId = ship.id;
		form = {
			name: ship.name ?? '',
			slug: ship.slug ?? '',
			artist1Id: ship.artist1Id ?? '',
			artist2Id: ship.artist2Id ?? '',
			imageUrl: ship.imageUrl ?? '',
			description: ship.description ?? '',
			startedAt: ship.startedAt ? ship.startedAt.slice(0, 10) : '',
			hashtags: Array.isArray(ship.hashtags) ? ship.hashtags.join(', ') : '',
			isFeatured: Boolean(ship.isFeatured),
			isPublished: Boolean(ship.isPublished),
			seriesIds: ship.seriesIds ?? []
		};
	}

	async function saveShip() {
		saving = true;
		errorMessage = '';
		try {
			const response = await adminFetch(editingId ? `/api/admin/ships/${editingId}` : '/api/admin/ships', {
				method: editingId ? 'PATCH' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(form)
			});
			const result = await response.json();
			if (!response.ok || !result.success) throw new Error(result.error || 'บันทึกไม่สำเร็จ');
			resetForm();
			await loadShips();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ';
		} finally {
			saving = false;
		}
	}

	async function deleteShip(id: string) {
		if (!confirm('ลบ Ship นี้ถาวรใช่ไหม? การลบนี้ย้อนกลับไม่ได้')) return;
		const response = await adminFetch(`/api/admin/ships/${id}`, { method: 'DELETE' });
		const result = await response.json();
		if (!response.ok || !result.success) {
			errorMessage = result.error || 'ลบไม่สำเร็จ';
			return;
		}
		await loadShips();
	}
</script>

<svelte:head>
	<title>จัดการ Ships | GL-Orbit Admin</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-sm font-semibold text-coral-dark">Admin</p>
			<h1 class="text-3xl font-bold text-plum">จัดการ Ships</h1>
			<p class="text-sm text-gray-500">เพิ่มและแก้ไขคู่จิ้น พร้อมศิลปินและผลงานร่วมกัน</p>
		</div>
		<button type="button" onclick={resetForm} class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">สร้างรายการใหม่</button>
	</header>

	{#if errorMessage}
		<div class="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
	{/if}

	<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<form onsubmit={(event) => { event.preventDefault(); saveShip(); }} class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="text-xl font-bold text-plum">{editingId ? 'แก้ไข Ship' : 'เพิ่ม Ship'}</h2>

			<label class="block text-sm font-medium text-gray-700">ชื่อ Ship
				<input bind:value={form.name} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="เช่น หลิงออม" />
			</label>
			<label class="block text-sm font-medium text-gray-700">Slug
				<input bind:value={form.slug} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="lingorm" />
			</label>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-sm font-medium text-gray-700">ศิลปินคนที่ 1
					<select bind:value={form.artist1Id} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm">
						<option value="">เลือกศิลปิน</option>
						{#each artists as artist}<option value={artist.id}>{artist.nickname} ({artist.fullNameEn})</option>{/each}
					</select>
				</label>
				<label class="block text-sm font-medium text-gray-700">ศิลปินคนที่ 2
					<select bind:value={form.artist2Id} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm">
						<option value="">เลือกศิลปิน</option>
						{#each artists as artist}<option value={artist.id}>{artist.nickname} ({artist.fullNameEn})</option>{/each}
					</select>
				</label>
			</div>
			<label class="block text-sm font-medium text-gray-700">รูปภาพ
				<input bind:value={form.imageUrl} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="https://..." />
			</label>
			<label class="block text-sm font-medium text-gray-700">คำอธิบาย
				<textarea bind:value={form.description} rows="4" class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm"></textarea>
			</label>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-sm font-medium text-gray-700">วันที่เริ่มต้น
					<input bind:value={form.startedAt} type="date" class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" />
				</label>
				<label class="block text-sm font-medium text-gray-700">Hashtags
					<input bind:value={form.hashtags} class="mt-1 w-full rounded-xl border-gray-200 px-3 py-2 shadow-sm" placeholder="lingorm, ใจซ่อนรัก" />
				</label>
			</div>

			<div class="space-y-2">
				<p class="text-sm font-medium text-gray-700">ผลงานร่วมกัน</p>
				<div class="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
					{#each seriesOptions as item}
						<label class="flex items-center gap-2 text-sm text-gray-700">
							<input type="checkbox" checked={form.seriesIds.includes(item.id)} onchange={() => toggleSeries(item.id)} />
							<span>{item.title}{item.titleTh ? ` — ${item.titleTh}` : ''}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap gap-4">
				<label class="flex items-center gap-2 text-sm text-gray-700"><input bind:checked={form.isPublished} type="checkbox" /> เผยแพร่</label>
				<label class="flex items-center gap-2 text-sm text-gray-700"><input bind:checked={form.isFeatured} type="checkbox" /> Featured</label>
			</div>

			<div class="flex gap-3">
				<button disabled={saving} type="submit" class="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
				{#if editingId}<button type="button" onclick={resetForm} class="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">ยกเลิก</button>{/if}
			</div>
		</form>

		<section class="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 class="text-xl font-bold text-plum">รายการ Ships</h2>
				<input bind:value={search} oninput={loadShips} class="rounded-xl border-gray-200 px-3 py-2 text-sm shadow-sm" placeholder="ค้นหา" />
			</div>
			{#if loading}
				<p class="text-sm text-gray-500">กำลังโหลด...</p>
			{:else if ships.length === 0}
				<p class="text-sm text-gray-500">ยังไม่มี Ships</p>
			{:else}
				<div class="divide-y divide-gray-100">
					{#each ships as ship}
						<div class="flex items-center justify-between gap-4 py-3">
							<div>
								<p class="font-semibold text-plum">{ship.name}</p>
								<p class="text-sm text-gray-500">{ship.artist1Name} × {ship.artist2Name}</p>
								<p class="text-xs text-gray-400">/{ship.slug} · {ship.isPublished ? 'เผยแพร่' : 'ฉบับร่าง'}{ship.isFeatured ? ' · Featured' : ''}</p>
							</div>
							<div class="flex gap-2">
								<button type="button" onclick={() => editShip(ship.id)} class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">แก้ไข</button>
								<button type="button" onclick={() => deleteShip(ship.id)} class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">ลบถาวร</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</section>
</div>
