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
		onrefresh,
		onmetadataDirtyChange
	}: {
		series: SeriesCore;
		reference: ReferenceData;
		genres?: GenreRef[];
		gallery?: SeriesGalleryImage[];
		onrefresh: () => void | Promise<void>;
		onmetadataDirtyChange: (dirty: boolean) => void;
	} = $props();

	let titleEn = $state(series.titleEn);
	let titleTh = $state(series.titleTh ?? '');
	let descriptionTh = $state(series.descriptionTh ?? '');
	let descriptionEn = $state(series.descriptionEn ?? '');
	let posterUrl = $state(series.posterUrl ?? '');
	let coverUrl = $state(series.coverUrl ?? '');
	let status = $state<SeriesStatus>(series.status);
	let studioId = $state(series.studioId ?? '');
	let selectedGenreIds = $state<string[]>(genres.map((genre) => genre.id));
	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');
	let activeSection = $state<'details' | 'gallery'>('details');

	let galleryImageUrl = $state('');
	let galleryCaption = $state('');
	let galleryBusy = $state(false);
	let galleryError = $state('');
	let galleryMessage = $state('');
	let galleryRetry = $state<(() => Promise<void>) | null>(null);

	const metadataDirty = $derived(
		titleEn.trim() !== series.titleEn ||
		titleTh.trim() !== (series.titleTh ?? '') ||
		descriptionTh.trim() !== (series.descriptionTh ?? '') ||
		descriptionEn.trim() !== (series.descriptionEn ?? '') ||
		posterUrl.trim() !== (series.posterUrl ?? '') ||
		coverUrl.trim() !== (series.coverUrl ?? '') ||
		status !== series.status ||
		studioId !== (series.studioId ?? '') ||
		[...selectedGenreIds].sort().join(',') !== genres.map((genre) => genre.id).sort().join(',')
	);

	$effect(() => {
		onmetadataDirtyChange(metadataDirty);
	});

	function toggleGenre(id: string) {
		selectedGenreIds = selectedGenreIds.includes(id)
			? selectedGenreIds.filter((genreId) => genreId !== id)
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

	let createOpen = $state(false);
	let createType = $state<'studio' | 'genre'>('studio');
	let createLoading = $state(false);
	let createError = $state('');

	function openCreate(type: 'studio' | 'genre') {
		createType = type;
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
		if (createType === 'studio') studioId = unwrapped.value.id;
		else selectedGenreIds = [...selectedGenreIds, unwrapped.value.id];
		createOpen = false;
		await onrefresh();
	}

	function clearGalleryFeedback() {
		galleryError = '';
		galleryMessage = '';
		galleryRetry = null;
	}

	async function addGalleryImage() {
		const imageUrl = galleryImageUrl.trim();
		if (!imageUrl) {
			galleryError = 'กรุณาเลือกรูปภาพสำหรับ Gallery';
			return;
		}
		galleryBusy = true;
		clearGalleryFeedback();
		const res = await editorApi.addGalleryImage(series.id, { imageUrl, caption: galleryCaption.trim() || null });
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'เพิ่มรูปไม่สำเร็จ';
			galleryRetry = null;
			return;
		}
		galleryImageUrl = '';
		galleryCaption = '';
		galleryMessage = 'เพิ่มรูป Gallery แล้ว · บันทึกทันทีเรียบร้อย';
		await onrefresh();
	}

	async function removeGalleryImage(imageId: string, confirmed = false) {
		if (!confirmed && !window.confirm('ลบรูปนี้ออกจาก Gallery ใช่ไหม? การเปลี่ยนแปลงจะบันทึกทันที')) return;
		galleryBusy = true;
		clearGalleryFeedback();
		const res = await editorApi.removeGalleryImage(series.id, imageId);
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'ลบรูปไม่สำเร็จ';
			galleryRetry = () => removeGalleryImage(imageId, true);
			return;
		}
		galleryMessage = 'ลบรูป Gallery แล้ว · บันทึกทันทีเรียบร้อย';
		await onrefresh();
	}

	async function moveGalleryImage(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= gallery.length) return;
		const next = [...gallery];
		[next[index], next[target]] = [next[target], next[index]];
		galleryBusy = true;
		clearGalleryFeedback();
		const res = await editorApi.reorderGalleryImages(series.id, next.map((item) => item.id));
		galleryBusy = false;
		if (!res.ok) {
			galleryError = res.error ?? 'จัดเรียงรูปไม่สำเร็จ';
			galleryRetry = () => moveGalleryImage(index, direction);
			return;
		}
		galleryMessage = 'จัดลำดับ Gallery แล้ว · บันทึกทันทีเรียบร้อย';
		await onrefresh();
	}
