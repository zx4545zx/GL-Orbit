<script lang="ts">
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { editorApi } from '$lib/admin/editor-api.js';
	import type { SeriesVideo, SeriesVideoErrorCode } from '$lib/admin/editor-types.js';
	import {
		SERIES_VIDEO_TYPES,
		seriesVideoTypeLabel,
		type SeriesVideoType
	} from '$lib/series-videos/registry.js';
	import { m } from '$lib/i18n/paraglide.js';

	let { seriesId, videos, lang, onrefresh }: {
		seriesId: string;
		videos: SeriesVideo[];
		lang: 'th' | 'en';
		onrefresh: () => void | Promise<void>;
	} = $props();

	let type = $state<SeriesVideoType>('TRAILER');
	let titleTh = $state('');
	let titleEn = $state('');
	let youtubeUrl = $state('');
	let addPending = $state(false);
	let pendingType = $state<SeriesVideoType | null>(null);
	let pendingDeleteId = $state<string | null>(null);
	let deleteTargetId = $state<string | null>(null);
	let errorMessage = $state('');
	let statusMessage = $state('');
	const canAdd = $derived(Boolean(titleTh.trim() && titleEn.trim() && youtubeUrl.trim()) && !addPending);
	const videoErrorMessages: Record<SeriesVideoErrorCode, () => string> = {
		INVALID_TYPE: () => m.series_videos_error_invalid_type({}, { languageTag: lang }),
		INVALID_TITLE: () => m.series_videos_error_invalid_title({}, { languageTag: lang }),
		INVALID_YOUTUBE_URL: () => m.series_videos_error_invalid_youtube_url({}, { languageTag: lang }),
		DUPLICATE_VIDEO: () => m.series_videos_error_duplicate_video({}, { languageTag: lang }),
		INVALID_REORDER: () => m.series_videos_error_invalid_reorder({}, { languageTag: lang }),
		SERIES_NOT_FOUND: () => m.series_videos_error_series_not_found({}, { languageTag: lang }),
		VIDEO_NOT_FOUND: () => m.series_videos_error_video_not_found({}, { languageTag: lang })
	};

	function localizedError(code?: SeriesVideoErrorCode): string {
		return (code && videoErrorMessages[code]?.()) ?? m.series_videos_failure({}, { languageTag: lang });
	}

	function group(groupType: SeriesVideoType) {
		return videos.filter((video) => video.type === groupType);
	}

	async function addVideo() {
		if (!canAdd) return;
		addPending = true;
		errorMessage = '';
		statusMessage = '';
		const result = await editorApi.addSeriesVideo(seriesId, { type, titleTh, titleEn, youtubeUrl });
		addPending = false;
		if (!result.ok) {
			errorMessage = localizedError(result.code);
			return;
		}
		titleTh = '';
		titleEn = '';
		youtubeUrl = '';
		statusMessage = m.series_videos_saved();
		await onrefresh();
	}

	async function move(groupType: SeriesVideoType, index: number, offset: -1 | 1) {
		const rows = group(groupType);
		const target = index + offset;
		if (target < 0 || target >= rows.length) return;
		const ids = rows.map(({ id }) => id);
		[ids[index], ids[target]] = [ids[target], ids[index]];
		pendingType = groupType;
		errorMessage = '';
		const result = await editorApi.reorderSeriesVideos(seriesId, groupType, ids);
		pendingType = null;
		if (!result.ok) {
			errorMessage = localizedError(result.code);
			return;
		}
		statusMessage = m.series_videos_reordered();
		await onrefresh();
	}

	async function confirmDelete() {
		const id = deleteTargetId;
		deleteTargetId = null;
		if (!id) return;
		const video = videos.find((item) => item.id === id);
		pendingDeleteId = id;
		errorMessage = '';
		const result = await editorApi.removeSeriesVideo(seriesId, id);
		pendingDeleteId = null;
		if (!result.ok) {
			errorMessage = localizedError(result.code);
			return;
		}
		statusMessage = m.series_videos_deleted();
		await onrefresh();
		if (video) pendingType = null;
	}
</script>

