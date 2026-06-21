<script lang="ts">
	import { editorApi } from '$lib/admin/editor-api.js';
	import SearchableSelect from './SearchableSelect.svelte';
	import type { ReferenceData, WeeklySchedule } from '$lib/admin/editor-types.js';

	let {
		seriesId,
		schedules,
		reference,
		onrefresh
	}: {
		seriesId: string;
		schedules: WeeklySchedule[];
		reference: ReferenceData;
		onrefresh: () => void | Promise<void>;
	} = $props();

	const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร'];

	let platformId = $state('');
	let dayOfWeek = $state(1);
	let airTime = $state('20:00');
	let isUncut = $state(false);
	let busy = $state(false);
	let error = $state('');

	async function add() {
		if (!platformId) {
			error = 'กรุณาเลือกช่องทาง';
			return;
		}
		busy = true;
		error = '';
		const res = await editorApi.addSchedule({ seriesId, platformId, dayOfWeek, airTime: `${airTime}:00`, isUncut });
		busy = false;
		if (!res.ok) {
			error = res.error ?? 'เพิ่มไม่สำเร็จ';
			return;
		}
		platformId = '';
		isUncut = false;
		await onrefresh();
	}

	async function remove(id: string) {
		busy = true;
		error = '';
		const res = await editorApi.removeSchedule(id);
		busy = false;
		if (!res.ok) {
			error = res.error ?? 'ลบไม่สำเร็จ';
			return;
		}
		await onrefresh();
	}

	function formatTime(t: string) {
		return t.slice(0, 5);
	}
</script>

<div class="space-y-4">
	<p class="text-sm text-plum-light">ตารางฉายประจำสัปดาห์ (เวลาที่ฉายซ้ำทุกสัปดาห์) — ใช้สำหรับแสดงในหน้าปฏิทิน</p>

	<!-- add form -->
	<div class="glass-card rounded-2xl p-4 space-y-3">
		<h3 class="text-sm font-semibold text-plum">เพิ่มช่วงเวลาฉาย</h3>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
			<div class="col-span-2 sm:col-span-1">
				<label for="sched-platform" class="block text-xs font-medium text-plum mb-1">ช่องทาง</label>
				<SearchableSelect bind:value={platformId} options={reference.platforms.map((p) => ({ id: p.id, label: p.name }))} placeholder="ค้นหาช่องทาง..." emptyText="ไม่พบช่องทาง" />
			</div>
			<div>
				<label for="sched-day" class="block text-xs font-medium text-plum mb-1">วัน</label>
				<select id="sched-day" bind:value={dayOfWeek} class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm">
					{#each dayNames as d, i}
						<option value={i}>{d}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="sched-time" class="block text-xs font-medium text-plum mb-1">เวลา</label>
				<input id="sched-time" type="time" bind:value={airTime} class="w-full px-3 py-2 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
			</div>
			<div class="flex flex-col">
				<span class="block text-xs font-medium text-plum mb-1">เวอร์ชัน</span>
				<label class="flex items-center gap-1.5 text-sm text-plum cursor-pointer h-[38px]">
					<input type="checkbox" bind:checked={isUncut} class="w-4 h-4 rounded accent-coral" />
					Uncut
				</label>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button type="button" onclick={add} disabled={busy} class="px-4 py-2 rounded-xl bg-coral text-white font-medium hover:bg-coral-dark transition-colors text-sm touch-target disabled:opacity-50">
				+ เพิ่มช่วงเวลา
			</button>
			{#if error}
				<span class="text-xs text-coral-dark">{error}</span>
			{/if}
		</div>
	</div>

	<!-- list -->
	{#if schedules.length === 0}
		<div class="text-center py-10 text-sm text-plum-light bg-white/40 rounded-2xl border border-dashed border-lavender/30">
			ยังไม่มีตารางฉายประจำสัปดาห์
		</div>
	{:else}
		<div class="space-y-2">
			{#each schedules as s (s.id)}
				<div class="flex items-center gap-3 bg-white/70 rounded-2xl p-3 border border-lavender/15">
					<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender/30 to-mint/20 flex flex-col items-center justify-center flex-shrink-0">
						<span class="text-[10px] text-plum-light leading-none">วัน</span>
						<span class="text-sm font-bold text-plum leading-none mt-0.5">{dayNames[s.dayOfWeek]}</span>
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium text-plum text-sm">{formatTime(s.airTime)} น.</span>
							<span class="text-sm text-plum-light">· {s.platformName}</span>
							{#if s.isUncut}
								<span class="px-1.5 py-0.5 rounded-md bg-coral/15 text-coral-dark text-[10px] font-semibold">Uncut</span>
							{/if}
						</div>
					</div>
					<button type="button" onclick={() => remove(s.id)} disabled={busy} aria-label="ลบ" class="p-2 rounded-lg hover:bg-coral/10 text-plum-light hover:text-coral-dark transition-colors touch-target disabled:opacity-50 flex-shrink-0">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
