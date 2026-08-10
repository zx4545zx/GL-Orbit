<script lang="ts">
	import { tick } from 'svelte';
	import { navigating, page } from '$app/state';
	import { goto } from '$app/navigation';
	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, absoluteUrl, buildBreadcrumbJsonLd, buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, localizedPath, safeJsonLd } from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { CalendarEvent, CalendarApiResponse } from '$lib/types/calendar.js';
	import { getCalendarWeekdayShort, getViewUrl } from './calendar.js';
	import CalendarMonthHeader from '$lib/components/calendar/CalendarMonthHeader.svelte';
	import CalendarViewToggle from '$lib/components/calendar/CalendarViewToggle.svelte';
	import CalendarWeekHeader from '$lib/components/calendar/CalendarWeekHeader.svelte';
	import CardScheduleBoard from './CardScheduleBoard.svelte';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';

	let { data }: { data: PageData } = $props();

	let viewMode = $state<'grid' | 'calendar' | 'list' | 'card'>('calendar');
	let selectedDate = $state<string | null>(null);
	let scheduleSection = $state<HTMLElement>();

	const calendar = $derived<CalendarApiResponse>(data.calendar);
	const params_y = $derived(data.params.year);
	const params_m = $derived(data.params.month);
	const params_sd = $derived<string | null>(data.params.startDate);
	const params_ed = $derived<string | null>(data.params.endDate);
	const params_view = $derived(data.params.view);
	const contentLoading = $derived(Boolean(navigating.to && navigating.to.url.pathname === page.url.pathname));

	$effect(() => {
		viewMode = params_view ?? (data.params.startDate ? 'card' : 'calendar');
	});

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
	function getWeekDayLong(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { weekday: 'long' }).format(date);
	}
	const weekDays = $derived(Array.from({ length: 7 }, (_, i) => getCalendarWeekdayShort(i, lang)));
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
		navigateCalendar(getViewUrl(viewMode === 'grid' ? 'grid' : 'calendar', lang, newDate.getFullYear(), newDate.getMonth() + 1, null, null));
	}

	function nextMonth() {
		const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
		navigateCalendar(getViewUrl(viewMode === 'grid' ? 'grid' : 'calendar', lang, newDate.getFullYear(), newDate.getMonth() + 1, null, null));
	}

	function goToToday() {
		const today = new Date();
		navigateCalendar(getViewUrl(viewMode === 'grid' ? 'grid' : 'calendar', lang, today.getFullYear(), today.getMonth() + 1, null, null));
	}

	function prevWeek() {
		const newDate = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() - 7);
		const start = getStartOfWeek(newDate);
		const end = getEndOfWeek(newDate);
		navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}&view=${viewMode}`);
	}

	function nextWeek() {
		const newDate = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() + 7);
		const start = getStartOfWeek(newDate);
		const end = getEndOfWeek(newDate);
		navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}&view=${viewMode}`);
	}

	async function goToThisWeek(view: 'card' | 'list') {
		viewMode = view;
		const today = new Date();
		const start = getStartOfWeek(today);
		const end = getEndOfWeek(today);
		await navigateCalendar(`/${lang}/calendar?startDate=${formatDateLocal(start)}&endDate=${formatDateLocal(end)}&view=${view}`);
		await scrollToSchedule();
	}

	async function selectView(view: 'grid' | 'calendar' | 'list' | 'card') {
		viewMode = view;
		await navigateCalendar(getViewUrl(view, lang, params_y, params_m, params_sd, params_ed));
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
		selectedDate = selectedDate === fullDate ? null : fullDate;
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

	const seoTitle = m.calendar_seo_title();
	const seoDescription = m.calendar_seo_description();
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = '/calendar';
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const calendarJsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, canonicalPath), seoTitle, seoDescription, currentLang),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.nav_home(), path: localizedPath(currentLang, '') },
			{ name: m.calendar_breadcrumb(), path: localizedPath(currentLang, canonicalPath) }
		])
	]));

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