<section class="space-y-6" aria-labelledby="series-videos-heading">
	<header class="border-b border-[var(--orbit-line)] pb-4">
		<h2 id="series-videos-heading" class="text-xl font-bold text-[var(--orbit-ink)]">{m.series_videos_heading()}</h2>
		<p class="mt-1 text-sm text-[var(--orbit-muted)]">{m.series_videos_description()} · {m.series_videos_count({ count: String(videos.length) })}</p>
	</header>

	<form class="grid gap-4 border border-[var(--orbit-line)] bg-[var(--orbit-surface)] p-4 sm:grid-cols-2" onsubmit={(event) => { event.preventDefault(); void addVideo(); }}>
		<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">{m.series_videos_type()}
			<select bind:value={type} disabled={addPending} class="orbit-control min-h-11 px-3 focus-visible:outline focus-visible:outline-2">
				{#each SERIES_VIDEO_TYPES as item}<option value={item.key}>{seriesVideoTypeLabel(item.key, lang)}</option>{/each}
			</select>
		</label>
		<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">{m.series_videos_url()}
			<input bind:value={youtubeUrl} disabled={addPending} required type="url" class="orbit-control min-h-11 px-3 focus-visible:outline focus-visible:outline-2" />
		</label>
		<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">{m.series_videos_title_th()}
			<input bind:value={titleTh} disabled={addPending} required maxlength="255" class="orbit-control min-h-11 px-3 focus-visible:outline focus-visible:outline-2" />
		</label>
		<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">{m.series_videos_title_en()}
			<input bind:value={titleEn} disabled={addPending} required maxlength="255" class="orbit-control min-h-11 px-3 focus-visible:outline focus-visible:outline-2" />
		</label>
		<button type="submit" disabled={!canAdd} class="orbit-action min-h-11 px-4 focus-visible:outline focus-visible:outline-2 sm:col-span-2">
			{addPending ? m.series_videos_add_pending() : m.series_videos_add()}
		</button>
	</form>

	{#if errorMessage}<p role="alert" class="border border-coral p-3 text-sm text-coral-dark">{errorMessage}</p>{/if}
	<p aria-live="polite" class="text-sm text-[var(--orbit-muted)]">{statusMessage}</p>

	{#each SERIES_VIDEO_TYPES as registryType}
		{@const rows = group(registryType.key)}
		<section aria-labelledby={`video-group-${registryType.key}`}>
			<h3 id={`video-group-${registryType.key}`} class="mb-2 font-bold text-[var(--orbit-ink)]">{seriesVideoTypeLabel(registryType.key, lang)} ({rows.length})</h3>
			{#if rows.length === 0}
				<p class="border border-dashed border-[var(--orbit-line)] p-4 text-sm text-[var(--orbit-muted)]">{m.series_videos_empty()}</p>
			{:else}
				<ul class="divide-y divide-[var(--orbit-line)] border border-[var(--orbit-line)]">
					{#each rows as video, index (video.id)}
						<li class="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
							<div class="min-w-0 text-sm">
								<p class="font-semibold text-[var(--orbit-ink)]">{m.series_videos_position({ position: String(index + 1) })} · {seriesVideoTypeLabel(video.type, lang)}</p>
								<p>{m.series_videos_thai_title({ title: video.titleTh })}</p>
								<p>{m.series_videos_english_title({ title: video.titleEn })}</p>
								<a class="break-all text-[var(--orbit-accent)] underline" href={video.youtubeUrl} target="_blank" rel="noreferrer">{video.youtubeUrl}</a>
							</div>
							<div class="flex gap-2">
								<button type="button" aria-label={`${m.series_videos_move_up()} ${video.titleEn}`} disabled={index === 0 || pendingType === registryType.key || pendingDeleteId !== null} onclick={() => move(registryType.key, index, -1)} class="orbit-control min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2">↑</button>
								<button type="button" aria-label={`${m.series_videos_move_down()} ${video.titleEn}`} disabled={index === rows.length - 1 || pendingType === registryType.key || pendingDeleteId !== null} onclick={() => move(registryType.key, index, 1)} class="orbit-control min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2">↓</button>
								<button type="button" aria-label={`${m.series_videos_delete()} ${video.titleEn}`} disabled={pendingType === registryType.key || pendingDeleteId === video.id} onclick={() => (deleteTargetId = video.id)} class="orbit-control min-h-11 px-3 text-coral-dark focus-visible:outline focus-visible:outline-2">{m.series_videos_delete()}</button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</section>

<ConfirmDialog
	open={deleteTargetId !== null}
	title={m.series_videos_delete_confirm_title()}
	message={m.series_videos_delete_confirm_body()}
	confirmLabel={m.series_videos_delete()}
	onconfirm={confirmDelete}
	oncancel={() => (deleteTargetId = null)}
/>