</script>

<div class="space-y-6">
	<div role="tablist" aria-label="จัดการข้อมูลซีรีส์" class="flex w-fit rounded-2xl border border-lavender/20 bg-white/70 p-1 shadow-sm shadow-lavender/10">
		<button type="button" role="tab" aria-selected={activeSection === 'details'} aria-controls="series-details" onclick={() => (activeSection = 'details')} class="min-h-10 rounded-xl px-4 text-sm font-bold transition {activeSection === 'details' ? 'bg-coral text-white shadow-md shadow-coral/20' : 'text-plum-light hover:text-plum'}">ข้อมูลหลัก</button>
		<button type="button" role="tab" aria-selected={activeSection === 'gallery'} aria-controls="series-gallery" onclick={() => (activeSection = 'gallery')} class="min-h-10 rounded-xl px-4 text-sm font-bold transition {activeSection === 'gallery' ? 'bg-lavender-dark text-white shadow-md shadow-lavender/20' : 'text-plum-light hover:text-plum'}">Gallery</button>
	</div>

	{#if activeSection === 'details'}
	<section id="series-details" role="tabpanel" class="overflow-hidden rounded-3xl border border-lavender/20 bg-white/55 shadow-lg shadow-lavender/5">
		<div class="border-b border-lavender/15 bg-gradient-to-r from-coral/10 via-white/30 to-lavender/10 px-4 py-4 sm:px-6">
			<p class="text-xs font-bold uppercase tracking-[0.2em] text-coral-dark">Metadata</p>
			<h2 class="mt-1 text-lg font-bold text-plum">ข้อมูลหลักของซีรีส์</h2>
			<p class="mt-1 text-sm text-plum-light">แก้ไขข้อมูลด้านล่าง แล้วกดบันทึกพร้อมกัน</p>
		</div>
		<div class="space-y-6 p-4 sm:p-6">
			<div class="grid gap-4 lg:grid-cols-2">
				<div><label for="title-en" class="mb-1.5 block text-sm font-semibold text-plum">ชื่อซีรีส์ (EN) <span class="text-coral">*</span></label><input id="title-en" type="text" bind:value={titleEn} required class="w-full rounded-xl border border-lavender/30 bg-white/75 px-4 py-3 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30" /></div>
				<div><label for="title-th" class="mb-1.5 block text-sm font-semibold text-plum">ชื่อซีรีส์ (TH)</label><input id="title-th" type="text" bind:value={titleTh} class="w-full rounded-xl border border-lavender/30 bg-white/75 px-4 py-3 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30" /></div>
				<div><label for="description-en" class="mb-1.5 block text-sm font-semibold text-plum">Synopsis (English)</label><textarea id="description-en" bind:value={descriptionEn} rows="5" placeholder="Type English synopsis" class="w-full resize-y rounded-xl border border-lavender/30 bg-white/75 px-4 py-3 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30"></textarea></div>
				<div><label for="description-th" class="mb-1.5 block text-sm font-semibold text-plum">เนื้อเรื่องย่อ (ไทย)</label><textarea id="description-th" bind:value={descriptionTh} rows="5" placeholder="พิมพ์เนื้อเรื่องย่อภาษาไทย" class="w-full resize-y rounded-xl border border-lavender/30 bg-white/75 px-4 py-3 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30"></textarea></div>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div><label for="status" class="mb-1.5 block text-sm font-semibold text-plum">สถานะ</label><select id="status" bind:value={status} class="w-full rounded-xl border border-lavender/30 bg-white/75 px-4 py-3 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30"><option value="UPCOMING">กำลังจะมาฉาย</option><option value="ONGOING">กำลังฉาย</option><option value="ENDED">จบแล้ว</option></select></div>
				<div><div class="mb-1.5 flex items-center justify-between"><span class="text-sm font-semibold text-plum">สตูดิโอ</span><button type="button" onclick={() => openCreate('studio')} class="text-xs font-bold text-coral-dark hover:text-coral">+ สร้างใหม่</button></div><SearchableSelect bind:value={studioId} options={reference.studios.map((studio) => ({ id: studio.id, label: studio.name }))} placeholder="ค้นหาสตูดิโอ..." emptyText="ไม่พบสตูดิโอ" /></div>
			</div>
			<div class="rounded-2xl border border-lavender/20 bg-lavender/5 p-4"><div class="mb-3 flex items-start justify-between gap-3"><div><h3 class="text-sm font-semibold text-plum">ประเภทซีรีส์</h3><p class="text-xs text-plum-light">เลือกได้หลายประเภท</p></div><button type="button" onclick={() => openCreate('genre')} class="text-xs font-bold text-coral-dark hover:text-coral">+ สร้างใหม่</button></div><div class="flex flex-wrap gap-2">{#each reference.genres as genre (genre.id)}{@const active = selectedGenreIds.includes(genre.id)}<button type="button" onclick={() => toggleGenre(genre.id)} class="min-h-10 rounded-full px-3 text-sm font-medium transition {active ? 'bg-coral text-white shadow-md shadow-coral/20' : 'border border-lavender/30 bg-white/75 text-plum-light hover:border-coral/40'}">{genre.name}</button>{/each}</div></div>
			<div class="border-t border-lavender/15 pt-6"><div class="mb-4"><h3 class="text-base font-bold text-plum">ภาพปกซีรีส์</h3><p class="text-sm text-plum-light">โปสเตอร์และภาพปกจะบันทึกพร้อมข้อมูลหลัก</p></div><div class="grid gap-4 sm:grid-cols-2"><div class="rounded-2xl border border-lavender/15 bg-white/60 p-3"><ImageUpload bind:url={posterUrl} type="posters" purpose="poster" label="โปสเตอร์" /></div><div class="rounded-2xl border border-lavender/15 bg-white/60 p-3"><ImageUpload bind:url={coverUrl} type="covers" purpose="cover" label="ภาพปกแนวนอน" /></div></div></div>
			{#if error}<p class="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral-dark">{error}</p>{/if}
			<div class="flex flex-wrap items-center justify-end gap-3 border-t border-lavender/15 pt-5">{#if metadataDirty}<span class="text-sm text-plum-light">มีการแก้ไขที่ยังไม่บันทึก</span>{/if}{#if saved}<span class="text-sm font-medium text-mint-dark">บันทึกแล้ว</span>{/if}<button type="button" onclick={save} disabled={saving || !metadataDirty} class="min-h-11 rounded-xl bg-gradient-to-r from-coral to-coral-dark px-5 text-sm font-bold text-white shadow-lg shadow-coral/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหลัก'}</button></div>
		</div>
	</section>

	{:else}
	<section id="series-gallery" role="tabpanel" class="overflow-hidden rounded-3xl border border-lavender/20 bg-white/55 shadow-lg shadow-lavender/5">
		<div class="border-b border-lavender/15 bg-gradient-to-r from-lavender/10 via-white/30 to-mint/10 px-4 py-4 sm:px-6"><p class="text-xs font-bold uppercase tracking-[0.2em] text-lavender-dark">Gallery</p><h2 class="mt-1 text-lg font-bold text-plum">Gallery รูปซีรีส์</h2><p class="mt-1 text-sm text-plum-light">เพิ่ม ลบ และจัดลำดับรูปจะบันทึกทันที</p></div>
		<div class="space-y-6 p-4 sm:p-6">
			<div><div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><span class="text-xs font-semibold text-lavender-dark">{gallery.length} รูป</span></div>
				<div class="grid gap-5 lg:grid-cols-[minmax(14rem,18rem)_1fr]"><div class="rounded-2xl border border-dashed border-lavender/35 bg-lavender/5 p-4"><div class="space-y-3"><ImageUpload bind:url={galleryImageUrl} type="posters" purpose="gallery" label="เพิ่มรูป Gallery" /><div><label for="gallery-caption" class="mb-1.5 block text-sm font-semibold text-plum">Caption <span class="font-normal text-plum-light">(ไม่บังคับ)</span></label><input id="gallery-caption" type="text" bind:value={galleryCaption} placeholder="เช่น ฉากริมทะเล" class="w-full rounded-xl border border-lavender/30 bg-white/75 px-3 py-2.5 text-sm text-plum focus:outline-none focus:ring-2 focus:ring-coral/30" /></div><button type="button" onclick={addGalleryImage} disabled={galleryBusy || !galleryImageUrl.trim()} class="min-h-11 w-full rounded-xl bg-gradient-to-r from-lavender-dark to-coral px-4 text-sm font-bold text-white shadow-lg shadow-lavender/20 disabled:opacity-50">{galleryBusy ? 'กำลังบันทึก...' : 'เพิ่มรูป Gallery'}</button></div></div>
					<div class="min-w-0">{#if gallery.length === 0}<div class="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-lavender/30 bg-white/40 p-6 text-center text-sm text-plum-light">ยังไม่มีรูป Gallery<br />เพิ่มรูปแรกจากด้านซ้ายได้เลย</div>{:else}<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{#each gallery as image, index (image.id)}<article class="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-md shadow-lavender/10"><div class="aspect-video overflow-hidden bg-lavender/10"><Picture src={image.imageUrl} type="posters" sizes="(max-width: 640px) 100vw, 320px" alt={image.caption ?? `Gallery ${index + 1}`} width={320} height={180} loading="lazy" class="h-full w-full object-cover" /></div><div class="space-y-3 p-3"><p class="line-clamp-2 min-h-9 text-xs text-plum-light">{image.caption || 'ไม่มี caption'}</p><div class="flex items-center justify-between gap-2"><div class="flex gap-1"><button type="button" onclick={() => moveGalleryImage(index, -1)} disabled={galleryBusy || index === 0} class="min-h-9 rounded-lg border border-lavender/25 px-2 text-xs font-semibold text-plum-light disabled:opacity-35">ขึ้น</button><button type="button" onclick={() => moveGalleryImage(index, 1)} disabled={galleryBusy || index === gallery.length - 1} class="min-h-9 rounded-lg border border-lavender/25 px-2 text-xs font-semibold text-plum-light disabled:opacity-35">ลง</button></div><button type="button" onclick={() => removeGalleryImage(image.id)} disabled={galleryBusy} class="min-h-9 rounded-lg bg-coral/10 px-2 text-xs font-bold text-coral-dark disabled:opacity-35">ลบ</button></div></div></article>{/each}</div>{/if}</div></div>
				{#if galleryMessage}<p aria-live="polite" class="mt-4 rounded-xl bg-mint/15 px-3 py-2 text-sm font-medium text-mint-dark">{galleryMessage}</p>{/if}
				{#if galleryError}<div role="alert" class="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral-dark"><span>{galleryError}</span>{#if galleryRetry}<button type="button" onclick={() => galleryRetry?.()} disabled={galleryBusy} class="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-bold text-coral-dark hover:bg-white disabled:opacity-50">ลองอีกครั้ง</button>{/if}</div>{/if}
			</div>
		</div>
	</section>
	{/if}
</div>

<EntityCreateModal bind:open={createOpen} bind:loading={createLoading} bind:error={createError} title={createType === 'studio' ? 'สร้างสตูดิโอใหม่' : 'สร้างประเภทใหม่'} fields={[{ key: 'name', label: createType === 'studio' ? 'ชื่อสตูดิโอ' : 'ชื่อประเภท', placeholder: 'เช่น GMMTV / Romance', required: true }]} onsubmit={handleCreate} />
