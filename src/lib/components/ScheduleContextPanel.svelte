<script lang="ts">

	import { page } from '$app/state';	import type { CalendarApiResponse, CalendarEvent } from '$lib/types/calendar.js';

	let { calendar }: { calendar: CalendarApiResponse } = $props();

	const datedEntries = $derived(Object.entries(calendar.events).sort(([a], [b]) => a.localeCompare(b)));
	const datedEventCount = $derived(datedEntries.reduce((sum, [, items]) => sum + items.length, 0));
	const weeklyEventCount = $derived(calendar.scheduleByDay.reduce((sum, day) => sum + day.items.length, 0));
	const totalEvents = $derived(datedEventCount || weeklyEventCount);
	const showDatedList = $derived(datedEventCount > 0);

	const thaiMonths = [
		'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
		'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
	];

	function formatThaiDate(date: string): string {
		const d = new Date(`${date}T00:00:00`);
		if (Number.isNaN(d.getTime())) return date;
		return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
	}
</script>

<div class="flex h-full flex-col">
	<header class="border-b border-black/10 bg-white px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<h2 class="truncate text-sm font-bold text-plum">ตารางฉายที่เกี่ยวข้อง</h2>
				<p class="mt-0.5 text-xs text-plum-light">{totalEvents} รอบฉาย • {calendar.allSeries.length} เรื่อง</p>
			</div>
			<a href="/{page.data.lang}/calendar" class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">ดูเต็ม</a>
		</div>
	</header>

	<div class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
		{#if totalEvents === 0}
			<div class="flex h-full items-center justify-center text-center">
				<p class="text-sm text-plum-light">ยังไม่พบตารางฉายของข้อมูลนี้</p>
			</div>
		{:else if showDatedList}
			<div class="space-y-3">
				{#each datedEntries as [date, items]}
					<section class="glass-card rounded-2xl p-3">
						<div class="mb-2 flex items-center justify-between gap-3">
							<h3 class="text-sm font-bold text-plum">{formatThaiDate(date)}</h3>
							<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{items.length} รอบ</span>
						</div>
						<div class="space-y-2">
							{#each items as event}
								{@render eventRow(event)}
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{:else}
			<div class="space-y-3">
				{#each calendar.scheduleByDay as day}
					<section class="glass-card rounded-2xl p-3">
						<div class="mb-2 flex items-center justify-between gap-3">
							<h3 class="text-sm font-bold text-plum">วัน{day.day}</h3>
							<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{day.items.length} รอบ</span>
						</div>
						<div class="space-y-2">
							{#each day.items as event}
								{@render eventRow(event)}
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#snippet eventRow(event: CalendarEvent)}
	<div class="rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm shadow-lavender/10">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-bold text-plum">{event.series}</p>
				<p class="mt-0.5 text-xs text-plum-light">{event.episode}</p>
			</div>
			<span class="shrink-0 rounded-full bg-lavender/15 px-2 py-1 text-xs font-bold text-lavender-dark">{event.time}</span>
		</div>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each event.platforms as platform}
				<span class="rounded-full border border-lavender/20 bg-lavender/10 px-2 py-0.5 text-[10px] font-bold text-plum-light">{platform}</span>
			{/each}
			{#if event.isUncut}
				<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Uncut</span>
			{/if}
		</div>
	</div>
{/snippet}
