<script lang="ts">
	import { editorApi } from '$lib/admin/editor-api.js';
	import SearchableSelect from './SearchableSelect.svelte';
	import type { Episode, EpisodeSchedule, ReferenceData } from '$lib/admin/editor-types.js';

	let {
		seriesId,
		episodes,
		reference,
		onrefresh
	}: {
		seriesId: string;
		episodes: Episode[];
		reference: ReferenceData;
		onrefresh: () => void | Promise<void>;
	} = $props();

	let busy = $state(false);
	let busyText = $state('');
	let error = $state('');
	let expandedId = $state<string | null>(null);

	// single edit buffer — เฉพาะตอนที่กำลังแก้ (expandedId เดียวก็เพียงพอ)
	let editing = $state(false);
	let editTitle = $state('');
	let editCover = $state('');
	let editTrailer = $state('');

	// single add-schedule form — เฉพาะตอนที่ขยายอยู่
	let schedPlatformId = $state('');
	let schedTitle = $state('');
	let schedAirDate = $state('');
	let schedStreamLink = $state('');
	let schedIsUncut = $state(false);

	// schedule editing state
	let scheduleEditId = $state<string | null>(null);
	let schedEditPlatformId = $state('');
	let schedEditTitle = $state('');
	let schedEditAirDate = $state('');
	let schedEditStreamLink = $state('');
	let schedEditIsUncut = $state(false);

	function toggle(id: string) {
		if (expandedId === id) {
			expandedId = null;
		} else {
			expandedId = id;
			resetForms();
		}
	}

	function resetForms() {
		editing = false;
		scheduleEditId = null;
		schedPlatformId = '';
		schedTitle = '';
		schedAirDate = '';
		schedStreamLink = '';
		schedIsUncut = false;
		error = '';
	}

	function startEdit(ep: Episode) {
		editing = true;
		editTitle = ep.title ?? '';
		editCover = ep.coverUrl ?? '';
		editTrailer = ep.trailerUrl ?? '';
	}

	function cancelEdit() {
		editing = false;
	}

	async function saveEdit(ep: Episode) {
		busy = true;
		busyText = 'กำลังบันทึกตอน...';
		error = '';
		const res = await editorApi.updateEpisode(ep.id, {
			seriesId,
			episodeNumber: ep.episodeNumber,
			title: editTitle.trim() || null,
			coverUrl: editCover.trim() || null,
			trailerUrl: editTrailer.trim() || null
		});
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'บันทึกไม่สำเร็จ';
			return;
		}
		editing = false;
		await onrefresh();
	}

	async function addEpisode() {
		const nextNum = episodes.length > 0 ? Math.max(...episodes.map((e) => e.episodeNumber)) + 1 : 1;
		busy = true;
		busyText = 'กำลังเพิ่มตอน...';
		error = '';
		const res = await editorApi.addEpisode(seriesId, nextNum, null);
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'เพิ่มตอนไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}

	async function removeEpisode(id: string) {
		if (!window.confirm('ต้องการลบตอนนี้หรือไม่? ข้อมูลช่องทางฉายของตอนนี้จะถูกลบด้วย')) return;
		busy = true;
		busyText = 'กำลังลบตอน...';
		error = '';
		const res = await editorApi.removeEpisode(id);
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'ลบไม่สำเร็จ';
			return;
		}
		expandedId = null;
		await onrefresh();
	}

	async function addSchedule(ep: Episode) {
		if (!schedPlatformId || !schedAirDate) {
			error = 'กรุณาเลือกช่องทางและวันที่ฉาย';
			return;
		}
		busy = true;
		busyText = 'กำลังเพิ่มช่องทาง...';
		error = '';
		const res = await editorApi.addEpisodeSchedule({
			episodeId: ep.id,
			platformId: schedPlatformId,
			title: schedTitle.trim() || null,
			airDate: schedAirDate,
			streamLink: schedStreamLink.trim() || null,
			isUncut: schedIsUncut
		});
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'เพิ่มช่องทางไม่สำเร็จ';
			return;
		}
		schedPlatformId = '';
		schedTitle = '';
		schedAirDate = '';
		schedStreamLink = '';
		schedIsUncut = false;
		await onrefresh();
	}

	async function removeSchedule(id: string) {
		if (!window.confirm('ต้องการลบช่องทางฉายนี้หรือไม่?')) return;
		busy = true;
		busyText = 'กำลังลบช่องทาง...';
		error = '';
		const res = await editorApi.removeEpisodeSchedule(id);
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'ลบไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}

	async function duplicateSchedule(sched: EpisodeSchedule) {
		busy = true;
		busyText = 'กำลังทำซ้ำช่องทาง...';
		error = '';
		const res = await editorApi.addEpisodeSchedule({
			episodeId: sched.episodeId,
			platformId: sched.platformId,
			title: sched.title,
			airDate: formatDateForEdit(sched.airDate),
			streamLink: sched.streamLink,
			isUncut: sched.isUncut
		});
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'ทำซ้ำไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}

	function startEditSchedule(sched: EpisodeSchedule) {
		scheduleEditId = sched.id;
		schedEditPlatformId = sched.platformId;
		schedEditTitle = sched.title ?? '';
		schedEditAirDate = formatDateForEdit(sched.airDate);
		schedEditStreamLink = sched.streamLink ?? '';
		schedEditIsUncut = sched.isUncut;
	}

	function cancelEditSchedule() {
		scheduleEditId = null;
	}

	async function saveEditSchedule(sched: EpisodeSchedule) {
		if (!schedEditPlatformId || !schedEditAirDate) {
			error = 'กรุณาเลือกช่องทางและวันที่ฉาย';
			return;
		}
		busy = true;
		busyText = 'กำลังบันทึกช่องทาง...';
		error = '';
		const res = await editorApi.updateEpisodeSchedule(sched.id, {
			episodeId: sched.episodeId,
			platformId: schedEditPlatformId,
			title: schedEditTitle.trim() || null,
			airDate: schedEditAirDate,
			streamLink: schedEditStreamLink.trim() || null,
			isUncut: schedEditIsUncut
		});
		busy = false;
		busyText = '';
		if (!res.ok) {
			error = res.error ?? 'บันทึกช่องทางไม่สำเร็จ';
			return;
		}
		scheduleEditId = null;
		await onrefresh();
	}

	function formatDateForEdit(s: string) {
		if (!s) return '';
		const d = new Date(s);
		const tzo = d.getTimezoneOffset();
		const local = new Date(d.getTime() - tzo * 60000);
		return local.toISOString().slice(0, 16);
	}

	function formatAirDate(s: string) {
		if (!s) return 'ไม่ระบุ';
		const d = new Date(s);
		return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) +
			' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
	}
</script>

<div class="space-y-4">
	{#if busyText}
		<div class="flex items-center gap-2 rounded-2xl border border-lavender/20 bg-lavender/10 px-3 py-2 text-sm font-medium text-plum">
			<svg class="h-4 w-4 animate-spin text-lavender-dark" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
			{busyText}
		</div>
	{/if}

	<div class="flex items-center justify-between gap-3">
		<h3 class="text-sm font-semibold text-plum">รายการตอน <span class="text-plum-light font-normal">({episodes.length})</span></h3>
		<button type="button" onclick={addEpisode} disabled={busy} class="orbit-action px-4 py-2 rounded-xl font-semibold transition-all text-sm touch-target disabled:opacity-70 flex items-center gap-1.5">
			{#if busy}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
				{busyText || 'กำลังทำงาน...'}
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
				เพิ่มตอน
			{/if}
		</button>
	</div>

	{#if error}
		<p class="text-sm text-coral-dark bg-coral/5 px-3 py-2 rounded-lg">{error}</p>
	{/if}

	{#if episodes.length === 0}
		<div class="text-center py-12 text-sm text-plum-light bg-white/40 rounded-2xl border border-dashed border-lavender/30">
			ยังไม่มีตอน — กด "เพิ่มตอน" เพื่อเริ่ม
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each episodes as ep (ep.id)}
				{@const open = expandedId === ep.id}
				<div class="bg-white/70 rounded-2xl border border-lavender/15 overflow-hidden transition-all {open ? 'shadow-md shadow-lavender/10' : ''}">
					<!-- header row -->
					<button type="button" onclick={() => toggle(ep.id)} class="w-full flex items-center gap-3 p-3.5 hover:bg-white/50 transition-colors text-left">
						<div class="w-10 h-10 rounded-xl bg-lavender/20 flex items-center justify-center font-bold text-plum text-sm flex-shrink-0">
							{ep.episodeNumber}
						</div>
						<div class="flex-1 min-w-0">
							<div class="font-medium text-plum text-sm truncate">{ep.title || `ตอนที่ ${ep.episodeNumber}`}</div>
							<div class="text-xs text-plum-light flex items-center gap-1.5">
								{#if ep.schedules.length > 0}
									<span class="truncate">{ep.schedules.map((s) => s.platformName).join(', ')}</span>
								{:else}
									<span>ยังไม่มีช่องทาง</span>
								{/if}
							</div>
						</div>
						<svg class="w-5 h-5 text-plum-light flex-shrink-0 transition-transform {open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
					</button>

					{#if open}
						<div class="px-3.5 pb-3.5 pt-1 space-y-4 border-t border-lavender/10">
							<!-- episode info edit -->
							{#if editing}
								<div class="space-y-2.5 pt-3">
									<div>
										<label for={`ep-title-${ep.id}`} class="block text-xs font-medium text-plum mb-1">ชื่อตอน</label>
										<input id={`ep-title-${ep.id}`} type="text" bind:value={editTitle} placeholder="เช่น ตอนแรก" class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
									</div>
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
										<div>
											<label for={`ep-cover-${ep.id}`} class="block text-xs font-medium text-plum mb-1">URL รูปปกตอน</label>
											<input id={`ep-cover-${ep.id}`} type="url" bind:value={editCover} placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
										</div>
										<div>
											<label for={`ep-trailer-${ep.id}`} class="block text-xs font-medium text-plum mb-1">URL Trailer</label>
											<input id={`ep-trailer-${ep.id}`} type="url" bind:value={editTrailer} placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
										</div>
									</div>
									<div class="flex gap-2">
										<button type="button" onclick={() => saveEdit(ep)} disabled={busy} class="px-4 py-2 rounded-lg bg-coral text-white font-medium hover:bg-coral-dark text-sm touch-target disabled:opacity-50">บันทึก</button>
										<button type="button" onclick={cancelEdit} class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm touch-target">ยกเลิก</button>
									</div>
								</div>
							{:else}
								<div class="flex items-center gap-2 pt-3">
									<button type="button" onclick={() => startEdit(ep)} class="px-3 py-1.5 rounded-lg bg-lavender/10 text-lavender-dark font-medium text-xs hover:bg-lavender/20 transition-colors touch-target flex items-center gap-1">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
										แก้ไขตอน
									</button>
									<button type="button" onclick={() => removeEpisode(ep.id)} disabled={busy} class="px-3 py-1.5 rounded-lg bg-coral/10 text-coral-dark font-medium text-xs hover:bg-coral/20 transition-colors touch-target flex items-center gap-1">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
										ลบตอน
									</button>
								</div>
							{/if}

							<!-- schedules / streaming links -->
							<div class="pt-2">
								<div class="text-xs font-semibold text-plum uppercase tracking-wide mb-2">ช่องทาง & ลิงก์สตรีม <span class="text-plum-light normal-case font-normal">({ep.schedules.length})</span></div>
								{#if ep.schedules.length > 0}
									<div class="space-y-1.5 mb-3">
										{#each ep.schedules as sched (sched.id)}
											{#if scheduleEditId === sched.id}
												<div class="flex flex-col gap-2 bg-white/60 rounded-xl p-2.5 border border-lavender/15">
													<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
														<SearchableSelect bind:value={schedEditPlatformId} options={reference.platforms.map((p) => ({ id: p.id, label: p.name }))} placeholder="ค้นหาช่องทาง..." emptyText="ไม่พบช่องทาง" />
														<input type="datetime-local" bind:value={schedEditAirDate} class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
													</div>
													<input type="text" bind:value={schedEditTitle} placeholder="ชื่อตอนย่อย เช่น EP.1 [1/4]" class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
													<input type="url" bind:value={schedEditStreamLink} placeholder="ลิงก์สตรีม (ถ้ามี)" class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
													<div class="flex items-center justify-between gap-2">
														<label class="flex items-center gap-2 text-sm text-plum cursor-pointer select-none">
															<input type="checkbox" bind:checked={schedEditIsUncut} class="w-4 h-4 rounded accent-coral" />
															Uncut version
														</label>
														<div class="flex gap-1.5">
															<button type="button" onclick={() => saveEditSchedule(sched)} disabled={busy} class="px-3 py-1.5 rounded-lg bg-coral text-white font-medium text-xs hover:bg-coral-dark touch-target disabled:opacity-50">บันทึก</button>
															<button type="button" onclick={cancelEditSchedule} class="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-xs touch-target">ยกเลิก</button>
														</div>
													</div>
												</div>
											{:else}
												<div class="flex items-start gap-2 bg-lavender/5 rounded-xl p-2.5">
													<div class="flex-1 min-w-0">
														<div class="flex items-center gap-1.5 flex-wrap">
															<span class="text-sm font-medium text-plum">{sched.platformName}</span>
															{#if sched.title}<span class="text-xs text-plum-light">{sched.title}</span>{/if}
															{#if sched.isUncut}
																<span class="px-1.5 py-0.5 rounded-md bg-coral/15 text-coral-dark text-[10px] font-semibold">Uncut</span>
															{/if}
														</div>
														<div class="text-xs text-plum-light mt-0.5">{formatAirDate(sched.airDate)}</div>
														{#if sched.streamLink}
															<a href={sched.streamLink} target="_blank" rel="noopener" class="text-xs text-lavender-dark hover:underline truncate block mt-0.5">🔗 {sched.streamLink}</a>
														{/if}
													</div>
														<div class="flex gap-1 flex-shrink-0">
															<button type="button" onclick={() => duplicateSchedule(sched)} disabled={busy} aria-label="ทำซ้ำช่องทาง" class="p-1.5 rounded-lg hover:bg-lavender/10 text-plum-light hover:text-lavender-dark transition-colors touch-target disabled:opacity-50">
																<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h9a3 3 0 013 3v9m-4 2H7a3 3 0 01-3-3V7a3 3 0 013-3h9a3 3 0 013 3v9" /></svg>
															</button>
															<button type="button" onclick={() => startEditSchedule(sched)} aria-label="แก้ไขช่องทาง" class="p-1.5 rounded-lg hover:bg-lavender/10 text-plum-light hover:text-lavender-dark transition-colors touch-target">
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
														</button>
														<button type="button" onclick={() => removeSchedule(sched.id)} disabled={busy} aria-label="ลบช่องทาง" class="p-1.5 rounded-lg hover:bg-coral/10 text-plum-light hover:text-coral-dark transition-colors touch-target disabled:opacity-50">
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
														</button>
													</div>
												</div>
											{/if}
										{/each}
									</div>
								{/if}

								<!-- add schedule form -->
								<div class="bg-white/50 rounded-xl p-2.5 space-y-2 border border-lavender/15">
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<SearchableSelect bind:value={schedPlatformId} options={reference.platforms.map((p) => ({ id: p.id, label: p.name }))} placeholder="ค้นหาช่องทาง..." emptyText="ไม่พบช่องทาง" />
										<input type="datetime-local" bind:value={schedAirDate} class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
									</div>
									<input type="text" bind:value={schedTitle} placeholder="ชื่อตอนย่อย เช่น EP.1 [1/4]" class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
									<input type="url" bind:value={schedStreamLink} placeholder="ลิงก์สตรีม (ถ้ามี)" class="w-full px-3 py-2 rounded-lg border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
									<div class="flex items-center justify-between gap-2">
										<label class="flex items-center gap-2 text-sm text-plum cursor-pointer select-none">
											<input type="checkbox" bind:checked={schedIsUncut} class="w-4 h-4 rounded accent-coral" />
											Uncut version
										</label>
										<button type="button" onclick={() => addSchedule(ep)} disabled={busy} class="px-3 py-1.5 rounded-lg bg-lavender/20 text-lavender-dark font-medium text-xs hover:bg-lavender/30 touch-target disabled:opacity-50">
											+ เพิ่มช่องทาง
										</button>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
