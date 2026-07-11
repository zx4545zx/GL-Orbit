<script lang="ts">
	import { editorApi, unwrapCreated } from '$lib/admin/editor-api.js';
	import type { ReferenceData, SeriesCore, GenreRef, SeriesStatus, SeriesGalleryImage } from '$lib/admin/editor-types.js';
	import SearchableSelect from './SearchableSelect.svelte';
	import EntityCreateModal from './EntityCreateModal.svelte';
	import ImageUpload from './ImageUpload.svelte';
	import Picture from '$lib/components/Picture.svelte';

	let {
		series,
		reference,
		genres = [],
		gallery = [],
		onrefresh
	}: {
		series: SeriesCore;
		reference: ReferenceData;
		genres?: GenreRef[];
		gallery?: SeriesGalleryImage[];
		onrefresh: () => void | Promise<void>;
	} = $props();

	// local form state (init from props)
	let titleEn = $state(series.titleEn);
	let titleTh = $state(series.titleTh ?? '');
	let descriptionTh = $state(series.descriptionTh ?? '');
	let descriptionEn = $state(series.descriptionEn ?? '');
	let posterUrl = $state(series.posterUrl ?? '');
	let coverUrl = $state(series.coverUrl ?? '');
	let status = $state<SeriesStatus>(series.status);
	let studioId = $state(series.studioId ?? '');
	let selectedGenreIds = $state<string[]>(genres.map((g) => g.id));
	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');
	let galleryImageUrl = $state('');
	let galleryCaption = $state('');
	let galleryBusy = $state(false);
	let galleryError = $state('');

	// selected genres: init ครั้งเดียวจาก props (edit-buffer pattern)

	function toggleGenre(id: string) {
		selectedGenreIds = selectedGenreIds.includes(id)
			? selectedGenreIds.filter((g) => g !== id)
			: [...selectedGenreIds, id];
	}

	async function save() {
		saving = true;
		error = '';
		const res = await editorApi.updateSeries(series.id, {
			titleEn: titleEn.trim(),
			titleTh: titleTh.trim() || null,
			descriptionTh: descriptionTh.trim() || null,
			descriptionEn: descriptionEn.trim() || null,
			posterUrl: posterUrl.trim() || null,
			coverUrl: coverUrl.trim() || null,
			status,
			studioId: studioId || null,
			genreIds: selectedGenreIds
		});
		saving = false;
		if (!res.ok) {
			error = res.error ?? 'บันทึกไม่สำเร็จ';
			return;
		}
		saved = true;
		setTimeout(() => (saved = false), 2000);
		await onrefresh();
	}

	// inline create modal
	let createOpen = $state(false);
	let createType = $state<'studio' | 'genre'>('studio');
	let createLoading = $state(false);
	let createError = $state('');

	function openCreateStudio() {
		createType = 'studio';
		createOpen = true;
	}
	function openCreateGenre() {
		createType = 'genre';
		createOpen = true;
	}

	async function handleCreate(values: Record<string, string>) {
		createLoading = true;
		createError = '';
		const name = values.name?.trim();
		if (!name) {
			createError = 'กรุณากรอกชื่อ';
			createLoading = false;
			return;
		}
		const res = createType === 'studio' ? await editorApi.createStudio(name) : await editorApi.createGenre(name);
		createLoading = false;
		const unwrapped = unwrapCreated(res, name);
		if (!unwrapped.ok) {
			createError = unwrapped.error;
			return;
		}
		if (createType === 'studio') {
			studioId = unwrapped.value.id;
		} else {
			selectedGenreIds = [...selectedGenreIds, unwrapped.value.id];
		}
		createOpen = false;
		await onrefresh();
	}


	async function addGalleryImage() {
		const imageUrl = galleryImageUrl.trim();
		if (!imageUrl) {
			galleryError = 'กรุณาเลือกรูปภาพสำหรับ Gallery';
			return;
		}

		galleryBusy = true;
		galleryError = '';
		const res = await editorApi.addGalleryImage(series.id, {
			imageUrl,
			caption: galleryCaption.trim() || null
		});
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'เพิ่มรูปไม่สำเร็จ';
			return;
		}
		galleryImageUrl = '';
		galleryCaption = '';
		await onrefresh();
	}

	async function removeGalleryImage(imageId: string) {
		galleryBusy = true;
		galleryError = '';
		const res = await editorApi.removeGalleryImage(series.id, imageId);
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'ลบรูปไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}

	async function moveGalleryImage(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= gallery.length) return;
		const next = [...gallery];
		[next[index], next[target]] = [next[target], next[index]];
		galleryBusy = true;
		galleryError = '';
		const res = await editorApi.reorderGalleryImages(series.id, next.map((item) => item.id));
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'จัดเรียงรูปไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}
</script>

<div class="space-y-5">
	<!-- Poster + ชื่อ -->
	<div class="flex flex-col sm:flex-row gap-5">
		<div class="grid flex-shrink-0 grid-cols-1 gap-4 sm:w-80 sm:grid-cols-2">
			<ImageUpload bind:url={posterUrl} type="posters" label="โปสเตอร์" />
			<ImageUpload bind:url={coverUrl} type="posters" label="ภาพปกแนวนอน" />
		</div>

		<div class="flex-1 space-y-4">
			<div>
				<label for="title-en" class="block text-sm font-medium text-plum mb-1.5">ชื่อซีรีส์ (EN) <span class="text-coral">*</span></label>
				<input id="title-en" type="text" bind:value={titleEn} required class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
			</div>
			<div>
				<label for="title-th" class="block text-sm font-medium text-plum mb-1.5">ชื่อซีรีส์ (TH)</label>
				<input id="title-th" type="text" bind:value={titleTh} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
			</div>
		</div>

		<div class="space-y-4">
			<div>
				<label for="description-th" class="block text-sm font-medium text-plum mb-1.5">เนื้อเรื่องย่อ (ไทย)</label>
				<textarea
					id="description-th"
					bind:value={descriptionTh}
					rows="4"
					placeholder="พิมพ์เนื้อเรื่องย่อภาษาไทย"
					class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base resize-y"
				></textarea>
			</div>
			<div>
				<label for="description-en" class="block text-sm font-medium text-plum mb-1.5">Synopsis (English)</label>
				<textarea
					id="description-en"
					bind:value={descriptionEn}
					rows="4"
					placeholder="Type English synopsis"
					class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base resize-y"
				></textarea>
			</div>
		</div>
	</div>

	<!-- สถานะ + สตูดิโอ -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div>
			<label for="status" class="block text-sm font-medium text-plum mb-1.5">สถานะ</label>
			<select id="status" bind:value={status} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base">
				<option value="UPCOMING">กำลังจะมาฉาย</option>
				<option value="ONGOING">กำลังฉาย</option>
				<option value="ENDED">จบแล้ว</option>
			</select>
		</div>
		<div class="relative">
			<div class="flex items-center justify-between mb-1.5">
				<span class="text-sm font-medium text-plum">สตูดิโอ</span>
				<button type="button" onclick={openCreateStudio} class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-coral-dark transition-colors hover:bg-coral/10 hover:text-coral">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
					สร้างใหม่
				</button>
			</div>
			<SearchableSelect bind:value={studioId} options={reference.studios.map((s) => ({ id: s.id, label: s.name }))} placeholder="ค้นหาสตูดิโอ..." emptyText="ไม่พบสตูดิโอ" />
		</div>
	</div>

	<!-- ประเภท (genres) -->
	<div class="rounded-2xl border border-lavender/20 bg-white/45 p-4">
		<div class="mb-3 flex items-center justify-between gap-3">
			<div>
				<span class="block text-sm font-semibold text-plum">ประเภทซีรีส์</span>
				<p class="mt-0.5 text-xs text-plum-light">เลือกได้หลายประเภท</p>
			</div>
			<button type="button" onclick={openCreateGenre} class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-coral-dark transition-colors hover:bg-coral/10 hover:text-coral">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
				สร้างใหม่
			</button>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each reference.genres as genre (genre.id)}
				{@const active = selectedGenreIds.includes(genre.id)}
				<button
					type="button"
					onclick={() => toggleGenre(genre.id)}
					class="px-3 py-1.5 rounded-full text-sm font-medium transition-all touch-target {active
						? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-md shadow-coral/25'
						: 'bg-white/70 text-plum-light border border-lavender/30 hover:border-coral/40'}"
				>
					{genre.name}
				</button>
			{/each}
			{#if reference.genres.length === 0}
				<p class="text-xs text-plum-light">ยังไม่มีประเภท — กด "สร้างใหม่" เพื่อเพิ่ม</p>
			{/if}
		</div>
	</div>

	<!-- Series gallery -->
	<div class="rounded-2xl border border-lavender/20 bg-white/45 p-4">
		<div class="mb-4">
			<span class="block text-sm font-semibold text-plum">Gallery รูปซีรีส์</span>
			<p class="mt-0.5 text-xs text-plum-light">ใช้แสดงในหน้า Series Detail — เรียงลำดับด้วยปุ่มขึ้น/ลง</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-[minmax(12rem,16rem)_1fr]">
			<div class="space-y-3">
				<ImageUpload bind:url={galleryImageUrl} type="posters" label="เพิ่มรูป Gallery" />
				<div>
					<label for="gallery-caption" class="block text-sm font-medium text-plum mb-1.5">Caption (ไม่บังคับ)</label>
					<input id="gallery-caption" type="text" bind:value={galleryCaption} placeholder="เช่น ฉากริมทะเล / Official still" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
				</div>
				<button type="button" onclick={addGalleryImage} disabled={galleryBusy || !galleryImageUrl.trim()} class="w-full rounded-xl bg-gradient-to-r from-lavender-dark to-coral px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-lavender/20 transition-all hover:shadow-xl disabled:opacity-60 touch-target">
					{galleryBusy ? 'กำลังเพิ่ม...' : 'เพิ่มรูป Gallery'}
				</button>
			</div>

			<div class="min-w-0">
				{#if gallery.length === 0}
					<div class="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-lavender/30 bg-white/40 p-6 text-center text-sm text-plum-light">
						ยังไม่มีรูป Gallery
					</div>
				{:else}
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each gallery as image, index (image.id)}
							<div class="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-md shadow-lavender/10">
								<div class="relative aspect-video overflow-hidden bg-lavender/10">
									<Picture src={image.imageUrl} type="posters" sizes="(max-width: 768px) 100vw, 320px" alt={image.caption ?? `Gallery ${index + 1}`} width={320} height={180} loading="lazy" class="h-full w-full object-cover" />
								</div>
								<div class="space-y-2 p-3">
									<p class="line-clamp-2 min-h-8 text-xs font-medium text-plum-light">{image.caption || 'ไม่มี caption'}</p>
									<div class="flex items-center justify-between gap-2">
										<div class="flex gap-1">
											<button type="button" onclick={() => moveGalleryImage(index, -1)} disabled={galleryBusy || index === 0} class="rounded-lg border border-lavender/25 bg-white/70 px-2 py-1 text-xs font-semibold text-plum-light disabled:opacity-40">ขึ้น</button>
											<button type="button" onclick={() => moveGalleryImage(index, 1)} disabled={galleryBusy || index === gallery.length - 1} class="rounded-lg border border-lavender/25 bg-white/70 px-2 py-1 text-xs font-semibold text-plum-light disabled:opacity-40">ลง</button>
										</div>
										<button type="button" onclick={() => removeGalleryImage(image.id)} disabled={galleryBusy} class="rounded-lg bg-coral/10 px-2 py-1 text-xs font-semibold text-coral-dark disabled:opacity-40">ลบ</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if galleryError}
			<p class="mt-3 text-sm text-coral-dark bg-coral/5 px-3 py-2 rounded-lg">{galleryError}</p>
		{/if}
	</div>

	{#if error}
		<p class="text-sm text-coral-dark bg-coral/5 px-3 py-2 rounded-lg">{error}</p>
	{/if}

	<div class="flex items-center gap-3 pt-2">
		<button
			type="button"
			onclick={save}
			disabled={saving}
			class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl transition-all text-sm sm:text-base touch-target disabled:opacity-60"
		>
			{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหลัก'}
		</button>
		{#if saved}
			<span class="text-sm text-mint-dark flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
				บันทึกแล้ว
			</span>
		{/if}
	</div>
</div>

<EntityCreateModal
	bind:open={createOpen}
	bind:loading={createLoading}
	bind:error={createError}
	title={createType === 'studio' ? 'สร้างสตูดิโอใหม่' : 'สร้างประเภทใหม่'}
	fields={[{ key: 'name', label: createType === 'studio' ? 'ชื่อสตูดิโอ' : 'ชื่อประเภท', placeholder: 'เช่น GMMTV / Romance', required: true }]}
	onsubmit={handleCreate}
/>
