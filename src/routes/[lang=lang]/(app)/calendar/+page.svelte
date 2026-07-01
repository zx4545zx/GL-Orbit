<script lang="ts">
	import { tick } from 'svelte';
	import { navigating, page } from '$app/state';
	import { goto } from '$app/navigation';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, absoluteUrl, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdScript, safeJsonLd } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { CalendarEvent, CalendarApiResponse } from '$lib/types/calendar.js';
	import { getViewUrl } from './calendar.js';
	import CalendarWeekHeader from './CalendarWeekHeader.svelte';
	import CardScheduleBoard from './CardScheduleBoard.svelte';
	import { m } from '$lib/i18n/paraglide.js';

	let { data }: { data: PageData } = $props();

	let viewMode = $state<'grid' | 'calendar' | 'list' | 'card'>(data.params.startDate ? 'card' : 'calendar');
	let selectedDate = $state<string | null>(null);
	let scheduleSection = $state<HTMLElement>();

	const calendar = $derived<CalendarApiResponse>(data.calendar);
	const params_y = $derived(data.params.year);
	const params_m = $derived(data.params.month);
	const params_sd = $derived<string | null>(data.params.startDate);
	const params_ed = $derived<string | null>(data.params.endDate);
	const contentLoading = $derived(Boolean(navigating.to && navigating.to.url.pathname === page.url.pathname));

	// Current month derived from load params
	const currentMonth = $derived(new Date(params_y, params_m - 1, 1));

	// Current week for list view
	const currentWeek = $derived(
		params_sd
			? new Date(params_sd)
			: new Date()
	);
	// Calendar data from load function
	const monthEvents = $derived(calendar.events);
	const monthAllSeries = $derived(calendar.allSeries);
	const monthSeriesPosters = $derived(calendar.seriesPosters);
	const monthPlatforms = $derived(calendar.platforms);
	const weekScheduleByDay = $derived(calendar.scheduleByDay);

	const lang = $derived(page.data.lang);

	function getMonthName(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { month: 'long' }).format(date);
	}
	function getMonthShort(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { month: 'short' }).format(date);
	}
	function getWeekDayLong(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { weekday: 'long' }).format(date);
	}
	function getWeekDayShort(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { weekday: 'short' }).format(date);
	}

	const weekDays = $derived(Array.from({ length: 7 }, (_, i) => getWeekDayShort(new Date(2024, 0, 7 + i), lang)));
	const weekDayNames = $derived(Array.from({ length: 7 }, (_, i) => getWeekDayLong(new Date(2024, 0, 1 + i), lang)));

	function formatDateLocal(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getStartOfWeek(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.setDate(diff));
	}

	function getEndOfWeek(date: Date): Date {
		const start = getStartOfWeek(date);
		return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
	}

	function isSameDate(a: Date, b: Date): boolean {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	const currentWeekStart = $derived(getStartOfWeek(currentWeek));
	const weekSummary = $derived((() => {
		const today = new Date();
		const todayIndex = (today.getDay() + 6) % 7;
		const todayName = weekDayNames[todayIndex];
		const todaySchedule = weekScheduleByDay.find((day) => day.dayIndex === todayIndex);
		const weekCount = weekScheduleByDay.reduce((sum, day) => sum + day.items.length, 0);
		const firstDayWithEvent = weekScheduleByDay.find((day) => day.items.length > 0);
		const featuredDay = todaySchedule?.items.length ? todayName : (firstDayWithEvent ? weekDayNames[firstDayWithEvent.dayIndex] : null);
		const featuredEvent = todaySchedule?.items[0] ?? firstDayWithEvent?.items[0] ?? null;

		return {
			todayCount: todaySchedule?.items.length ?? 0,
			weekCount,
			featuredDay,
			featuredEvent
		};
	})());

	async function navigateCalendar(url: string) {
		await goto(url, { noScroll: true, keepFocus: true });
	}

	async function scrollToSchedule() {
		await tick();
		scheduleSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function prevMonth() {
		const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
		navigateCalendar(`/${lang}/calendar?year=${newDate.getFullYear()}&month=${newDate.getMonth() + 1}`);
	}

	function nextMonth() {
		const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
		navigateCalendar(`/${lang}/calendar?year=${newDate.getFullYear()}&month=${newDate.getMonth() + 1}`);
	}

	function goToToday() {
		const today = new Date();
		navigateCalendar(`/${lang}/calendar?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
	}

	function prevWeek() {
		const newDate = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() - 7);
		const start = getStartOfWeek(newDate);
		const end = getEndOfWeek(newDate);
		navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}`);
	}

	function nextWeek() {
		const newDate = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() + 7);
		const start = getStartOfWeek(newDate);
		const end = getEndOfWeek(newDate);
		navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}`);
	}

	async function goToThisWeek() {
		viewMode = 'card';
		const today = new Date();
		const start = getStartOfWeek(today);
		const end = getEndOfWeek(today);
		await navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}`);
		await scrollToSchedule();
	}

	function isToday(fullDate: string) {
		const today = formatDateLocal(new Date());
		return fullDate === today;
	}

	function hasEvents(fullDate: string) {
		return monthEvents[fullDate] && monthEvents[fullDate].length > 0;
	}

	function getEventCount(fullDate: string) {
		return monthEvents[fullDate]?.length || 0;
	}

	function selectDate(fullDate: string) {
		if (hasEvents(fullDate)) {
			selectedDate = selectedDate === fullDate ? null : fullDate;
		}
	}

	const calendarDays = $derived(generateCalendarDays(currentMonth));
	const selectedEvents = $derived(selectedDate ? monthEvents[selectedDate] || [] : []);

	const daysInMonthCurrent = $derived(getDaysInMonth(currentMonth));
	const monthDays = $derived(Array.from({ length: daysInMonthCurrent }, (_, i) => i + 1));

	function getEventsForSeriesAndDay(seriesName: string, day: number) {
		const dateStr = formatDateLocal(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
		return monthEvents[dateStr]?.filter(e => e.series === seriesName) || [];
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

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(date.getFullYear(), date.getMonth() + 1, i);
			days.push({ date: i, month: 'next', fullDate: formatDateLocal(d) });
		}

		return days;
	}

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
		monthPlatforms.forEach((p, i) => {
			map[p] = platformColorClasses[i % platformColorClasses.length];
		});
		return map;
	})());

	const dayColorClasses = [
		'from-coral/20 to-coral/5',
		'from-orange-300/20 to-orange-300/5',
		'from-lavender/20 to-lavender/5',
		'from-emerald-300/20 to-emerald-300/5',
		'from-teal-300/20 to-teal-300/5',
		'from-blue-300/20 to-blue-300/5',
		'from-rose-300/20 to-rose-300/5'
	];

	const seoTitle = m.calendar_seo_title();
	const seoDescription = m.calendar_seo_description();
	const canonicalUrl = $derived(absoluteUrl(page.url.origin, '/calendar'));
	const calendarJsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, '/calendar', seoTitle, seoDescription),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: '/' },
			{ name: m.calendar_breadcrumb(), path: '/calendar' }
		])
	]));

	const viewButtons = [
		{ key: 'card' as const, label: m.calendar_view_week(), short: m.calendar_view_week(), group: 'primary', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
		{ key: 'list' as const, label: m.calendar_view_list(), short: m.calendar_view_list(), group: 'primary', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>' },
		{ key: 'calendar' as const, label: m.calendar_view_month_calendar(), short: m.calendar_view_month_calendar(), group: 'monthly', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M7 14h.01M11 14h.01M15 14h.01M7 18h.01M11 18h.01M15 18h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
		{ key: 'grid' as const, label: m.calendar_view_month_grid(), short: m.calendar_view_month_grid(), group: 'monthly', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M3 10h18M3 16h18M8 4v16M14 4v16"/>' }
	];
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	{@html jsonLdScript(calendarJsonLd)}
</svelte:head>

{#snippet viewToggle()}
	<div class="w-full lg:w-auto lg:flex lg:justify-center">
		<div class="glass-card rounded-2xl p-1.5 grid grid-cols-4 gap-1 lg:flex lg:items-center lg:min-w-max">
			{#each viewButtons as btn, index}
				{#if index === 2}
					<div class="hidden lg:block mx-1 h-7 w-px bg-lavender/25" aria-hidden="true"></div>
				{/if}
				{@const active = viewMode === btn.key}
				<button
					aria-label={btn.label}
					title={btn.label}
					onclick={() => {
						viewMode = btn.key;
						navigateCalendar(getViewUrl(btn.key, lang, params_y, params_m, params_sd, params_ed));
					}}
					class="min-w-0 justify-center px-2 lg:px-4 py-2.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 lg:gap-2 touch-target {active ? 'bg-white text-coral-dark shadow-md shadow-lavender/20 ring-1 ring-coral/10' : btn.group === 'monthly' ? 'text-plum-light/80 hover:bg-lavender/10 hover:text-plum' : 'text-plum-light hover:bg-white/60'}"
				>
					<svg class="w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{@html btn.icon}</svg>
					<span class="hidden lg:inline">{btn.label}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet monthHeader()}
	<div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-4 sm:mb-6">
		<div class="flex items-center gap-3">
			<button
				aria-label={m.calendar_month_prev_aria()}
				onclick={prevMonth}
				class="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:-translate-x-0.5 touch-target flex-shrink-0"
			>
				<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			</button>

			<div class="flex-1 min-w-0 text-center">
				<div class="text-[11px] sm:text-xs font-bold text-coral-dark uppercase tracking-wide mb-0.5">
					{viewMode === 'grid' ? m.calendar_view_month_grid() : m.calendar_view_month_calendar()}
				</div>
				<h2 class="font-[family-name:var(--font-display)] text-base sm:text-2xl md:text-3xl font-bold text-plum truncate">
					<span class="sm:hidden">{new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short' }).format(currentMonth)}</span>
					<span class="hidden sm:inline">{new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long' }).format(currentMonth)}</span>
				</h2>
			</div>

			<div class="flex items-center gap-2 flex-shrink-0">
				<button
					onclick={goToToday}
					aria-label={m.calendar_month_today_aria()}
					class="hidden sm:inline-flex h-11 px-5 rounded-2xl items-center justify-center bg-gradient-to-r from-coral to-coral-dark text-white text-sm font-bold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5 transition-all touch-target"
				>
					{m.calendar_month_today_text()}
				</button>
				<button
					onclick={goToToday}
					aria-label={m.calendar_month_today_aria()}
					class="sm:hidden w-11 h-11 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white flex items-center justify-center shadow-lg shadow-coral/25 touch-target"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</button>
				<button
					aria-label={m.calendar_month_next_aria()}
					onclick={nextMonth}
					class="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:translate-x-0.5 touch-target"
				>
					<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
				</button>
			</div>
		</div>
	</div>
{/snippet}

<div class="py-6 sm:py-8 max-w-6xl mx-auto">
	<!-- Today / This Week Hero -->
	<section class="relative overflow-hidden glass-card rounded-3xl p-5 sm:p-8 mb-5 sm:mb-7">
		<div class="absolute -top-16 -right-12 w-40 h-40 rounded-full bg-coral/10 blur-3xl"></div>
		<div class="absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-lavender/20 blur-3xl"></div>
		<div class="relative grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-end">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral-dark mb-3">
					<span class="w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></span>
					Today / This Week
				</div>
				<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum leading-tight mb-2">
					{m.calendar_title_plain()}<span class="text-coral"> GL</span>
				</h1>
				<p class="text-sm sm:text-base text-plum-light max-w-2xl leading-relaxed">
					{m.calendar_subtitle()}
				</p>
			</div>

			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
				<div class="rounded-2xl bg-white/70 p-4 shadow-sm shadow-lavender/10 border border-white/60">
					<div class="text-xs font-medium text-plum-light mb-1">{m.calendar_today_label()}</div>
					<div class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum">{weekSummary.todayCount}</div>
					<div class="text-[11px] text-plum-light">{m.calendar_today_count_label()}</div>
				</div>
				<div class="rounded-2xl bg-white/70 p-4 shadow-sm shadow-lavender/10 border border-white/60">
					<div class="text-xs font-medium text-plum-light mb-1">{m.calendar_week_label()}</div>
					<div class="font-[family-name:var(--font-display)] text-2xl font-bold text-plum">{weekSummary.weekCount}</div>
					<div class="text-[11px] text-plum-light">{m.calendar_week_count_label()}</div>
				</div>
				<div class="col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1 rounded-2xl bg-gradient-to-br from-coral/10 to-lavender/15 p-4 border border-coral/10">
					<div class="text-xs font-medium text-plum-light mb-1">{m.calendar_featured_label()}</div>
					{#if weekSummary.featuredEvent}
						<div class="text-sm font-bold text-plum truncate">{weekSummary.featuredEvent.series}</div>
						<div class="text-xs text-coral-dark font-semibold mt-1">{weekSummary.featuredDay} · {weekSummary.featuredEvent.time}</div>
					{:else}
						<div class="text-sm font-bold text-plum">{m.calendar_featured_empty()}</div>
						<div class="text-xs text-plum-light mt-1">{m.calendar_featured_empty_sub()}</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="relative mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<button
				onclick={goToThisWeek}
				class="inline-flex w-full lg:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral to-coral-dark px-5 py-3 text-sm font-bold text-white shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5 transition-all touch-target"
			>
				{m.calendar_this_week_cta()}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
			</button>
			<div class="w-full lg:max-w-max">
				{@render viewToggle()}
			</div>
		</div>
	</section>

	<div bind:this={scheduleSection} class="scroll-mt-24 sm:scroll-mt-28">
	<!-- Grid View -->
	{#if viewMode === 'grid'}
		{@render monthHeader()}
		<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
			{#if contentLoading}
				<div class="grid-loading-skeleton p-4 sm:p-6">
					<div class="overflow-x-auto">
						<table class="w-full min-w-[640px]">
							<thead>
								<tr class="border-b border-lavender/10">
									<th class="px-2 sm:px-3 py-3 text-left w-28 sm:w-32 md:w-44 lg:w-52 border-r border-lavender/10">
										<div class="h-4 w-16 bg-lavender/10 rounded animate-pulse"></div>
									</th>
									{#each Array(7) as _, i}
										<th class="px-1 sm:px-2 py-3 text-center min-w-[32px] sm:min-w-[44px]">
											<div class="h-3 w-5 mx-auto bg-lavender/10 rounded animate-pulse mb-1"></div>
											<div class="h-2 w-3 mx-auto bg-lavender/5 rounded animate-pulse"></div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each Array(5) as _, row}
									<tr class="border-b border-lavender/5 {row % 2 === 0 ? 'bg-white/20' : ''}">
										<td class="px-2 sm:px-3 py-3 border-r border-lavender/10 w-28 sm:w-32 md:w-44 lg:w-52">
											<div class="flex flex-col items-center gap-1.5 md:gap-2">
												<div class="w-14 h-20 sm:w-16 sm:h-22 md:w-20 md:h-28 bg-lavender/10 rounded-lg animate-pulse"></div>
												<div class="h-2.5 w-20 md:w-32 bg-lavender/10 rounded animate-pulse"></div>
												<div class="h-2.5 w-14 md:w-24 bg-lavender/5 rounded animate-pulse"></div>
											</div>
										</td>
										{#each Array(7) as _, col}
											<td class="px-0.5 sm:px-1 py-1 sm:py-2 text-center">
												{#if (row * 7 + col) % 3 === 0}
													<div class="h-8 sm:h-10 bg-lavender/5 rounded-md sm:rounded-lg animate-pulse"></div>
												{:else}
													<div class="h-8 sm:h-10"></div>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full min-w-[640px]">
						<thead>
							<tr class="border-b border-lavender/10">
								<th class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-semibold text-plum-light w-28 sm:w-32 md:w-44 lg:w-52 border-r border-lavender/10 align-top">
									{m.calendar_grid_series_header()}
								</th>
								{#each monthDays as day}
									{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
									{@const isTodayDate = formatDateLocal(dateObj) === formatDateLocal(new Date())}
									{@const dayOfWeek = dateObj.getDay()}
									<th class="px-1 sm:px-2 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium min-w-[32px] sm:min-w-[44px] {isTodayDate ? 'bg-coral/10' : ''} {dayOfWeek === 0 || dayOfWeek === 6 ? 'text-coral-dark' : 'text-plum-light'}">
										<div class="font-bold">{day}</div>
										<div class="text-[8px] sm:text-[10px] opacity-70">{weekDays[dayOfWeek]}</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each monthAllSeries as seriesName, seriesIndex}
								<tr class="border-b border-lavender/5 hover:bg-white/30 transition-colors {seriesIndex % 2 === 0 ? 'bg-white/20' : ''}">
									<td class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-2 sm:py-3 border-r border-lavender/10 align-top w-28 sm:w-32 md:w-44 lg:w-52">
										<div class="flex flex-col items-center gap-1.5 md:gap-2">
											<img
												src={monthSeriesPosters[seriesName] ?? '/placeholders/poster.svg'}
												alt=""
												class="w-14 h-20 sm:w-16 sm:h-22 md:w-20 md:h-28 rounded-lg object-cover shadow-md flex-shrink-0 bg-white/50"
												loading="lazy"
											/>
											<div class="font-semibold text-plum text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-2 md:line-clamp-none text-center min-w-0" title={seriesName}>{seriesName}</div>
										</div>
									</td>
									{#each monthDays as day}
										{@const dayEvents = getEventsForSeriesAndDay(seriesName, day)}
										{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
										{@const isTodayDate = formatDateLocal(dateObj) === formatDateLocal(new Date())}
										<td class="px-0.5 sm:px-1 py-1 sm:py-2 text-center {isTodayDate ? 'bg-coral/5' : ''}">
											{#if dayEvents.length > 0}
												<div class="space-y-0.5">
													{#each dayEvents as event}
														<div class="relative group rounded-md sm:rounded-lg p-1 sm:p-1.5 text-[9px] sm:text-[10px] leading-tight border {platformColors[event.platforms[0]] || 'bg-gray-50 text-gray-600 border-gray-200'} cursor-pointer hover:shadow-md transition-all touch-target">
															<div class="font-bold">{event.time}</div>
															<div class="mt-0.5">{event.episode}</div>
															{#if event.isUncut}
																<div class="mt-0.5 text-[7px] sm:text-[8px] font-medium text-coral-dark">UNCUT</div>
															{/if}
															<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-plum text-white text-[8px] sm:text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
																{event.platforms.join(', ')}
																<div class="absolute top-full left-1/2 -translate-x-1/2 border-2 border-transparent border-t-plum"></div>
															</div>
														</div>
													{/each}
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

				<div class="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-plum-light px-4 sm:px-6 pb-4 sm:pb-6">
					<span>{m.calendar_platform_label()}</span>
					{#each Object.entries(platformColors) as [platform, colorClass]}
						<div class="flex items-center gap-1">
							<div class="w-3 h-3 rounded {colorClass.split(' ')[0]}"></div>
							<span>{platform}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if viewMode === 'calendar'}
		{@render monthHeader()}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
			<div class="lg:col-span-2">
				<div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
					{#if contentLoading}
						<div class="calendar-loading-skeleton">
							<div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
								{#each weekDays as day}
									<div class="h-3 sm:h-4 bg-lavender/10 rounded animate-pulse"></div>
								{/each}
							</div>
							<div class="grid grid-cols-7 gap-0.5 sm:gap-1">
								{#each Array(35) as _, i}
									<div class="aspect-square rounded-lg sm:rounded-xl bg-lavender/5 animate-pulse"></div>
								{/each}
							</div>
						</div>
					{:else}
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
										<span class="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-coral rounded-md text-[8px] sm:text-[10px] text-white font-bold shadow-sm leading-none">{m.calendar_today_badge()}</span>
									{/if}
								</button>
							{/each}
						</div>

						<div class="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-plum-light">
							<div class="flex items-center gap-1 sm:gap-1.5">
								<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-coral"></div>
								<span>{m.calendar_legend_has_event()}</span>
							</div>
							<div class="flex items-center gap-1 sm:gap-1.5">
								<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-coral ring-1 sm:ring-1 ring-coral"></div>
								<span>{m.calendar_today_badge()}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="lg:col-span-1">
				<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:sticky lg:top-28">
					{#if selectedDate && selectedEvents.length > 0}
						{@const d = new Date(selectedDate)}
						<h3 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum mb-1">
							{d.getDate()} {getMonthName(d, lang)}
						</h3>
						<p class="text-xs sm:text-sm text-plum-light mb-4 sm:mb-5">{m.calendar_selected_count({ count: selectedEvents.length })}</p>

						<div class="space-y-2 sm:space-y-3">
							{#each selectedEvents as event}
								<div class="glass-card-strong rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all">
									<div class="flex gap-3 sm:gap-4">
										<img
											src={event.posterUrl}
											alt="{event.series}"
											class="w-14 h-20 sm:w-20 sm:h-28 rounded-lg sm:rounded-xl object-cover shadow-sm flex-shrink-0 bg-white/50"
											loading="lazy"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-1.5 sm:mb-2">
												<span class="px-2 py-0.5 rounded-lg bg-coral/10 text-coral-dark text-xs font-bold">{event.time}</span>
												{#if event.isUncut}
													<span class="px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-xs font-medium">Uncut</span>
												{/if}
											</div>
											<h4 class="font-semibold text-plum text-sm mb-0.5 sm:mb-1 truncate">{event.series}</h4>
											<div class="flex items-center gap-2 text-xs text-plum-light">
												<span class="truncate">{event.episode}</span>
												<span class="flex-shrink-0">•</span>
												<span class="truncate">{event.platforms.join(', ')}</span>
											</div>
											<a href="/{page.data.lang}/series/{event.seriesId}" class="mt-2 sm:mt-3 inline-flex items-center gap-1 text-xs font-medium text-coral-dark hover:text-coral transition-colors">
												{m.calendar_detail_link()}
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
											</a>
										</div>
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
									{m.calendar_selected_empty()}
								{:else}
									{@html m.calendar_selected_hint().replace('\n', '<br/>')}
								{/if}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

	{:else if viewMode === 'list'}
		<!-- List View -->
		<CalendarWeekHeader
			currentWeek={currentWeek}
			onPrevWeek={prevWeek}
			onNextWeek={nextWeek}
			onThisWeek={goToThisWeek}
		/>

		{#if contentLoading}
			<div class="list-loading-skeleton space-y-4 sm:space-y-6">
				{#each Array(3) as _, card}
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
						<div class="px-4 sm:px-6 py-3 sm:py-4 bg-lavender/10 border-b border-white/50">
							<div class="h-5 sm:h-6 w-24 sm:w-32 bg-lavender/10 rounded animate-pulse"></div>
						</div>
						<div class="divide-y divide-lavender/10">
							{#each Array(2) as _, item}
								<div class="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-5">
									<div class="flex-shrink-0 w-12 sm:w-16">
										<div class="h-4 w-10 sm:w-12 mx-auto bg-lavender/10 rounded animate-pulse"></div>
									</div>
									<div class="flex-1 space-y-2 min-w-0">
										<div class="h-4 w-40 sm:w-56 bg-lavender/10 rounded animate-pulse"></div>
										<div class="h-3 w-28 sm:w-36 bg-lavender/5 rounded animate-pulse"></div>
									</div>
									<div class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-lavender/5 animate-pulse"></div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-4 sm:space-y-6">
				{#each weekScheduleByDay as day, i}
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
						<div class="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r {dayColorClasses[i] || 'from-lavender/20 to-lavender/5'} border-b border-white/50">
							<h2 class="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-plum flex items-center gap-2 sm:gap-3">
								<span class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/80 flex items-center justify-center text-base sm:text-lg">📅</span>
								{weekDayNames[day.dayIndex]}
							</h2>
						</div>
						<div class="divide-y divide-lavender/10">
							{#each day.items as item}
								<div class="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-5 hover:bg-white/40 transition-colors group">
									<img
										src={item.posterUrl}
										alt="{item.series}"
										class="w-10 h-14 sm:w-12 sm:h-16 rounded-lg object-cover shadow-sm flex-shrink-0 bg-white/50"
										loading="lazy"
									/>
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
											<span>{item.platforms.join(', ')}</span>
										</div>
									</div>
									<a
										href="/{page.data.lang}/series/{item.seriesId}"
										aria-label={m.calendar_list_detail_aria()}
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
	{:else if viewMode === 'card'}
		<!-- Card View -->
		<CalendarWeekHeader
			currentWeek={currentWeek}
			onPrevWeek={prevWeek}
			onNextWeek={nextWeek}
			onThisWeek={goToThisWeek}
		/>

		{#if contentLoading}
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
				{#each Array(7) as _, i}
					<div class="glass-card rounded-2xl p-3 space-y-3 animate-pulse">
						<div class="h-4 w-16 bg-lavender/10 rounded mx-auto"></div>
						<div class="aspect-[2/3] bg-lavender/10 rounded-lg"></div>
						<div class="h-3 w-full bg-lavender/10 rounded"></div>
						<div class="h-3 w-2/3 bg-lavender/5 rounded"></div>
					</div>
				{/each}
			</div>
		{:else}
			<CardScheduleBoard scheduleByDay={weekScheduleByDay} weekStart={getStartOfWeek(currentWeek)} />
		{/if}
	{/if}
	</div>

	<!-- Countdown CTA -->
	<a href="/{page.data.lang}/countdown" class="group flex items-center gap-4 sm:gap-5 mt-6 sm:mt-8 glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:shadow-lavender/20 transition-all duration-300">
		<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-coral/90 to-lavender flex items-center justify-center flex-shrink-0 shadow-lg shadow-coral/20">
			<svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-3 4-4 7-4 10v2l-1 2h10l-1-2v-2c0-3-1-6-4-10z"/><circle cx="12" cy="10" r="1.5" fill="white" opacity="0.6"/><path d="M10 17c0 1.5 2 2.5 2 2.5s2-1 2-2.5" fill="currentColor" opacity="0.4"/></svg>
		</div>
		<div class="flex-1 min-w-0">
			<h3 class="font-[family-name:var(--font-display)] text-sm sm:text-base font-bold text-plum group-hover:text-coral-dark transition-colors">{m.calendar_countdown_cta_title()}</h3>
			<p class="text-xs sm:text-sm text-plum-light">{m.calendar_countdown_cta_desc()}</p>
		</div>
		<svg class="w-5 h-5 sm:w-6 sm:h-6 text-coral-dark group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
	</a>

	<!-- Notes section (always visible, independent of contentLoading) -->
	<div class="mt-4 sm:mt-6 glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 opacity-95">
		<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-lavender/20 flex items-center justify-center flex-shrink-0">
			<svg class="w-4 h-4 sm:w-5 sm:h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>
		<div>
			<h3 class="font-semibold text-plum mb-1 text-sm sm:text-base">{m.calendar_notes_title()}</h3>
			<p class="text-xs sm:text-sm text-plum-light leading-relaxed">
				{m.calendar_notes_body()}
			</p>
		</div>
	</div>
</div>
