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

	function getDayDate(index: number): Date {
		return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
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
<div class="md:hidden">
	<div class="board-daytabs" role="tablist" aria-label={m.calendar_card_select_day_aria()}>
		{#each weekDayNames as day, i}
			{@const date = getDayDate(i)}
			{@const active = selectedMobileDay === i}
			{@const today = isToday(date)}
			{@const count = scheduleMap[i]?.items.length ?? 0}
			<button
				type="button"
				role="tab"
				aria-selected={active}
				aria-label="{day} {date.getDate()}"
				onclick={() => selectMobileDay(i)}
				class="board-daytab {active ? 'board-daytab--active' : ''} {today ? 'board-daytab--today' : ''}"
			>
				<span class="board-daytab-wd">{weekDayNamesShort[i]}</span>
				<span class="board-daytab-n">{date.getDate()}</span>
				<span class="board-daytab-dots" aria-hidden="true">
					{#each Array(Math.min(count, 3)) as _}
						<i class="board-dot orbit-round-data"></i>
					{/each}
				</span>
			</button>
		{/each}
	</div>
</div>

<!-- Desktop Board -->
<div class="board-week hidden md:grid" role="table" aria-label={m.calendar_week_header_current_label()}>
	{#each weekDayNames as day, i}
		{@const date = getDayDate(i)}
		{@const schedule = scheduleMap[i]}
		{@const events = schedule?.items.slice().sort(sortByTime) ?? []}
		{@const today = isToday(date)}
		<section class="board-wday {today ? 'board-wday--today' : ''}">
			<header class="board-wday-head">
				<div class="board-wday-wd">{day}{#if today} · {m.calendar_card_today_badge()}{/if}</div>
				<div class="board-wday-dn">{date.getDate()}</div>
				<div class="board-wday-mn">{getMonthShort(date, lang)}</div>
			</header>
			<div class="board-wday-body">
				{#if events.length > 0}
					{#each events as event (event.series + event.time + event.episode)}
						<article
							aria-label={m.calendar_event_aria({ series: event.series, episode: event.episode, time: event.time })}
							class="board-wevent"
						>
							<a href="/{page.data.lang}/series/{event.seriesId}" class="block">
								<div class="board-wevent-poster">
									<Picture
										src={event.posterUrl}
										type="posters"
										sizes="10rem"
										alt={event.series}
										width={160}
										height={240}
										class="block h-full w-full object-cover"
										loading="lazy"
									/>
								</div>
								<div class="board-wevent-body">
									{#if event.isUncut}
										<span class="board-badge-uncut board-wevent-uncut">UNCUT</span>
									{/if}
									<span class="board-time-badge">{event.time}</span>
									<span class="board-wevent-name" title={event.series}>{event.series}</span>
									<span class="board-wevent-ep">{event.episode}</span>
									{#if event.platforms[0]}
										<span class="board-chip border {platformClass(event.platforms[0])}">{event.platforms[0]}</span>
									{/if}
								</div>
							</a>
						</article>
					{/each}
				{:else}
					<p class="board-wempty">{m.calendar_card_no_events()}</p>
				{/if}
			</div>
		</section>
	{/each}
</div>

<!-- Mobile Selected Day Cards -->
<div class="mt-4 md:hidden" role="tabpanel" aria-label={m.calendar_card_day_items_aria({ day: mobileDay })}>
	<div class="board-mobile-card">
		<header class="board-mobile-head">
			<div class="min-w-0">
				<div class="board-mobile-day">
					{mobileDay}
					{#if mobileToday}
						<span class="board-badge-today">{m.calendar_card_today_badge()}</span>
					{/if}
				</div>
				<div class="board-mobile-date">{mobileDate.getDate()} {getMonthLong(mobileDate, lang)} {new Intl.DateTimeFormat(lang, { year: 'numeric' }).format(mobileDate)}</div>
			</div>
			<div class="board-mobile-count">
				<div class="board-mobile-count-num">{mobileEvents.length}</div>
				<div class="board-mobile-count-label">{m.calendar_card_items_label()}</div>
			</div>
		</header>

		{#if mobileEvents.length > 0}
			<div class="grid gap-3">
				{#each mobileEvents as event (event.series + event.time + event.episode)}
					<article
						aria-label={m.calendar_event_aria({ series: event.series, episode: event.episode, time: event.time })}
						class="board-wevent board-wevent--row"
					>
						<a href="/{page.data.lang}/series/{event.seriesId}" class="flex">
							<div class="board-wevent-poster board-wevent-poster--row">
								<Picture
									src={event.posterUrl}
									type="posters"
									sizes="64px"
									alt={event.series}
									width={64}
									height={96}
									class="block h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<div class="board-wevent-body board-wevent-body--row">
								{#if event.isUncut}
									<span class="board-badge-uncut board-wevent-uncut">UNCUT</span>
								{/if}
								<span class="flex flex-wrap items-center gap-2">
									<span class="board-time-badge">{event.time}</span>
									{#if event.platforms[0]}
										<span class="board-chip border {platformClass(event.platforms[0])}">{event.platforms[0]}</span>
									{/if}
								</span>
								<span class="board-wevent-name" title={event.series}>{event.series}</span>
								<span class="board-wevent-ep">{event.episode}</span>
								<span class="board-wevent-more">
									{m.calendar_card_detail_link()} →
								</span>
							</div>
						</a>
					</article>
				{/each}
			</div>
		{:else}
			<div class="py-8 text-center">
				<div class="board-empty-icon mx-auto mb-3">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
					</svg>
				</div>
				<p class="mb-1 text-sm font-semibold text-plum">{m.calendar_card_mobile_empty_title()}</p>
				<p class="text-xs leading-relaxed text-plum-light">{m.calendar_card_mobile_empty_hint()}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.board-chip {
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
	.board-time-badge {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 12px;
		background: var(--orbit-ink);
		color: var(--orbit-mint);
		padding: 2px 8px;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		width: fit-content;
	}
	.board-badge-uncut {
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
	.board-badge-today {
		display: inline-block;
		font-family: var(--orbit-font-display);
		font-size: 10px;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		margin-left: 8px;
		vertical-align: middle;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-badge);
		background: var(--orbit-coral);
		color: #fff;
	}
	.board-dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		background: var(--orbit-coral);
		border: 1px solid var(--orbit-line-strong);
	}

	/* ===== mobile day tabs ===== */
	.board-daytabs {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--orbit-border-width);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-line);
		box-shadow: var(--orbit-shadow);
		overflow: hidden;
	}
	.board-daytab {
		appearance: none;
		border: none;
		background: var(--orbit-surface);
		cursor: pointer;
		min-height: 56px;
		padding: 8px 2px;
		display: grid;
		justify-items: center;
		align-content: start;
		gap: 2px;
		font-family: var(--orbit-font-display);
		font-size: 11px;
		color: var(--orbit-ink);
		transition: background-color var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.board-daytab:hover { background: var(--orbit-coral-soft); }
	.board-daytab-n { font-size: 15px; }
	.board-daytab-dots { display: flex; gap: 3px; min-height: 9px; align-items: center; }
	.board-daytab--active,
	.board-daytab--active:hover {
		background: var(--orbit-ink);
		color: var(--orbit-mint);
	}
	.board-daytab--active .board-dot { background: var(--orbit-coral); border-color: var(--orbit-coral); }
	.board-daytab--today { box-shadow: inset 0 0 0 max(2px, var(--orbit-border-width)) var(--orbit-coral); }

	/* ===== desktop week board ===== */
	.board-week {
		grid-template-columns: repeat(7, 1fr);
		gap: var(--orbit-border-width);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		background: var(--orbit-line);
		overflow: hidden;
	}
	.board-wday {
		background: var(--orbit-surface);
		display: flex;
		flex-direction: column;
		min-height: 240px;
		min-width: 0;
	}
	.board-wday-head {
		padding: 10px 10px 8px;
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		background: var(--orbit-paper-deep);
	}
	.board-wday--today .board-wday-head { background: var(--orbit-coral-soft); }
	.board-wday-wd {
		font-family: var(--orbit-font-display);
		font-size: 11px;
		letter-spacing: 0.05em;
		color: var(--orbit-muted);
		text-transform: uppercase;
	}
	.board-wday-dn {
		font-family: var(--orbit-font-display);
		font-size: 20px;
		line-height: 1.2;
		color: var(--orbit-ink);
	}
	.board-wday--today .board-wday-dn { color: var(--orbit-coral-dark); }
	.board-wday-mn { font-size: 11px; color: var(--orbit-muted); }
	.board-wday-body {
		padding: 10px;
		display: grid;
		gap: 10px;
		align-content: start;
		flex: 1;
	}
	.board-wempty {
		color: var(--orbit-muted);
		font-family: var(--orbit-font-display);
		text-align: center;
		padding: 24px 4px;
		font-size: 12px;
		margin: 0;
	}

	/* ===== event cards ===== */
	.board-wevent {
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
		overflow: hidden;
		transition: transform var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease), box-shadow var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.board-wevent:hover {
		transform: translate(-1px, -1px);
		box-shadow: var(--orbit-shadow-raised);
	}
	.board-wevent a { color: inherit; text-decoration: none; }
	.board-wevent-poster {
		width: 100%;
		aspect-ratio: 2 / 3;
		background: var(--orbit-lavender);
		border-bottom: var(--orbit-border-width) solid var(--orbit-line-strong);
		overflow: hidden;
	}
	.board-wevent-body {
		padding: 8px;
		display: grid;
		gap: 4px;
		position: relative;
		justify-items: start;
	}
	.board-wevent-uncut { position: absolute; top: -12px; right: 6px; }
	.board-wevent-name {
		font-weight: 700;
		font-size: 13px;
		line-height: 1.3;
		color: var(--orbit-ink);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.board-wevent-ep { font-size: 12px; color: var(--orbit-muted); }
	.board-wevent-more {
		font-size: 12px;
		font-weight: 600;
		color: var(--orbit-link);
	}

	/* mobile horizontal cards */
	.board-wevent--row .board-wevent-poster--row {
		width: 64px;
		flex: none;
		aspect-ratio: auto;
		min-height: 96px;
		border-bottom: none;
		border-right: var(--orbit-border-width) solid var(--orbit-line-strong);
	}
	.board-wevent-body--row { padding: 10px 12px; align-content: center; padding-inline-end: 84px; }
	.board-wevent--row .board-wevent-uncut { top: 8px; right: 8px; }

	/* ===== mobile selected day panel ===== */
	.board-mobile-card {
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		padding: 16px;
	}
	.board-mobile-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: var(--orbit-border-width) solid var(--orbit-line);
	}
	.board-mobile-day {
		font-family: var(--orbit-font-display);
		font-size: 18px;
		color: var(--orbit-ink);
	}
	.board-mobile-date { font-size: 13px; color: var(--orbit-muted); }
	.board-mobile-count {
		flex: none;
		text-align: center;
		padding: 6px 12px;
		background: var(--orbit-coral-soft);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
	}
	.board-mobile-count-num {
		font-family: var(--orbit-font-display);
		font-size: 20px;
		color: var(--orbit-coral-dark);
		line-height: 1.1;
	}
	.board-mobile-count-label { font-size: 10px; color: var(--orbit-muted); }
	.board-empty-icon {
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

	@media (prefers-reduced-motion: reduce) {
		.board-daytab,
		.board-wevent { transition: none; }
		.board-wevent:hover { transform: none; }
	}
</style>
