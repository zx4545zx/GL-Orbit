<script lang="ts">
	import type { CalendarApiResponse, CalendarEvent } from '$lib/types/calendar.js';

	let { calendar }: { calendar: CalendarApiResponse } = $props();

	let viewMode = $state<'grid' | 'calendar' | 'list'>('grid');
	let selectedDate = $state<string | null>(null);

	const datedEntries = $derived(Object.entries(calendar.events).sort(([a], [b]) => a.localeCompare(b)));
	const allEvents = $derived(datedEntries.flatMap(([date, items]) => items.map((item) => ({ date, ...item }))));
	const totalEvents = $derived(allEvents.length);
	const firstDate = $derived(datedEntries[0]?.[0] ?? formatDateLocal(new Date()));
	const visibleMonth = $derived(new Date(`${firstDate}T00:00:00`));
	const monthDays = $derived(generateCalendarDays(visibleMonth));
	const selectedEvents = $derived(selectedDate ? calendar.events[selectedDate] ?? [] : []);

	const thaiMonths = [
		'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
		'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
	];
	const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

	const viewButtons = [
		{ key: 'grid' as const, label: 'ตาราง' },
		{ key: 'calendar' as const, label: 'ปฏิทิน' },
		{ key: 'list' as const, label: 'รายการ' }
	];

	function formatDateLocal(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function formatThaiDate(date: string): string {
		const d = new Date(`${date}T00:00:00`);
		if (Number.isNaN(d.getTime())) return date;
		return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
	}

	function getDaysInMonth(date: Date) {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	}

	function getFirstDayOfMonth(date: Date) {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	}

	function generateCalendarDays(date: Date) {
		const daysInMonth = getDaysInMonth(date);
		const firstDay = getFirstDayOfMonth(date);
		const days: Array<{ date: number; month: 'prev' | 'current' | 'next'; fullDate: string }> = [];
		const prevMonthDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
		for (let i = firstDay - 1; i >= 0; i--) {
			const d = new Date(date.getFullYear(), date.getMonth() - 1, prevMonthDays - i);
			days.push({ date: prevMonthDays - i, month: 'prev', fullDate: formatDateLocal(d) });
		}
		for (let i = 1; i <= daysInMonth; i++) {
			const d = new Date(date.getFullYear(), date.getMonth(), i);
			days.push({ date: i, month: 'current', fullDate: formatDateLocal(d) });
		}
		const remaining = Math.ceil(days.length / 7) * 7 - days.length || 7;
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(date.getFullYear(), date.getMonth() + 1, i);
			days.push({ date: i, month: 'next', fullDate: formatDateLocal(d) });
		}
		return days;
	}

	function eventCount(date: string): number {
		return calendar.events[date]?.length ?? 0;
	}

	function hasEvents(date: string): boolean {
		return eventCount(date) > 0;
	}

	function selectDate(date: string) {
		if (!hasEvents(date)) return;
		selectedDate = selectedDate === date ? null : date;
	}
</script>

<div class="flex h-full flex-col">
	<header class="border-b border-black/10 bg-white px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<h2 class="truncate text-sm font-bold text-plum">ตารางฉายที่เกี่ยวข้อง</h2>
				<p class="mt-0.5 text-xs text-plum-light">{totalEvents} รอบฉาย • {calendar.allSeries.length} เรื่อง</p>
			</div>
			<a href="/calendar" class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">ดูเต็ม</a>
		</div>
		<div class="mt-3 flex rounded-2xl bg-lavender/10 p-1">
			{#each viewButtons as btn}
				<button type="button" class="flex-1 rounded-xl px-3 py-2 text-xs font-bold transition {viewMode === btn.key ? 'bg-white text-coral-dark shadow-sm' : 'text-plum-light'}" onclick={() => (viewMode = btn.key)}>{btn.label}</button>
			{/each}
		</div>
	</header>

	<div class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
		{#if totalEvents === 0}
			<div class="flex h-full items-center justify-center text-center">
				<p class="text-sm text-plum-light">ยังไม่พบตารางฉายของข้อมูลนี้</p>
			</div>
		{:else if viewMode === 'grid'}
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
		{:else if viewMode === 'calendar'}
			<div class="space-y-4">
				<div class="glass-card rounded-2xl p-3">
					<h3 class="mb-3 text-center text-sm font-bold text-plum">{thaiMonths[visibleMonth.getMonth()]} {visibleMonth.getFullYear() + 543}</h3>
					<div class="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-plum-light">
						{#each weekDays as d}<span>{d}</span>{/each}
					</div>
					<div class="grid grid-cols-7 gap-1">
						{#each monthDays as day}
							{@const count = eventCount(day.fullDate)}
							<button type="button" disabled={count === 0} onclick={() => selectDate(day.fullDate)} class="relative aspect-square rounded-xl text-xs font-bold transition {day.month === 'current' ? 'text-plum' : 'text-plum-light/35'} {count > 0 ? 'bg-white shadow-sm hover:bg-coral/10' : 'bg-white/35'} {selectedDate === day.fullDate ? 'ring-2 ring-coral' : ''}">
								{day.date}
								{#if count > 0}<span class="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-coral"></span>{/if}
							</button>
						{/each}
					</div>
				</div>

				{#if selectedDate}
					<section class="space-y-2">
						<h3 class="text-sm font-bold text-plum">{formatThaiDate(selectedDate)}</h3>
						{#each selectedEvents as event}
							{@render eventRow(event)}
						{/each}
					</section>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each calendar.scheduleByDay as day}
					<section class="glass-card rounded-2xl p-3">
						<h3 class="mb-2 text-sm font-bold text-plum">วัน{day.day}</h3>
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
