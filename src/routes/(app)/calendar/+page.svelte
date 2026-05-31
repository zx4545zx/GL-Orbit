<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let viewMode = $state<'grid' | 'calendar' | 'list'>('grid');
	let currentMonth = $state(new Date());
	let selectedDate = $state<string | null>(null);

	let showSticky = $state(false);
	let titleRef: HTMLDivElement;

	$effect(() => {
		if (!titleRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				showSticky = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: '0px 0px -1px 0px' }
		);
		observer.observe(titleRef);
		return () => observer.disconnect();
	});

	const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
	const thaiMonths = [
		'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
		'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
	];

	// Helper function to format date using local time (not UTC)
	function formatDateLocal(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	let events = $state<Record<string, Array<{
		time: string;
		series: string;
		seriesId: string;
		episode: string;
		platform: string;
		isUncut: boolean;
	}>>>({});
	let allSeries = $state<string[]>([]);
	let platforms = $state<string[]>([]);
	let scheduleByDay = $state<Array<{
		day: string;
		items: Array<{
			time: string;
			series: string;
			seriesId: string;
			episode: string;
			platform: string;
			isUncut: boolean;
		}>;
	}>>([]);
	let loading = $state(true);

	$effect(() => {
		loading = true;
		Promise.all([
			Promise.resolve(data.events),
			Promise.resolve(data.allSeries),
			Promise.resolve(data.platforms),
			Promise.resolve(data.scheduleByDay)
		]).then(([e, a, p, s]) => {
			events = e;
			allSeries = a;
			platforms = p;
			scheduleByDay = s;
			loading = false;
		});
	});

	const platformColorClasses = [
		'bg-red-50 text-red-600 border-red-200',
		'bg-green-50 text-green-600 border-green-200',
		'bg-orange-50 text-orange-600 border-orange-200',
		'bg-blue-50 text-blue-600 border-blue-200',
		'bg-purple-50 text-purple-600 border-purple-200',
		'bg-pink-50 text-pink-600 border-pink-200',
		'bg-teal-50 text-teal-600 border-teal-200',
		'bg-indigo-50 text-indigo-600 border-indigo-200'
	];

	const platformColors = $derived((() => {
		const map: Record<string, string> = {};
		platforms.forEach((p, i) => {
			map[p] = platformColorClasses[i % platformColorClasses.length];
		});
		return map;
	})());

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

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(date.getFullYear(), date.getMonth() + 1, i);
			days.push({ date: i, month: 'next', fullDate: formatDateLocal(d) });
		}

		return days;
	}

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function goToToday() {
		currentMonth = new Date();
	}

	function isToday(fullDate: string) {
		const today = formatDateLocal(new Date());
		return fullDate === today;
	}

	function hasEvents(fullDate: string) {
		return events[fullDate] && events[fullDate].length > 0;
	}

	function getEventCount(fullDate: string) {
		return events[fullDate]?.length || 0;
	}

	function selectDate(fullDate: string) {
		if (hasEvents(fullDate)) {
			selectedDate = selectedDate === fullDate ? null : fullDate;
		}
	}

	const calendarDays = $derived(generateCalendarDays(currentMonth));
	const selectedEvents = $derived(selectedDate ? events[selectedDate] || [] : []);

	const daysInMonthCurrent = $derived(getDaysInMonth(currentMonth));
	const monthDays = $derived(Array.from({ length: daysInMonthCurrent }, (_, i) => i + 1));

	function getEventForSeriesAndDay(seriesName: string, day: number) {
		const dateStr = formatDateLocal(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
		return events[dateStr]?.find(e => e.series === seriesName) || null;
	}

	const dayColors: Record<string, string> = {
		'จันทร์': 'from-coral/20 to-coral/5',
		'อังคาร': 'from-orange-300/20 to-orange-300/5',
		'พุธ': 'from-lavender/20 to-lavender/5',
		'พฤหัสบดี': 'from-emerald-300/20 to-emerald-300/5',
		'ศุกร์': 'from-teal-300/20 to-teal-300/5',
		'เสาร์': 'from-blue-300/20 to-blue-300/5',
		'อาทิตย์': 'from-rose-300/20 to-rose-300/5'
	};

	const viewButtons = [
		{ key: 'grid' as const, label: 'ตาราง', short: 'ตาราง', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>' },
		{ key: 'calendar' as const, label: 'ปฏิทิน', short: 'ปฏิทิน', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
		{ key: 'list' as const, label: 'รายการ', short: 'รายการ', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>' }
	];
</script>

{#snippet viewToggle()}
	<div class="flex justify-center">
		<div class="glass-card rounded-2xl p-1.5 flex gap-1">
			{#each viewButtons as btn}
				{@const active = viewMode === btn.key}
				<button
					onclick={() => viewMode = btn.key}
					class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 touch-target {active ? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'text-plum-light hover:bg-white/60'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{@html btn.icon}</svg>
					<span class="hidden sm:inline">{btn.label}</span>
					<span class="sm:hidden">{btn.short}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<!-- Floating Sticky View Toggle -->
<div
	class="fixed top-0 left-0 right-0 z-30 px-4 sm:px-6 py-3 glass-card border-t-0 border-x-0 shadow-[0_8px_32px_rgba(196,181,253,0.15)] transition-all duration-300 md:hidden {showSticky ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}"
>
	<div class="max-w-6xl mx-auto">
		{@render viewToggle()}
	</div>
</div>

<div class="py-6 sm:py-8 max-w-6xl mx-auto">
	<!-- Title -->
	<div bind:this={titleRef} class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ตารางฉาย<span class="text-coral">ประจำเดือน</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">อัปเดตตารางฉายซีรีส์ GL ล่าสุด</p>
	</div>

	<!-- Normal View Toggle -->
	<div class="mb-6 sm:mb-8">
		{@render viewToggle()}
	</div>

	{#if viewMode === 'grid'}
		<!-- Grid / Timeline View — Series rows × Date columns -->
		{#if allSeries.length === 0}
			<div class="text-center py-16">
				<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="font-semibold text-plum mb-1">ไม่มีตารางฉาย</h3>
				<p class="text-sm text-plum-light">ยังไม่มีซีรีส์ที่มีกำหนดฉายในระบบ</p>
			</div>
		{:else}
			<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
				<!-- Header: Month nav + day columns -->
				<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-lavender/20">
					<button
						aria-label="เดือนก่อนหน้า"
						onclick={prevMonth}
						class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
					>
						<svg class="w-4 h-4 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
					</button>
					<div class="flex items-center gap-2 sm:gap-3">
						<h2 class="font-[family-name:var(--font-display)] text-base sm:text-xl font-bold text-plum">
							{thaiMonths[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
						</h2>
						<button
							onclick={goToToday}
							class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-coral/10 text-coral-dark hover:bg-coral/20 transition-colors"
						>
							วันนี้
						</button>
					</div>
					<button
						aria-label="เดือนถัดไป"
						onclick={nextMonth}
						class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
					>
						<svg class="w-4 h-4 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
					</button>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full min-w-[800px]">
						<thead>
							<tr class="border-b border-lavender/10">
								<!-- Series name column -->
								<th class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-plum-light w-32 sm:w-40 border-r border-lavender/10">
									ซีรีส์
								</th>
								<!-- Day columns -->
								{#each monthDays as day}
									{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
									{@const isToday = formatDateLocal(dateObj) === formatDateLocal(new Date())}
									{@const dayOfWeek = dateObj.getDay()}
									<th class="px-1 sm:px-2 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium min-w-[36px] sm:min-w-[48px] {isToday ? 'bg-coral/10' : ''} {dayOfWeek === 0 || dayOfWeek === 6 ? 'text-coral-dark' : 'text-plum-light'}">
										<div class="font-bold">{day}</div>
										<div class="text-[8px] sm:text-[10px] opacity-70">
											{#if dayOfWeek === 0}อา
											{:else if dayOfWeek === 1}จ
											{:else if dayOfWeek === 2}อ
											{:else if dayOfWeek === 3}พ
											{:else if dayOfWeek === 4}พฤ
											{:else if dayOfWeek === 5}ศ
											{:else}ส
											{/if}
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each allSeries as seriesName, seriesIndex}
								<tr class="border-b border-lavender/5 hover:bg-white/30 transition-colors {seriesIndex % 2 === 0 ? 'bg-white/20' : ''}">
									<!-- Series name cell -->
									<td class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 border-r border-lavender/10">
										<div class="font-semibold text-plum text-xs sm:text-sm truncate">{seriesName}</div>
									</td>
									<!-- Day cells -->
									{#each monthDays as day}
										{@const event = getEventForSeriesAndDay(seriesName, day)}
										{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
										{@const isToday = formatDateLocal(dateObj) === formatDateLocal(new Date())}
										<td class="px-0.5 sm:px-1 py-1 sm:py-2 text-center {isToday ? 'bg-coral/5' : ''}">
											{#if event}
												<div class="rounded-md sm:rounded-lg p-1 sm:p-1.5 text-[9px] sm:text-[10px] leading-tight border {platformColors[event.platform] || 'bg-gray-50 text-gray-600 border-gray-200'} cursor-pointer hover:shadow-md transition-all touch-target">
													<div class="font-bold">{event.time}</div>
													<div class="mt-0.5">{event.episode}</div>
													{#if event.isUncut}
														<div class="mt-0.5 text-[7px] sm:text-[8px] font-medium text-coral-dark">UNCUT</div>
													{/if}
												</div>
											{:else}
												<div class="w-full h-6 sm:h-8"></div>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Platform Legend -->
			<div class="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-plum-light">
				<span>แพลตฟอร์ม:</span>
				{#each Object.entries(platformColors) as [platform, colorClass]}
					<div class="flex items-center gap-1">
						<div class="w-3 h-3 rounded {colorClass.split(' ')[0]}"></div>
						<span>{platform}</span>
					</div>
				{/each}
			</div>
		{/if}

	{:else if viewMode === 'calendar'}
		{#if loading}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
				<div class="lg:col-span-2">
					<div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
						<div class="flex items-center justify-between mb-4 sm:mb-6">
							<div class="h-8 w-8 sm:h-10 sm:w-10 bg-lavender/10 rounded-xl animate-pulse"></div>
							<div class="h-6 w-40 bg-lavender/10 rounded animate-pulse"></div>
							<div class="h-8 w-8 sm:h-10 sm:w-10 bg-lavender/10 rounded-xl animate-pulse"></div>
						</div>
						<div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
							{#each Array(7) as _}
								<div class="h-8 bg-lavender/10 rounded animate-pulse"></div>
							{/each}
						</div>
						<div class="grid grid-cols-7 gap-0.5 sm:gap-1">
							{#each Array(42) as _}
								<div class="aspect-square bg-lavender/10 rounded animate-pulse"></div>
							{/each}
						</div>
					</div>
				</div>
				<div class="lg:col-span-1">
					<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
						<div class="h-6 w-1/2 bg-lavender/10 rounded animate-pulse"></div>
						<div class="h-4 w-1/3 bg-lavender/10 rounded animate-pulse"></div>
						<div class="space-y-2 pt-2">
							{#each Array(2) as _}
								<div class="h-20 bg-lavender/10 rounded animate-pulse"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Calendar View -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
			<div class="lg:col-span-2">
				<div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
					<div class="flex items-center justify-between mb-4 sm:mb-6">
						<button
							aria-label="เดือนก่อนหน้า"
							onclick={prevMonth}
							class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
						>
							<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
						</button>
						<div class="flex items-center gap-2 sm:gap-3">
							<h2 class="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-bold text-plum">
								{thaiMonths[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
							</h2>
							<button
								onclick={goToToday}
								class="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-coral/10 text-coral-dark hover:bg-coral/20 transition-colors"
							>
								วันนี้
							</button>
						</div>
						<button
							aria-label="เดือนถัดไป"
							onclick={nextMonth}
							class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
						>
							<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
						</button>
					</div>

					<div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
						{#each weekDays as day}
							<div class="text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-plum-light uppercase">{day}</div>
						{/each}
					</div>

					<div class="grid grid-cols-7 gap-0.5 sm:gap-1">
						{#each calendarDays as day}
							{@const eventCount = getEventCount(day.fullDate)}
							{@const isSelected = selectedDate === day.fullDate}
							<button
								onclick={() => selectDate(day.fullDate)}
								class="relative aspect-square rounded-lg sm:rounded-xl p-0.5 sm:p-1 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 touch-target
									{day.month !== 'current' ? 'text-plum-light/40' : 'text-plum'}
									{isToday(day.fullDate) ? 'ring-1 sm:ring-2 ring-coral' : ''}
									{isSelected ? 'bg-gradient-to-br from-coral/20 to-lavender/20' : 'hover:bg-white/40'}
									{eventCount > 0 && !isSelected ? 'bg-white/30' : ''}"
							>
								<span class="text-xs sm:text-sm font-medium">{day.date}</span>
								{#if eventCount > 0}
									<div class="flex gap-0.5">
										{#each Array(Math.min(eventCount, 3)) as _, i}
											<div class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-coral"></div>
										{/each}
									</div>
								{/if}
								{#if isToday(day.fullDate)}
									<span class="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-coral rounded-md text-[8px] sm:text-[10px] text-white font-bold shadow-sm leading-none">วันนี้</span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-plum-light">
						<div class="flex items-center gap-1 sm:gap-1.5">
							<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-coral"></div>
							<span>มีซีรีส์ฉาย</span>
						</div>
						<div class="flex items-center gap-1 sm:gap-1.5">
							<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-coral ring-1 sm:ring-1 ring-coral"></div>
							<span>วันนี้</span>
						</div>
					</div>
				</div>
			</div>

			<div class="lg:col-span-1">
				<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:sticky lg:top-28">
					{#if selectedDate && selectedEvents.length > 0}
						{@const d = new Date(selectedDate)}
						<h3 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum mb-1">
							{d.getDate()} {thaiMonths[d.getMonth()]}
						</h3>
						<p class="text-xs sm:text-sm text-plum-light mb-4 sm:mb-5">มี {selectedEvents.length} รายการ</p>

						<div class="space-y-2 sm:space-y-3">
							{#each selectedEvents as event}
								<div class="glass-card-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all">
									<div class="flex items-center gap-2 mb-1.5 sm:mb-2">
										<span class="px-2 py-0.5 rounded-lg bg-coral/10 text-coral-dark text-xs font-bold">{event.time}</span>
										{#if event.isUncut}
											<span class="px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-xs font-medium">Uncut</span>
										{/if}
									</div>
									<h4 class="font-semibold text-plum text-sm mb-0.5 sm:mb-1">{event.series}</h4>
									<div class="flex items-center gap-2 text-xs text-plum-light">
										<span>{event.episode}</span>
										<span>•</span>
										<span>{event.platform}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 sm:py-10">
							<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
								<svg class="w-6 h-6 sm:w-8 sm:h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
							</div>
							<p class="text-plum-light text-xs sm:text-sm">
								{#if selectedDate}
									ไม่มีซีรีส์ฉายในวันนี้
								{:else}
									เลือกวันที่มีจุดสีชมพู<br/>เพื่อดูรายละเอียด
								{/if}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{/if}
	{:else}
		<!-- List View -->
		{#if scheduleByDay.length === 0}
			<div class="text-center py-16">
				<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="font-semibold text-plum mb-1">ไม่มีตารางฉาย</h3>
				<p class="text-sm text-plum-light">ยังไม่มีซีรีส์ที่มีกำหนดฉายในระบบ</p>
			</div>
		{:else}
			<div class="space-y-4 sm:space-y-6">
				{#each scheduleByDay as day}
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
						<div class="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r {dayColors[day.day] || 'from-lavender/20 to-lavender/5'} border-b border-white/50">
							<h2 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum flex items-center gap-2 sm:gap-3">
								<span class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/80 flex items-center justify-center text-base sm:text-lg">📅</span>
								{day.day}
							</h2>
						</div>
						<div class="divide-y divide-lavender/10">
							{#each day.items as item}
								<div class="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-5 hover:bg-white/40 transition-colors group">
									<div class="flex-shrink-0 w-12 sm:w-16 text-center">
										<div class="text-base sm:text-lg font-bold text-coral-dark">{item.time}</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<h3 class="font-semibold text-plum text-sm sm:text-base">{item.series}</h3>
											{#if item.isUncut}
												<span class="px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] sm:text-xs font-medium">Uncut</span>
											{/if}
										</div>
										<div class="flex items-center gap-2 text-xs sm:text-sm text-plum-light">
											<span class="font-medium">{item.episode}</span>
											<span class="text-lavender">•</span>
											<span>{item.platform}</span>
										</div>
									</div>
									<a
										href="/series/{item.seriesId}"
										aria-label="ดูรายละเอียด"
										class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-coral/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-coral/20 touch-target"
									>
										<svg class="w-4 h-4 sm:w-5 sm:h-5 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</a>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="mt-6 sm:mt-10 glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
		<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-lavender/20 flex items-center justify-center flex-shrink-0">
			<svg class="w-4 h-4 sm:w-5 sm:h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>
		<div>
			<h3 class="font-semibold text-plum mb-1 text-sm sm:text-base">หมายเหตุ</h3>
			<p class="text-xs sm:text-sm text-plum-light leading-relaxed">
				เวลาฉายแสดงตาม timezone ของประเทศไทย (UTC+7) หากมีการเปลี่ยนแปลงตารางฉาย
				ระบบจะอัปเดตให้โดยอัตโนมัติ ติ่งทุกคนสามารถตรวจสอบเวลาฉาย Uncut version ได้จากป้ายสีชมพู
			</p>
		</div>
	</div>
</div>