<div class="mx-auto max-w-6xl py-6 sm:py-8">
	<!-- ============ 1. HERO ============ -->
	<header class="cal-hero">
		<div>
			<span class="cal-kicker">
				<span class="cal-blink orbit-round-data" aria-hidden="true"></span>
				Today / This Week
			</span>
			<h1 class="cal-title">
				{m.calendar_title_plain()} <span class="cal-title-accent">GL</span>
				<OrbitIcon name="spark" className="inline-block h-[0.8em] w-[0.8em] align-[-0.05em] text-coral" />
			</h1>
			<p class="cal-sub">{m.calendar_subtitle()}</p>
			<div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
				<button type="button" onclick={() => goToThisWeek('card')} class="cal-cta">
					{m.calendar_this_week_cta()}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
				</button>
				<CalendarViewToggle {viewMode} ariaLabel={m.calendar_title_plain()} onSelect={selectView} />
			</div>
		</div>

		<div class="cal-stats">
			<div class="cal-stat">
				<div class="cal-stat-label">{m.calendar_today_label()}</div>
				<div class="cal-stat-num">{weekSummary.todayCount}</div>
				<div class="cal-stat-detail">{m.calendar_today_count_label()}</div>
			</div>
			<div class="cal-stat">
				<div class="cal-stat-label">{m.calendar_week_label()}</div>
				<div class="cal-stat-num">{weekSummary.weekCount}</div>
				<div class="cal-stat-detail">{m.calendar_week_count_label()}</div>
			</div>
			<div class="cal-stat col-span-2 sm:col-span-1">
				<div class="cal-stat-label">{m.calendar_featured_label()}</div>
				{#if weekSummary.featuredEvent}
					<div class="cal-stat-num cal-stat-num--text truncate">{weekSummary.featuredEvent.series}</div>
					<div class="cal-stat-detail"><b>{weekSummary.featuredDay}</b> · {weekSummary.featuredEvent.time}{#if weekSummary.featuredEvent.isUncut} · UNCUT{/if}</div>
				{:else}
					<div class="cal-stat-num cal-stat-num--text">{m.calendar_featured_empty()}</div>
					<div class="cal-stat-detail">{m.calendar_featured_empty_sub()}</div>
				{/if}
			</div>
		</div>
	</header>

	<div bind:this={scheduleSection} class="scroll-mt-24 sm:scroll-mt-28">
	<!-- ============ 6. GRID VIEW ============ -->
	{#if viewMode === 'grid'}
		<CalendarMonthHeader
			{currentMonth}
			viewMode="grid"
			{lang}
			onPrevMonth={prevMonth}
			onNextMonth={nextMonth}
			onToday={goToToday}
		/>
		<div class="cal-card overflow-hidden">
			{#if contentLoading}
				<div class="grid-loading-skeleton p-3 sm:p-4">
					<div class="cal-gridtable-wrap overflow-x-auto">
						<table class="cal-gridtable">
							<thead>
								<tr>
									<th class="cal-gseries"><div class="h-4 w-16 animate-pulse bg-lavender/20"></div></th>
									{#each Array(7) as _}
										<th>
											<div class="mx-auto mb-1 h-3 w-5 animate-pulse bg-lavender/20"></div>
											<div class="mx-auto h-2 w-3 animate-pulse bg-lavender/10"></div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each Array(5) as _, row}
									<tr>
										<th class="cal-gseries">
											<div class="flex items-center gap-2">
												<div class="h-11 w-8 animate-pulse bg-lavender/20"></div>
												<div class="h-3 w-20 animate-pulse bg-lavender/20"></div>
											</div>
										</th>
										{#each Array(7) as _, col}
											<td>
												{#if (row * 7 + col) % 3 === 0}
													<div class="mx-auto h-8 w-12 animate-pulse bg-lavender/10"></div>
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
				<div class="cal-gridtable-wrap overflow-x-auto">
					<table class="cal-gridtable">
						<thead>
							<tr>
								<th class="cal-gseries">{m.calendar_grid_series_header()}</th>
								{#each monthDays as day}
									{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
									{@const isTodayDate = formatDateLocal(dateObj) === formatDateLocal(new Date())}
									<th class={isTodayDate ? 'cal-gtoday' : ''}>
										<div class="font-bold">{day}</div>
										<small>{weekDays[dateObj.getDay()]}</small>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each monthAllSeries as seriesName}
								<tr>
									<th class="cal-gseries">
										<span class="cal-gseries-inner">
											<Picture
												src={monthSeriesPosters[seriesName] ?? '/placeholders/poster.svg'}
												type="posters"
												sizes="88px"
												alt=""
												width={64}
												height={96}
												class="cal-gposter"
												loading="lazy"
											/>
											<span class="cal-gname" title={seriesName}>{seriesName}</span>
										</span>
									</th>
									{#each monthDays as day}
										{@const dayEvents = getEventsForSeriesAndDay(seriesName, day)}
										{@const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
										{@const isTodayDate = formatDateLocal(dateObj) === formatDateLocal(new Date())}
										<td class={isTodayDate ? 'cal-gtoday' : ''}>
											{#if dayEvents.length > 0}
												{#each dayEvents as event}
													<div class="cal-gcell">
														<b>{event.time}</b>
														<span>{event.episode}</span>
														{#if event.platforms[0]}
															<span class="cal-chip border {platformColors[event.platforms[0]] || 'bg-gray-50 text-gray-600 border-gray-200'}">{event.platforms[0]}</span>
														{/if}
														{#if event.isUncut}
															<span class="cal-badge-uncut">UNCUT</span>
														{/if}
													</div>
												{/each}
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="cal-flush flex flex-wrap items-center gap-2 px-3 pb-3 pt-3 text-[10px] text-plum-light sm:gap-3 sm:px-4 sm:pb-4 sm:text-xs" style="border-top: var(--orbit-border-width) solid var(--orbit-line)">
					<span>{m.calendar_platform_label()}</span>
					{#each Object.entries(platformColors) as [platform, colorClass]}
						<span class="cal-chip border {colorClass}">{platform}</span>
					{/each}
				</div>
			{/if}
		</div>

	<!-- ============ 3. MONTH CALENDAR VIEW ============ -->
	{:else if viewMode === 'calendar'}
		<CalendarMonthHeader
			{currentMonth}
			viewMode="calendar"
			{lang}
			onPrevMonth={prevMonth}
			onNextMonth={nextMonth}
			onToday={goToToday}
		/>
		<div class="cal-month-layout">
			<div class="cal-card overflow-hidden">
				{#if contentLoading}
					<div class="calendar-loading-skeleton">
						<div class="cal-weekdays">
							{#each weekDays as _}
								<div><div class="mx-auto h-3 w-6 animate-pulse bg-lavender/30"></div></div>
							{/each}
						</div>
						<div class="cal-grid">
							{#each Array(42) as _}
								<div class="cal-cell cal-cell--skeleton animate-pulse"></div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="cal-weekdays" role="row">
						{#each weekDays as day, i}
							<div class={i === 0 || i === 6 ? 'cal-weekday--wkend' : ''}>{day}</div>
						{/each}
					</div>

					<div class="cal-grid" role="grid" aria-label={new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long' }).format(currentMonth)}>
						{#each calendarDays as day}
							{@const eventCount = getEventCount(day.fullDate)}
							{@const isSelected = selectedDate === day.fullDate}
							<button
								type="button"
								onclick={() => selectDate(day.fullDate)}
								aria-pressed={isSelected}
								aria-current={isToday(day.fullDate) ? 'date' : undefined}
								class="cal-cell
									{day.month !== 'current' ? 'cal-cell--dim' : ''}
									{isToday(day.fullDate) ? 'cal-cell--today' : ''}
									{isSelected ? 'cal-cell--selected' : ''}"
							>
								<span class="cal-dnum">{day.date}</span>
								{#if isToday(day.fullDate)}
									<span class="cal-sticker cal-cell-today-sticker">{m.calendar_today_badge()}</span>
								{/if}
								{#if eventCount > 0}
									<span class="cal-dots" aria-hidden="true">
										{#each Array(Math.min(eventCount, 3)) as _}
											<i class="cal-dot orbit-round-data"></i>
										{/each}
									</span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="cal-flush flex items-center gap-3 px-3 py-2 text-[10px] text-plum-light sm:gap-4 sm:px-4 sm:text-xs" style="border-top: var(--orbit-border-width) solid var(--orbit-line)">
						<span class="flex items-center gap-1.5">
							<i class="cal-dot orbit-round-data" aria-hidden="true"></i>
							{m.calendar_legend_has_event()}
						</span>
					</div>
				{/if}
			</div>

			<aside class="cal-card cal-panel" aria-label={m.calendar_selected_count({ count: selectedEvents.length })}>
				{#if selectedDate && selectedEvents.length > 0}
					{@const d = new Date(selectedDate)}
					<div class="cal-panel-head">
						<h3>{getWeekDayLong(d, lang)} {d.getDate()} {getMonthName(d, lang)}</h3>
						<span class="cal-panel-count">{m.calendar_selected_count({ count: selectedEvents.length })}</span>
					</div>
					<div class="cal-panel-body">
						{#each selectedEvents as event}
							<article class="cal-event">
								<div class="cal-event-poster">
									<Picture
										src={event.posterUrl}
										type="posters"
										sizes="64px"
										alt={event.series}
										width={96}
										height={135}
										class="block h-full w-full object-cover"
										loading="lazy"
									/>
								</div>
								<div class="cal-event-info">
									<div class="cal-event-meta">
										<span class="cal-time-badge">{event.time}</span>
										{#if event.isUncut}
											<span class="cal-badge-uncut">UNCUT</span>
										{/if}
									</div>
									<div class="cal-event-name">{event.series}</div>
									<div class="cal-event-ep">{event.episode}</div>
									<div class="cal-event-meta">
										{#each event.platforms as platform}
											<span class="cal-chip border {platformColors[platform] || 'bg-gray-50 text-gray-600 border-gray-200'}">{platform}</span>
										{/each}
									</div>
									<a class="cal-event-more" href="/{page.data.lang}/series/{event.seriesId}">
										{m.calendar_detail_link()}
										<OrbitIcon name="arrow-right" className="h-4 w-4" />
									</a>
								</div>
							</article>
						{/each}
					</div>
					<div class="cal-panel-foot">
						<OrbitIcon name="spark" className="h-4 w-4" />
						{m.calendar_selected_hint().replace('\n', ' ')}
					</div>
				{:else}
					<div class="px-4 py-8 text-center sm:py-10">
						<div class="cal-empty-icon mx-auto mb-3">
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
						</div>
						<p class="text-xs text-plum-light sm:text-sm">
							{#if selectedDate}
								{m.calendar_selected_empty()}
							{:else}
								{@html m.calendar_selected_hint().replace('\n', '<br/>')}
							{/if}
						</p>
					</div>
				{/if}
			</aside>
		</div>

	<!-- ============ 5. LIST VIEW ============ -->
	{:else if viewMode === 'list'}
		<CalendarWeekHeader
			currentWeek={currentWeek}
			onPrevWeek={prevWeek}
			onNextWeek={nextWeek}
			onThisWeek={() => goToThisWeek('list')}
		/>

		{#if contentLoading}
			<div class="list-loading-skeleton grid gap-4 sm:gap-5">
				{#each Array(3) as _}
					<div class="cal-card overflow-hidden">
						<div class="cal-lday-head">
							<div class="h-4 w-28 animate-pulse bg-lavender/30"></div>
						</div>
						{#each Array(2) as _}
							<div class="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4" style="border-top: var(--orbit-border-width) solid var(--orbit-line)">
								<div class="h-16 w-11 flex-shrink-0 animate-pulse bg-lavender/20"></div>
								<div class="h-4 w-12 flex-shrink-0 animate-pulse bg-lavender/20"></div>
								<div class="min-w-0 flex-1 space-y-2">
									<div class="h-4 w-40 animate-pulse bg-lavender/20"></div>
									<div class="h-3 w-28 animate-pulse bg-lavender/10"></div>
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid gap-4 sm:gap-5">
				{#each weekScheduleByDay as day}
					{@const dayDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + day.dayIndex)}
					<section class="cal-card cal-lday">
						<div class="cal-lday-head">
							<span class="cal-lday-title">{weekDayNames[day.dayIndex]} {dayDate.getDate()} {getMonthName(dayDate, lang)}</span>
							<span class="cal-lday-count">{m.calendar_selected_count({ count: day.items.length })}</span>
						</div>
						{#if day.items.length > 0}
							{#each day.items as item}
								<a class="cal-lrow" href="/{page.data.lang}/series/{item.seriesId}">
									<span class="cal-lrow-poster">
										<Picture
											src={item.posterUrl}
											type="posters"
											sizes="44px"
											alt={item.series}
											width={66}
											height={99}
											class="block h-full w-full object-cover"
											loading="lazy"
										/>
									</span>
									<span class="cal-lrow-time">{item.time}</span>
									<span class="cal-lrow-main">
										<span class="cal-lrow-name">
											{item.series}
											{#if item.isUncut}
												<span class="cal-badge-uncut">UNCUT</span>
											{/if}
										</span>
										<span class="cal-lrow-meta">
											{item.episode} ·
											{#each item.platforms as platform}
												<span class="cal-chip border {platformColors[platform] || 'bg-gray-50 text-gray-600 border-gray-200'}">{platform}</span>
											{/each}
										</span>
									</span>
									<span class="cal-lrow-arrow"><OrbitIcon name="arrow-right" className="h-5 w-5" /></span>
								</a>
							{/each}
						{:else}
							<p class="px-3 py-4 text-center text-xs text-plum-light sm:px-4">{m.calendar_card_no_events()}</p>
						{/if}
					</section>
				{/each}
			</div>
		{/if}

	<!-- ============ 4. WEEK BOARD (CARD VIEW) ============ -->
	{:else if viewMode === 'card'}
		<CalendarWeekHeader
			currentWeek={currentWeek}
			onPrevWeek={prevWeek}
			onNextWeek={nextWeek}
			onThisWeek={() => goToThisWeek('card')}
		/>

		{#if contentLoading}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
				{#each Array(7) as _}
					<div class="cal-card animate-pulse space-y-3 p-3">
						<div class="mx-auto h-4 w-16 bg-lavender/20"></div>
						<div class="aspect-[2/3] bg-lavender/20"></div>
						<div class="h-3 w-full bg-lavender/20"></div>
						<div class="h-3 w-2/3 bg-lavender/10"></div>
					</div>
				{/each}
			</div>
		{:else}
			<CardScheduleBoard scheduleByDay={weekScheduleByDay} weekStart={getStartOfWeek(currentWeek)} />
		{/if}
	{/if}
	</div>

	<!-- ============ 6. COUNTDOWN CTA BANNER ============ -->
	<a href="/{page.data.lang}/countdown" class="cal-banner group" aria-label={m.calendar_countdown_cta_title()}>
		<span class="cal-banner-icon" aria-hidden="true">
			<svg class="h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-3 4-4 7-4 10v2l-1 2h10l-1-2v-2c0-3-1-6-4-10z"/><circle cx="12" cy="10" r="1.5" fill="white" opacity="0.6"/><path d="M10 17c0 1.5 2 2.5 2 2.5s2-1 2-2.5" fill="currentColor" opacity="0.4"/></svg>
		</span>
		<span class="min-w-0 flex-1">
			<h2 class="cal-banner-title">{m.calendar_countdown_cta_title()}</h2>
			<p class="cal-banner-desc">{m.calendar_countdown_cta_desc()}</p>
		</span>
		<span class="cal-banner-go"><OrbitIcon name="arrow-right" className="h-6 w-6" /></span>
	</a>

	<!-- ============ 7. NOTES ============ -->
	<div class="cal-notes">
		<span class="cal-notes-icon" aria-hidden="true">i</span>
		<div>
			<h2 class="cal-notes-title">{m.calendar_notes_title()}</h2>
			<p class="cal-notes-body">{m.calendar_notes_body()}</p>
		</div>
	</div>
</div>

<style>
	/* ===== shared primitives (token-driven, adapt to every theme) ===== */
	.cal-card {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
	}
	.cal-flush { border-radius: 0 !important; }
	.cal-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		line-height: 1.4;
		white-space: nowrap;
		border-radius: var(--orbit-radius-badge);
	}
	.cal-time-badge {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 12px;
		background: var(--orbit-ink);
		color: var(--orbit-mint);
		padding: 2px 8px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
	}
	.cal-badge-uncut {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		letter-spacing: 0.08em;
		padding: 2px 7px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-coral);
		color: #fff;
	}
	.cal-sticker {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 9px;
		letter-spacing: 0.06em;
		padding: 2px 6px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-coral);
		color: #fff;
		line-height: 1.3;
	}
	.cal-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		background: var(--orbit-coral);
		border: 1px solid var(--orbit-line-strong);
	}

	/* ===== hero ===== */
	.cal-hero {
		padding: 16px 0 28px;
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		align-items: end;
	}
	@media (min-width: 1024px) {
		.cal-hero { grid-template-columns: 3fr 2fr; gap: 32px; padding: 32px 0 32px; }
	}
	.cal-kicker {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--orbit-font-display);
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		padding: 6px 12px;
		box-shadow: var(--orbit-shadow);
		margin-bottom: 16px;
	}
	.cal-blink {
		width: 10px;
		height: 10px;
		flex: none;
		background: var(--orbit-coral);
		border: 1px solid var(--orbit-line-strong);
		animation: cal-blink 1.1s steps(2, start) infinite;
	}
	@keyframes cal-blink { to { visibility: hidden; } }
	.cal-title {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight, 700);
		font-size: clamp(34px, 6vw, 60px);
		line-height: 1.1;
		color: var(--orbit-ink);
		margin: 0;
	}
	.cal-title-accent {
		color: var(--orbit-coral);
		text-shadow: 2px 2px 0 var(--orbit-lavender);
	}
	.cal-sub {
		margin: 12px 0 0;
		color: var(--orbit-muted);
		font-size: 15px;
		max-width: 52ch;
		line-height: 1.6;
	}
	.cal-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 10px 18px;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-label-weight, 700);
		font-size: 14px;
		background: var(--orbit-coral);
		color: #fff;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow-raised);
		cursor: pointer;
		transition: transform var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease), box-shadow var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-cta:hover { transform: translate(-1px, -1px); }
	.cal-cta:active { transform: translate(1px, 1px); box-shadow: var(--orbit-shadow); }

	.cal-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
	@media (min-width: 640px) { .cal-stats { grid-template-columns: repeat(3, 1fr); } }
	@media (min-width: 1024px) { .cal-stats { grid-template-columns: 1fr; gap: 14px; } }
	.cal-stat {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		padding: 12px 16px;
		min-width: 0;
	}
	.cal-stat-label { font-size: 13px; font-weight: 600; color: var(--orbit-muted); }
	.cal-stat-num {
		font-family: var(--orbit-font-display);
		font-size: 28px;
		color: var(--orbit-coral-dark);
		line-height: 1.15;
	}
	.cal-stat-num--text { font-size: 16px; padding-top: 4px; color: var(--orbit-ink); }
	.cal-stat-detail { font-size: 13px; margin-top: 2px; color: var(--orbit-muted); }
	.cal-stat-detail b { color: var(--orbit-ink); }

	/* ===== month calendar view ===== */
	.cal-month-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
		align-items: start;
	}
	@media (min-width: 1024px) {
		.cal-month-layout { grid-template-columns: 2fr 1fr; gap: 24px; }
	}
	.cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--orbit-border-width);
		background: var(--orbit-line-strong);
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
	}
	.cal-weekdays > div {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-align: center;
		padding: 8px 4px;
		background: var(--orbit-lavender);
		color: var(--orbit-ink);
	}
	.cal-weekdays > .cal-weekday--wkend { background: var(--orbit-coral-soft); }
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--orbit-border-width);
		background: var(--orbit-line);
	}
	.cal-cell {
		position: relative;
		appearance: none;
		border: none;
		border-radius: 0;
		min-height: 92px;
		padding: 6px;
		cursor: pointer;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		text-align: left;
		transition: background-color var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-cell:hover { background: var(--orbit-paper); }
	.cal-cell--dim { background: var(--orbit-paper-deep); color: var(--orbit-muted); }
	.cal-cell--skeleton { min-height: 92px; background: var(--orbit-paper); }
	.cal-dnum {
		font-family: var(--orbit-font-display);
		font-size: 14px;
	}
	.cal-cell--today { background: var(--orbit-mint); }
	.cal-cell--today::before {
		content: '';
		position: absolute;
		inset: 3px;
		border: max(2px, var(--orbit-border-width)) solid var(--orbit-coral);
		border-radius: var(--orbit-radius-control);
		pointer-events: none;
	}
	.cal-cell--today .cal-dnum { color: var(--orbit-coral-dark); }
	.cal-cell-today-sticker { position: absolute; top: 4px; right: 4px; }
	.cal-dots {
		position: absolute;
		bottom: 8px;
		left: 8px;
		display: flex;
		gap: 5px;
	}
	.cal-cell--selected,
	.cal-cell--selected:hover {
		background: var(--orbit-ink);
		color: var(--orbit-surface);
	}
	.cal-cell--selected .cal-dnum { color: var(--orbit-mint); }
	.cal-cell--selected .cal-dot { background: var(--orbit-surface); border-color: var(--orbit-surface); }
	@media (max-width: 639px) {
		.cal-cell { min-height: 56px; }
		.cal-dots { bottom: 5px; left: 5px; }
		.cal-dots .cal-dot { width: 6px; height: 6px; }
		.cal-cell-today-sticker { font-size: 7px; padding: 1px 4px; }
	}

	/* ===== selected day panel ===== */
	.cal-panel { display: flex; flex-direction: column; overflow: hidden; }
	@media (min-width: 1024px) {
		.cal-panel { position: sticky; top: 112px; }
	}
	.cal-panel-head {
		background: var(--orbit-ink);
		color: var(--orbit-surface);
		padding: 12px 16px;
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0 !important;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.cal-panel-head h3 {
		font-family: var(--orbit-font-display);
		font-size: 15px;
		margin: 0;
	}
	.cal-panel-count {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-mint);
		white-space: nowrap;
	}
	.cal-panel-body { padding: 16px; display: grid; gap: 16px; }
	.cal-event { display: flex; gap: 12px; align-items: flex-start; }
	.cal-event-poster {
		width: 64px;
		aspect-ratio: 2 / 3;
		flex: none;
		overflow: hidden;
		background: var(--orbit-lavender);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
	}
	.cal-event-info { display: grid; gap: 4px; min-width: 0; justify-items: start; }
	.cal-event-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
	.cal-event-name { font-weight: 700; font-size: 15px; color: var(--orbit-ink); }
	.cal-event-ep { font-size: 13px; color: var(--orbit-muted); }
	.cal-event-more {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		font-weight: 600;
		color: var(--orbit-link);
		text-decoration: none;
	}
	.cal-event-more:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
	.cal-panel-foot {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: auto;
		padding: 12px 16px;
		border-top: var(--orbit-border-width) dashed var(--orbit-line);
		border-radius: 0 !important;
		font-size: 13px;
		color: var(--orbit-muted);
	}
	.cal-empty-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--orbit-lavender);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
	}

	/* ===== list view ===== */
	.cal-lday { overflow: hidden; }
	.cal-lday-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 10px 16px;
		background: var(--orbit-ink);
		color: var(--orbit-surface);
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0 !important;
	}
	.cal-lday-title {
		font-family: var(--orbit-font-display);
		font-size: 13px;
	}
	.cal-lday-count {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-mint);
		margin-left: auto;
		white-space: nowrap;
	}
	.cal-lrow {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		border-top: var(--orbit-border-width) solid var(--orbit-line);
		border-radius: 0 !important;
		color: var(--orbit-ink);
		text-decoration: none;
		transition: background-color var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-lrow:hover { background: var(--orbit-paper); text-decoration: none; }
	.cal-lrow-poster {
		width: 44px;
		aspect-ratio: 2 / 3;
		flex: none;
		overflow: hidden;
		background: var(--orbit-lavender);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
	}
	.cal-lrow-time {
		font-family: var(--orbit-font-display);
		font-size: 15px;
		color: var(--orbit-coral-dark);
		min-width: 58px;
	}
	.cal-lrow-main { min-width: 0; flex: 1; display: grid; gap: 2px; }
	.cal-lrow-name { font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.cal-lrow-meta {
		font-size: 13px;
		color: var(--orbit-muted);
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
	}
	.cal-lrow-arrow {
		font-family: var(--orbit-font-display);
		font-size: 18px;
		color: var(--orbit-link);
		opacity: 0;
		transition: opacity var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease), transform var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-lrow:hover .cal-lrow-arrow,
	.cal-lrow:focus-visible .cal-lrow-arrow { opacity: 1; transform: translateX(2px); }

	/* ===== grid view ===== */
	.cal-gridtable {
		border-collapse: collapse;
		border-radius: 0 !important;
		table-layout: fixed;
		min-width: 720px;
		width: 100%;
		font-size: 12px;
	}
	.cal-gridtable-wrap { border-radius: 0 !important; }
	.cal-gridtable th,
	.cal-gridtable td {
		border: 1px solid var(--orbit-line);
		border-radius: 0 !important;
		padding: 8px;
		text-align: center;
		vertical-align: top;
	}
	.cal-gridtable th:not(.cal-gseries),
	.cal-gridtable td:not(.cal-gseries) { width: 120px; min-width: 120px; padding: 8px 6px; }
	.cal-gridtable thead th {
		background: var(--orbit-paper-deep);
		font-family: var(--orbit-font-display);
		font-size: 12px;
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
	}
	.cal-gridtable thead small { color: var(--orbit-muted); font-size: 10px; }
	.cal-gridtable .cal-gtoday { background: var(--orbit-coral-soft); }
	.cal-gridtable thead .cal-gtoday { background: var(--orbit-coral); color: #fff; }
	.cal-gridtable thead .cal-gtoday small { color: #fff; }
	.cal-gseries {
		position: sticky;
		left: 0;
		background: var(--orbit-surface);
		width: 180px;
		min-width: 180px;
		max-width: 180px;
		z-index: 1;
	}
	.cal-gridtable th.cal-gseries { text-align: center; vertical-align: middle; }
	.cal-gridtable thead .cal-gseries { background: var(--orbit-paper-deep); }
	.cal-gseries-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
	.cal-gseries :global(.cal-gposter) {
		width: 88px;
		height: 120px;
		object-fit: cover;
		flex: none;
		background: var(--orbit-lavender);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		/* standalone framed poster: keep its own token radius over the global media squaring */
		border-radius: var(--orbit-radius-control) !important;
		box-shadow: var(--orbit-shadow);
	}
	.cal-gname { font-weight: 700; font-size: 12px; color: var(--orbit-ink); }
	.cal-gcell { display: grid; gap: 3px; justify-items: center; font-size: 11px; }
	.cal-gcell b { font-family: var(--orbit-font-display); font-size: 12px; color: var(--orbit-coral-dark); }
	.cal-gcell .cal-chip { max-width: 100%; padding: 1px 4px; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
	.cal-gcell .cal-badge-uncut { font-size: 9px; padding: 1px 5px; }
	@media (max-width: 639px) {
		.cal-gridtable { table-layout: fixed; min-width: 640px; }
		.cal-gridtable th:not(.cal-gseries),
		.cal-gridtable td:not(.cal-gseries) { width: 64px; min-width: 64px; padding: 4px 2px; }
		.cal-gridtable .cal-gseries { width: 104px; min-width: 104px; max-width: 104px; padding: 6px; }
		.cal-gseries-inner { gap: 4px; }
		.cal-gseries :global(.cal-gposter) { width: 48px; height: 66px; }
		.cal-gname { display: block; line-height: 1.25; overflow-wrap: anywhere; }
	}

	/* ===== countdown banner ===== */
	.cal-banner {
		margin-top: 32px;
		display: flex;
		align-items: center;
		gap: 16px;
		background: var(--orbit-ink);
		color: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow-raised);
		padding: 20px 24px;
		position: relative;
		overflow: hidden;
		text-decoration: none;
	}
	.cal-banner:hover { text-decoration: none; }
	.cal-banner-icon { flex: none; color: var(--orbit-mint); display: inline-flex; }
	.cal-banner-title {
		font-family: var(--orbit-font-display);
		font-size: 18px;
		color: var(--orbit-mint);
		margin: 0 0 4px;
	}
	.cal-banner-desc { margin: 0; color: var(--orbit-lavender); font-size: 14px; max-width: 56ch; }
	.cal-banner-go {
		margin-left: auto;
		font-family: var(--orbit-font-display);
		font-size: 22px;
		color: var(--orbit-mint);
		min-width: 44px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		transition: transform var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-banner:hover .cal-banner-go { transform: translateX(3px); }
	@media (max-width: 639px) {
		.cal-banner { flex-wrap: wrap; }
		.cal-banner-go { margin-left: 0; }
	}

	/* ===== notes ===== */
	.cal-notes {
		margin-top: 24px;
		display: flex;
		gap: 14px;
		align-items: flex-start;
		background: var(--orbit-mint);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		padding: 16px 20px;
	}
	.cal-notes-icon {
		flex: none;
		width: 32px;
		height: 32px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		font-family: var(--orbit-font-display);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
	}
	.cal-notes-title {
		font-family: var(--orbit-font-display);
		font-size: 15px;
		margin: 0 0 2px;
	}
	.cal-notes-body { margin: 0; font-size: 14px; line-height: 1.6; }

	@media (prefers-reduced-motion: reduce) {
		.cal-blink { animation: none; }
		.cal-cta,
		.cal-cell,
		.cal-lrow,
		.cal-lrow-arrow,
		.cal-banner-go { transition: none; }
		.cal-cta:hover,
		.cal-cta:active,
		.cal-banner:hover .cal-banner-go,
		.cal-lrow:hover .cal-lrow-arrow { transform: none; }
	}

	/* Scoped selectors outrank app.css's global rounded-mode rule without
	   flattening the outer card or highlights. */
	.cal-month-layout .cal-weekdays,
	.cal-month-layout .cal-weekdays > div,
	.cal-month-layout .cal-grid,
	.cal-month-layout .cal-cell { border-radius: 0 !important; }
</style>
