<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from './HaloIcon.svelte';

	let url = $state('');
	let body = $state('');
	let showUrlInput = $state(false);
	let composerState = $state<'idle' | 'resolving' | 'ready' | 'error' | 'publishing'>('idle');
	let feedback = $state('');
	let linkPreview = $state<{ provider: string; metadata: { title?: string; authorName?: string; thumbnailUrl?: string; providerName?: string } } | null>(null);
	let selectedMedia = $state<{ file: File; preview: string }[]>([]);
	let uploadedMedia = $state<Set<number>>(new Set());
	let publishedMomentId = $state<string | null>(null);
	let imageInput = $state<HTMLInputElement>();
	let bodyInput = $state<HTMLTextAreaElement>();
	let previewTimer: ReturnType<typeof setTimeout> | undefined;
	let previewController: AbortController | undefined;
	const signedIn = $derived(Boolean(page.data.user));
	const isThai = $derived(page.data.lang === 'th');
	const hasContent = $derived(Boolean(body.trim() || url.trim() || selectedMedia.length));
	const sourceReady = $derived(!url.trim() || composerState === 'ready');
	const canPublish = $derived(signedIn && hasContent && sourceReady && composerState !== 'publishing');
	const copy = $derived(
		isThai
			? {
					title: 'มีโมเมนต์ไหนอยากแชร์ไหม?',
					body: 'เล่าโมเมนต์ของคุณให้ฟังหน่อย…',
					linkLabel: 'เพิ่มลิงก์',
					linkPlaceholder: 'TikTok, X, YouTube หรือเว็บอื่น ๆ',
					checking: 'กำลังดู…',
					ready: 'เพิ่มตัวอย่างลิงก์แล้ว',
					sourceNote: 'รูปจะอัปโหลดเมื่อกดแชร์เท่านั้น',
					publish: 'แชร์เลย',
					signIn: 'เข้าสู่ระบบก่อน',
					image: 'เลือกรูปภาพ', emoji: 'เพิ่มอีโมจิ', remove: 'ลบรูปภาพ', linkError: 'ลิงก์นี้ยังดูตัวอย่างไม่ได้',
					imageError: 'เลือก JPEG, PNG หรือ WebP ขนาดไม่เกิน 4 MB ได้สูงสุด 4 รูป', failed: 'ยังแชร์ไม่สำเร็จ ลองอีกครั้งได้เลย',
					shared: 'แชร์ Moment แล้ว'
				}
			: {
					title: 'Got a moment to share?',
					body: 'Share your moment with the community…',
					linkLabel: 'Add a link',
					linkPlaceholder: 'TikTok, X, YouTube or another site',
					checking: 'Checking…',
					ready: 'Link preview added',
					sourceNote: 'Images upload only when you share',
					publish: 'Share it',
					signIn: 'Sign in first',
					image: 'Choose images', emoji: 'Add emoji', remove: 'Remove image', linkError: 'This link could not be previewed',
					imageError: 'Choose up to 4 JPEG, PNG, or WebP images under 4 MB', failed: 'Could not share yet. Try again.',
					shared: 'Moment shared'
				}
	);

	function queuePreview() {
		clearTimeout(previewTimer);
		previewController?.abort();
		if (!url.trim()) { composerState = 'idle'; linkPreview = null; return; }
		if (!isValidSourceUrl(url.trim())) { composerState = 'error'; linkPreview = null; return; }
		previewTimer = setTimeout(preview, 550);
	}

	function isValidSourceUrl(value: string) {
		try { return new URL(value).protocol === 'https:'; }
		catch { return false; }
	}

	async function preview() {
		const sourceUrl = url.trim();
		if (!sourceUrl || !signedIn || !isValidSourceUrl(sourceUrl)) return;
		composerState = 'resolving';
		previewController = new AbortController();
		try {
			const response = await fetch('/api/moments/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceUrl }), signal: previewController.signal });
			if (!response.ok) throw new Error();
			const result = await response.json() as { provider: string; metadata: { title?: string; authorName?: string; thumbnailUrl?: string; providerName?: string } };
			linkPreview = result;
			composerState = 'ready';
		} catch (error) {
			if ((error as Error).name !== 'AbortError') { linkPreview = null; composerState = 'error'; }
		}
	}

	function selectMedia(event: Event) {
		const files = [...((event.currentTarget as HTMLInputElement).files ?? [])];
		const available = 4 - selectedMedia.length;
		const accepted = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 4 * 1024 * 1024).slice(0, available);
		if (accepted.length !== files.length) feedback = copy.imageError;
		selectedMedia = [...selectedMedia, ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) }))];
		(event.currentTarget as HTMLInputElement).value = '';
	}

	function removeMedia(index: number) {
		URL.revokeObjectURL(selectedMedia[index].preview);
		selectedMedia = selectedMedia.filter((_, itemIndex) => itemIndex !== index);
		uploadedMedia = new Set([...uploadedMedia].filter((itemIndex) => itemIndex < index ? true : itemIndex > index).map((itemIndex) => itemIndex > index ? itemIndex - 1 : itemIndex));
	}

	function addEmoji() {
		body = `${body}${body && !body.endsWith(' ') ? ' ' : ''}✦`;
		bodyInput?.focus();
	}

	async function publish() {
		if (!signedIn) {
			const returnPath = `${page.url.pathname}${page.url.search}${page.url.hash}`;
			void goto(`/${page.data.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
			return;
		}
		if (!canPublish) return;
		composerState = 'publishing';
		feedback = '';
		try {
			if (!publishedMomentId) {
				const response = await fetch('/api/moments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: body.trim() || undefined, sourceUrl: url.trim() || undefined, pendingMediaCount: selectedMedia.length }) });
				if (!response.ok) throw new Error();
				publishedMomentId = (await response.json() as { id: string }).id;
			}
			for (const [index, media] of selectedMedia.entries()) {
				if (uploadedMedia.has(index)) continue;
				const formData = new FormData(); formData.set('file', media.file);
				const response = await fetch(`/api/moments/${publishedMomentId}/media`, { method: 'POST', body: formData });
				if (!response.ok) throw new Error();
				uploadedMedia = new Set([...uploadedMedia, index]);
			}
			selectedMedia.forEach(({ preview }) => URL.revokeObjectURL(preview));
			url = '';
			body = '';
			showUrlInput = false;
			selectedMedia = [];
			uploadedMedia = new Set();
			publishedMomentId = null;
			composerState = 'idle';
			feedback = copy.shared;
			await invalidateAll();
		} catch {
			composerState = 'error';
			feedback = copy.failed;
		}
	}
</script>

<section class="bg-white px-4 py-4 sm:px-5" aria-label={m.halo_composer_prompt()}>
	<div class="flex gap-3">
		<div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-coral/15 text-sm font-bold text-coral-dark">
			{page.data.user?.username?.[0]?.toUpperCase() ?? '✦'}
		</div>
		<div class="min-w-0 flex-1">
			<p class="font-display text-[15px] font-bold text-plum">{copy.title}</p>
			<label class="sr-only" for="moment-body">{copy.body}</label>
			<textarea id="moment-body" bind:this={bodyInput} bind:value={body} maxlength="2000" placeholder={copy.body} rows="2" class="mt-1 w-full resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-6 outline-none placeholder:text-plum-light/55"></textarea>

			{#if selectedMedia.length}
				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#each selectedMedia as media, index}
						<div class="group relative aspect-square overflow-hidden rounded-xl bg-cream"><img src={media.preview} alt="" class="h-full w-full object-cover" /><button type="button" onclick={() => removeMedia(index)} class="halo-focus-ring absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-plum/80 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label={copy.remove}><HaloIcon name="x" size={15} /></button></div>
					{/each}
				</div>
			{/if}

			{#if showUrlInput}
				<div class="mt-3 rounded-2xl border border-coral/20 bg-[#fff6f9] px-4 py-3">
					<label for="moment-url" class="flex items-center gap-2 text-xs font-semibold text-plum"><span class="text-coral-dark"><HaloIcon name="link" size={15} /></span>{copy.linkLabel}</label>
					<input id="moment-url" bind:value={url} oninput={queuePreview} placeholder={copy.linkPlaceholder} class="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-plum-light/55" type="url" />
					{#if composerState === 'resolving' || composerState === 'ready' || composerState === 'error'}<p class={`mt-2 text-xs ${composerState === 'ready' ? 'text-mint-dark' : composerState === 'error' ? 'text-coral-dark' : 'text-plum-light'}`}>{composerState === 'resolving' ? copy.checking : composerState === 'ready' ? copy.ready : copy.linkError}</p>{/if}
					{#if linkPreview && composerState === 'ready'}
						<div class="mt-3 flex overflow-hidden rounded-xl border border-white/80 bg-white/80">
							{#if linkPreview.metadata.thumbnailUrl}<img src={linkPreview.metadata.thumbnailUrl} alt="" class="h-14 w-20 shrink-0 object-cover" />{/if}
							<div class="min-w-0 px-3 py-2"><p class="truncate text-xs font-semibold text-plum">{linkPreview.metadata.title ?? linkPreview.metadata.providerName ?? linkPreview.provider}</p>{#if linkPreview.metadata.authorName}<p class="mt-0.5 truncate text-[11px] text-plum-light">{linkPreview.metadata.authorName}</p>{/if}</div>
						</div>
					{/if}
				</div>
			{/if}

			<div class="mt-3 flex items-center justify-between gap-3">
				<div class="flex items-center gap-1">
					<input bind:this={imageInput} onchange={selectMedia} class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple />
					<button type="button" onclick={() => imageInput?.click()} disabled={selectedMedia.length >= 4 || composerState === 'publishing'} class="halo-focus-ring grid h-11 w-11 place-items-center rounded-full text-plum-light transition hover:bg-mint/20 hover:text-mint-dark disabled:opacity-35" aria-label={copy.image}><HaloIcon name="image" size={20} /></button>
					<button type="button" onclick={addEmoji} disabled={composerState === 'publishing'} class="halo-focus-ring grid h-11 w-11 place-items-center rounded-full text-plum-light transition hover:bg-lavender/20 hover:text-lavender-dark disabled:opacity-35" aria-label={copy.emoji}><HaloIcon name="smile" size={20} /></button>
					<button type="button" onclick={() => showUrlInput = !showUrlInput} disabled={composerState === 'publishing'} class={`halo-focus-ring grid h-11 w-11 place-items-center rounded-full transition hover:bg-coral/10 hover:text-coral-dark disabled:opacity-35 ${showUrlInput ? 'bg-coral/15 text-coral-dark' : 'text-plum-light'}`} aria-label={copy.linkLabel}><HaloIcon name="link" size={20} /></button>
				</div>
				<button type="button" onclick={publish} class="halo-focus-ring shrink-0 rounded-full bg-coral px-4 py-2.5 text-xs font-bold text-white transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-45" disabled={signedIn && !canPublish}>
					{signedIn ? copy.publish : copy.signIn}
				</button>
			</div>
			<p aria-live="polite" class={`mt-2 min-h-4 text-xs ${composerState === 'error' ? 'text-coral-dark' : composerState === 'idle' && feedback === copy.shared ? 'text-mint-dark' : 'text-plum-light'}`}>{feedback}</p>
		</div>
	</div>
</section>
