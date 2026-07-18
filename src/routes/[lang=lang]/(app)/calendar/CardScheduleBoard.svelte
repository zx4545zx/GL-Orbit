<script lang="ts">
	import { page } from '$app/state';
	import Picture from '$lib/components/Picture.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import type { ScheduleDay, CalendarEvent } from '$lib/types/calendar.js';

	interface Props {
		scheduleByDay: ScheduleDay[];
		weekStart: Date;
	}

	let { scheduleByDay, weekStart }: Props = $props();

	const lang = $derived(page.data.lang);

	function getWeekDayLong(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { weekday: 'long' }).format(date);
	}
	function getWeekDayShort(date: Date, l: string) {
		if (l.startsWith('th')) {
			return ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][date.getDay()];
		}
		return new Intl.DateTimeFormat(l, { weekday: 'short' }).format(date);
	}
	function getMonthShort(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { month: 'short' }).format(date);
	}
	function getMonthLong(date: Date, l: string) {
		return new Intl.DateTimeFormat(l, { month: 'long' }).format(date);
	}

	const weekDayNames = $derived(Array.from({ length: 7 }, (_, i) => getWeekDayLong(new Date(2024, 0, 1 + i), lang)));
	const weekDayNamesShort = $derived(Array.from({ length: 7 }, (_, i) => getWeekDayShort(new Date(2024, 0, 1 + i), lang)));

	const dayColorClasses = [
		'bg-coral/10',
		'bg-orange-300/10',
		'bg-lavender/15',
		'bg-emerald-300/10',
		'bg-teal-300/10',
		'bg-blue-300/10',
		'bg-rose-300/10'
	];

	function getDayDate(index: number): Date {
		return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
	}

	function formatDayDate(date: Date): string {
		return `${date.getDate()} ${getMonthShort(date, lang)}`;
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	}

	const scheduleMap = $derived((() => {
		const map: Record<number, ScheduleDay | undefined> = {};
		for (const day of scheduleByDay) {
			map[day.dayIndex] = day;
		}
		return map;
	})());

	const defaultMobileDay = $derived((() => {
		for (let i = 0; i < 7; i++) {
			if (isToday(getDayDate(i))) return i;
		}
		for (let i = 0; i < 7; i++) {
			const day = scheduleMap[i];
			if (day && day.items.length > 0) return i;
		}
		return 0;
	})());

	let selectedMobileDay = $state(0);

	$effect(() => {
		selectedMobileDay = defaultMobileDay;
	});

	function selectMobileDay(index: number) {
		selectedMobileDay = index;
	}

	function sortByTime(a: CalendarEvent, b: CalendarEvent): number {
		return a.time.localeCompare(b.time);
	}

	const mobileDay = $derived(weekDayNames[selectedMobileDay]);
	const mobileDate = $derived(getDayDate(selectedMobileDay));
	const mobileEvents = $derived(scheduleMap[selectedMobileDay]?.items.slice().sort(sortByTime) ?? []);
	const mobileToday = $derived(isToday(mobileDate));

	function platformClass(platform: string): string {
		const map: Record<string, string> = {
			'YouTube': 'bg-red-50 text-red-600 border-red-100',
			'Netflix': 'bg-red-50 text-red-700 border-red-100',
			'iQIYI': 'bg-green-50 text-green-600 border-green-100',
			'Viu': 'bg-orange-50 text-orange-600 border-orange-100',
			'GagaOOLala': 'bg-blue-50 text-blue-600 border-blue-100',
			'WeTV': 'bg-orange-50 text-orange-600 border-orange-100',
			'OneD': 'bg-purple-50 text-purple-600 border-purple-100',
			'Amazon Prime': 'bg-blue-50 text-blue-700 border-blue-100',
			'Disney+': 'bg-blue-50 text-blue-700 border-blue-100',
			'Apple TV+': 'bg-gray-50 text-gray-700 border-gray-200',
			'HBO GO': 'bg-indigo-50 text-indigo-600 border-indigo-100',
			'Viki': 'bg-pink-50 text-pink-600 border-pink-100'
		};
		return map[platform] || 'bg-lavender/10 text-plum-light border-lavender/20';
	}
