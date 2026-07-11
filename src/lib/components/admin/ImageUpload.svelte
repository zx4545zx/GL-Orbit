<script lang="ts">
	import Picture from '$lib/components/Picture.svelte';
	import { getMediaDisplay, type MediaPurpose } from '$lib/images/display.js';

	let {
		url = $bindable(''),
		label = 'รูปภาพ',
		type = 'posters',
		purpose = 'poster',
		maxWidth = 1200,
		quality = 0.85
	}: {
		url?: string;
		label?: string;
		type?: 'posters' | 'profiles';
		purpose?: MediaPurpose;
		maxWidth?: number;
		quality?: number;
	} = $props();

	let loading = $state(false);
	let error = $state('');
	let uploadMessage = $state('');
	let inputRef: HTMLInputElement | undefined;
	let showManual = $state(false);

	const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
	const ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp';
	const MAX_FILE_SIZE = 5 * 1024 * 1024;
	const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;

	function clearError() {
		error = '';
		uploadMessage = '';
	}

	function pickFile() {
		inputRef?.click();
	}

	async function compressFile(file: File): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const objectUrl = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(objectUrl);
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('ไม่สามารถสร้าง canvas ได้'));
					return;
				}

				let { width, height } = img;
				const longestSide = Math.max(width, height);
				if (longestSide > maxWidth) {
					const scale = maxWidth / longestSide;
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				}

				canvas.width = width;
				canvas.height = height;
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('บีบอัดรูปไม่สำเร็จ'));
							return;
						}
						resolve(blob);
					},
					'image/jpeg',
					quality
				);
			};
			img.onerror = () => {
				URL.revokeObjectURL(objectUrl);
				reject(new Error('โหลดรูปต้นฉบับไม่สำเร็จ'));
			};
			img.src = objectUrl;
		});
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		clearError();

		if (!ACCEPTED_TYPES.includes(file.type)) {
			error = 'รองรับเฉพาะ JPEG, PNG, WebP';
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			error = 'ไฟล์ต้องไม่เกิน 5 MB';
			return;
		}

		loading = true;
		try {
			const compressed = await compressFile(file);
			if (compressed.size > MAX_UPLOAD_SIZE) {
				error = 'ไฟล์หลังบีบอัดต้องไม่เกิน 4 MB';
				return;
			}

			const uploadFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), {
				type: 'image/jpeg'
			});

			const formData = new FormData();
			formData.append('file', uploadFile);
			formData.append('type', type);

			const res = await fetch('/api/admin/upload/image', {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				error = json.error ?? 'อัปโหลดไม่สำเร็จ';
				return;
			}

			url = json.url;
			uploadMessage = 'อัปโหลดแล้ว — อย่าลืมกดบันทึกข้อมูล';
		} catch (err) {
			error = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ';
		} finally {
			loading = false;
			if (inputRef) inputRef.value = '';
		}
	}

	function clearImage() {
		url = '';
		clearError();
	}

	function toggleManual() {
		showManual = !showManual;
	}

	const isProfile = $derived(type === 'profiles');
	const display = $derived(getMediaDisplay(purpose));
	const aspectClass = $derived(isProfile ? 'aspect-square' : display.aspectClass);
	const roundedClass = $derived(isProfile ? 'rounded-full' : 'rounded-2xl');
	const placeholderIcon = $derived(
		isProfile
			? 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
			: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
	);
</script>

<div class="space-y-2">
	<span class="block text-sm font-medium text-plum">{label}</span>

	<div class="relative w-full {purpose === 'cover' || purpose === 'gallery' ? 'max-w-sm' : 'max-w-[160px]'} {aspectClass} {roundedClass} overflow-hidden bg-lavender/10 border border-lavender/20">
			{#if url}
				<Picture src={url} type={type} sizes={isProfile ? '160px' : display.sizes} alt={label} class="w-full h-full object-cover" />
			{:else}
			<div class="w-full h-full flex flex-col items-center justify-center text-lavender-dark/50 gap-1 p-2">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={placeholderIcon} />
				</svg>
				<span class="text-[10px] text-center">{isProfile ? 'ไม่มีรูปโปรไฟล์' : 'ไม่มีโปสเตอร์'}</span>
			</div>
		{/if}
		{#if loading}
			<div class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
				<svg class="animate-spin h-6 w-6 text-coral" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<input bind:this={inputRef} type="file" accept={ACCEPT_ATTRIBUTE} class="sr-only" onchange={handleFileChange} disabled={loading} />
		<button type="button" onclick={pickFile} disabled={loading} class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-coral text-white text-xs font-semibold hover:bg-coral-dark transition-colors touch-target disabled:opacity-60">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
			</svg>
			เลือกรูป
		</button>
		{#if url}
			<button type="button" onclick={clearImage} class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card text-plum text-xs font-semibold hover:bg-white/80 transition-colors touch-target">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				ลบรูป
			</button>
		{/if}
		<button type="button" onclick={toggleManual} class="text-xs text-plum-light hover:text-coral-dark underline">
			{showManual ? 'ซ่อน URL' : 'ใส่ URL เอง'}
		</button>
	</div>

	{#if showManual}
		<input
			type="url"
			bind:value={url}
			placeholder="https://..."
			class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-xs"
		/>
	{/if}

	{#if error}
		<p class="text-xs text-coral-dark">{error}</p>
	{/if}
	{#if uploadMessage}
		<p class="text-xs text-mint-dark">{uploadMessage}</p>
	{/if}

	<p class="text-[10px] text-plum-light">รองรับ JPEG, PNG, WebP · ไฟล์ต้นฉบับสูงสุด 5 MB · บีบอัดอัตโนมัติ</p>
</div>