</script>

<!-- Mobile Day Tabs -->
<div class="md:hidden mb-4">
	<div class="glass-card rounded-xl grid grid-cols-7 gap-0 p-0" role="tablist" aria-label={m.calendar_card_select_day_aria()}>
		{#each weekDayNames as day, i}
			{@const date = getDayDate(i)}
			{@const active = selectedMobileDay === i}
			{@const hasEvents = !!scheduleMap[i]?.items.length}
			<button
				role="tab"
				aria-selected={active}
				aria-label="{day} {date.getDate()}"
				onclick={() => selectMobileDay(i)}
				class="col-span-1 flex min-w-0 min-h-11 flex-col items-center justify-start py-2 rounded-lg text-xs font-medium transition-colors duration-200 {active ? 'bg-coral text-white' : 'text-plum-light hover:bg-coral-light hover:text-coral-dark'}"
			>
				<span class="font-bold">{weekDayNamesShort[i]}</span>
				<span class="text-[10px] opacity-80 mt-0.5 truncate w-full px-1 text-center">{date.getDate()}</span>
				{#if hasEvents}
					<span class="mt-1 min-w-4 h-4 px-1 rounded-full text-[9px] leading-4 {active ? 'bg-white text-coral-dark' : 'bg-coral-light text-coral-dark'}">{scheduleMap[i]?.items.length}</span>
				{:else}
					<span class="mt-1 w-1 h-1 rounded-full {active ? 'bg-coral' : 'bg-plum-light/20'}"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- Desktop Board -->
<div class="hidden md:grid grid-cols-7 gap-3">
	{#each weekDayNames as day, i}
		{@const date = getDayDate(i)}
		{@const schedule = scheduleMap[i]}
		{@const events = schedule?.items.slice().sort(sortByTime) ?? []}
		{@const today = isToday(date)}
		<div class="flex flex-col min-h-[320px] rounded-xl overflow-hidden glass-card">
			<div class="px-3 py-3 text-center {dayColorClasses[i]} border-b border-[var(--orbit-line)]">
				<div class="text-xs font-medium opacity-80 mb-0.5 {today ? 'text-coral-dark' : 'text-plum-light'}">{day}</div>
				<div class="font-[family-name:var(--font-display)] text-lg font-bold text-plum flex items-center justify-center gap-1.5">
					{#if today}
						<span class="w-2 h-2 rounded-full bg-coral"></span>
					{/if}
					{date.getDate()}
				</div>
				<div class="text-[10px] text-plum-light">{getMonthShort(date, lang)}</div>
			</div>
			<div class="flex-1 p-2 space-y-2 {events.length === 0 ? 'flex flex-col items-center justify-center' : ''}">
				{#if events.length > 0}
					{#each events as event, idx (event.series + event.time + event.episode)}
						<article
							aria-label={m.calendar_event_aria({ series: event.series, episode: event.episode, time: event.time })}
							class="group overflow-hidden glass-card-strong rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in"
							style="animation-delay: {idx * 60}ms"
						>
							<a href="/{page.data.lang}/series/{event.seriesId}" class="block">
								<div class="relative mb-2">
									<Picture
										src={event.posterUrl}
										type="posters"
										sizes="4rem"
										alt={event.series}
										width={64}
										height={90}
										class="w-full aspect-[2/3] rounded-lg object-cover shadow-sm bg-white/50"
										loading="lazy"
									/>
									{#if event.isUncut}
										<span class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-coral text-white text-[9px] font-bold shadow-sm">Uncut</span>
									{/if}
								</div>
								<div class="space-y-1 px-2.5 pb-2.5">
									<div class="flex flex-col gap-1">
										<span class="text-sm font-bold text-coral-dark">{event.time}</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded-md border w-fit {platformClass(event.platforms[0])}">{event.platforms[0]}</span>
									</div>
									<h3 class="font-semibold text-plum text-xs leading-snug line-clamp-2 min-h-[2rem]" title={event.series}>{event.series}</h3>
									<div class="text-[10px] text-plum-light font-medium">{event.episode}</div>
								</div>
							</a>
						</article>
					{/each}
				{:else}
					<div class="text-center px-2">
						<div class="w-10 h-10 rounded-xl bg-lavender/10 flex items-center justify-center mx-auto mb-2">
							<svg class="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
							</svg>
						</div>
						<p class="text-[11px] text-plum-light">{m.calendar_card_no_events()}</p>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Mobile Selected Day Cards -->
<div class="md:hidden space-y-3" role="tabpanel" aria-label={m.calendar_card_day_items_aria({ day: mobileDay })}>
	<div class="glass-card rounded-xl p-4">
		<div class="flex items-center justify-between gap-3 mb-4">
			<div class="flex items-center gap-3 min-w-0">
				<div class="w-11 h-11 rounded-xl {dayColorClasses[selectedMobileDay]} flex items-center justify-center flex-shrink-0">
					<span class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{weekDayNamesShort[selectedMobileDay]}</span>
				</div>
				<div class="min-w-0">
					<div class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">
						{mobileDay}
						{#if mobileToday}
							<span class="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-coral text-white">{m.calendar_card_today_badge()}</span>
						{/if}
					</div>
					<div class="text-sm text-plum-light truncate">{mobileDate.getDate()} {getMonthLong(mobileDate, lang)} {new Intl.DateTimeFormat(lang, { year: 'numeric' }).format(mobileDate)}</div>
				</div>
			</div>
			<div class="rounded-2xl bg-coral/10 px-3 py-2 text-center flex-shrink-0">
				<div class="font-[family-name:var(--font-display)] text-xl font-bold text-coral-dark">{mobileEvents.length}</div>
				<div class="text-[10px] text-plum-light">{m.calendar_card_items_label()}</div>
			</div>
		</div>

		{#if mobileEvents.length > 0}
			<div class="space-y-3">
				{#each mobileEvents as event, idx (event.series + event.time + event.episode)}
					<article
						aria-label={m.calendar_event_aria({ series: event.series, episode: event.episode, time: event.time })}
						class="group overflow-hidden glass-card-strong rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
						style="animation-delay: {idx * 60}ms"
					>
						<a href="/{page.data.lang}/series/{event.seriesId}" class="flex gap-3">
							<div class="relative flex-shrink-0">
								<Picture
									src={event.posterUrl}
									type="posters"
									sizes="4rem"
									alt={event.series}
									width={64}
									height={90}
									class="w-20 h-28 sm:w-24 sm:h-32 rounded-lg object-cover shadow-sm bg-white/50"
									loading="lazy"
								/>
								{#if event.isUncut}
									<span class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-coral text-white text-[9px] font-bold shadow-sm">Uncut</span>
								{/if}
							</div>
							<div class="flex-1 min-w-0 flex flex-col justify-center py-3 pr-3">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="text-base font-bold text-coral-dark">{event.time}</span>
									<span class="text-[10px] px-2 py-0.5 rounded-md border {platformClass(event.platforms[0])}">{event.platforms[0]}</span>
								</div>
								<h3 class="font-semibold text-plum text-sm leading-snug line-clamp-2 mb-1" title={event.series}>{event.series}</h3>
								<div class="text-xs text-plum-light font-medium">{event.episode}</div>
								<div class="mt-2 flex items-center text-xs text-coral-dark font-medium group-hover:translate-x-1 transition-transform">
									{m.calendar_card_detail_link()}
									<svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
									</svg>
								</div>
							</div>
						</a>
					</article>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8">
				<div class="w-14 h-14 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-3">
					<svg class="w-7 h-7 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
					</svg>
				</div>
				<p class="font-semibold text-plum text-sm mb-1">{m.calendar_card_mobile_empty_title()}</p>
				<p class="text-plum-light text-xs leading-relaxed">{m.calendar_card_mobile_empty_hint()}</p>
			</div>
		{/if}
	</div>
</div>
