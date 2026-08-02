<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CalendarMonthHeader from '$lib/components/calendar/CalendarMonthHeader.svelte';
	import CalendarWeekHeader from '$lib/components/calendar/CalendarWeekHeader.svelte';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import { m } from '$lib/i18n/paraglide.js';
	import { buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, localizedPath, safeJsonLd } from '$lib/seo.js';
	import type { EventType, EventView, OrbitEvent } from '$lib/types/whats-on.js';
	import EventCard from './EventCard.svelte';
	import { buildWhatsOnUrl, eventsForDate, formatDateLocal, getStartOfWeek } from './whats-on.js';
	import type { PageData } from './$types.js';

	const INITIAL_EVENT_COUNT = 5;
	const EVENT_BATCH_SIZE = 4;

	let { data }: { data: PageData } = $props();

	const lang = $derived(page.data.lang === 'en' ? 'en' : 'th');
	const locale = $derived(lang === 'th' ? 'th-TH' : 'en-US');
	const viewMode = $derived(data.params.view as EventView);
	const anchorDate = $derived(parseDateKey(data.params.anchorDate));
	const currentMonth = $derived(new Date(data.params.year, data.params.month - 1, 1, 12));
	const weekStart = $derived(getStartOfWeek(anchorDate));
	const weekDates = $derived(Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)));
	const monthDays = $derived(generateMonthDays(currentMonth));
	let selectedDateOverride = $state<string | null>(null);
	let visibleEventCount = $state(INITIAL_EVENT_COUNT);
	const routeSelectionKey = $derived(`${data.params.view}:${data.params.year}:${data.params.month}:${data.params.anchorDate}`);

	$effect(() => {
		routeSelectionKey;
		selectedDateOverride = null;
		visibleEventCount = INITIAL_EVENT_COUNT;
	});

	const typeLabelById: Record<string, () => string> = {
		'220fa93c-b15d-4d97-895a-bf73e40cf1af': m.whats_on_event_type_shows,
		'860930d2-bade-42ca-b020-15e5862217f7': m.whats_on_event_type_tickets,
		'caab5484-da48-43c5-92f5-7e7febeaa4a1': m.whats_on_event_type_public,
		'bcf838d5-deb5-407b-b46d-56dd043a09b8': m.whats_on_event_type_birthdays,
		'a8de97d8-8766-4da0-8e88-54b9b485987b': m.whats_on_event_type_awards,
		'73c07d67-7703-4ca1-bb20-009d4206bddb': m.whats_on_event_type_private,
		'5be2c351-352f-49e9-b425-8b4179221832': m.whats_on_event_type_susu,
		'90d5508a-f1c6-4960-b563-eefabdcf43f9': m.whats_on_event_type_canceled
	};

	const localizedTypes = $derived(
		data.whatsOn.eventTypes.map((type) => ({
			...type,
			name: typeLabelById[type.id]?.() ?? type.name
		}))
	);
	const typeMap = $derived(new Map(localizedTypes.map((type) => [type.id, type])));
	const featured = $derived(data.whatsOn.news[0]);
	const recentNews = $derived(data.whatsOn.news.slice(1, 6));
	const upcomingEvents = $derived(data.whatsOn.events.filter((event) => (event.endDateKey ?? event.dateKey) >= data.params.anchorDate));
	const visibleEvents = $derived(upcomingEvents.slice(0, visibleEventCount));
	const remainingEventCount = $derived(Math.max(0, upcomingEvents.length - visibleEventCount));
	const nextBatchCount = $derived(Math.min(EVENT_BATCH_SIZE, remainingEventCount));
	const selectedDate = $derived(selectedDateOverride ?? defaultSelectedDate());
	const selectedEvents = $derived(eventsForDate(data.whatsOn.events, selectedDate));

	const views: Array<{ id: EventView; label: () => string }> = [
		{ id: 'all', label: m.whats_on_view_all },
		{ id: 'week', label: m.whats_on_view_week },
		{ id: 'calendar', label: m.whats_on_view_calendar }
	];

	function parseDateKey(key: string) {
		const [year, month, day] = key.split('-').map(Number);
		return new Date(year, month - 1, day, 12);
	}

	function addDays(date: Date, amount: number) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);
	}

	function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
		return new Intl.DateTimeFormat(locale, options).format(date);
	}

	function formatNewsDate(key: string) {
		return formatDate(parseDateKey(key), { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatEventTime(event: OrbitEvent) {
		if (event.allDay) return m.whats_on_all_day();
		const options: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: event.sourceTimezone
		};
		const startsAt = new Intl.DateTimeFormat(locale, options).format(new Date(event.startsAt));
		if (!event.endsAt) return startsAt;
		return `${startsAt}–${new Intl.DateTimeFormat(locale, options).format(new Date(event.endsAt))}`;
	}

	function eventTitle(event: OrbitEvent) {
		return event.performer ? `${event.performer} · ${event.title}` : event.title;
	}

	function displayLocation(value: string | null) {
		return value && !/^https?:\/\//i.test(value) ? value : m.whats_on_no_location();
	}

	function isInMonth(dateKey: string, month: Date) {
		const date = parseDateKey(dateKey);
		return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
	}

	function getType(event: OrbitEvent): EventType | null {
		return event.eventTypeId ? typeMap.get(event.eventTypeId) ?? null : null;
	}

	function eventsOn(date: Date) {
		return eventsForDate(data.whatsOn.events, formatDateLocal(date));
	}

	function generateMonthDays(month: Date) {
		const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
		const mondayOffset = (first.getDay() + 6) % 7;
		const gridStart = addDays(first, -mondayOffset);
		return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
	}

	function defaultSelectedDate() {
		if (viewMode === 'week') {
			const anchorKey = formatDateLocal(anchorDate);
			if (eventsForDate(data.whatsOn.events, anchorKey).length) return anchorKey;
			const firstDate = weekDates.find((date) => eventsOn(date).length);
			return firstDate ? formatDateLocal(firstDate) : anchorKey;
		}

		const anchorKey = formatDateLocal(anchorDate);
		if (isInMonth(anchorKey, currentMonth) && eventsForDate(data.whatsOn.events, anchorKey).length) return anchorKey;
		const firstDate = monthDays.find((date) => isInMonth(formatDateLocal(date), currentMonth) && eventsOn(date).length);
		return firstDate ? formatDateLocal(firstDate) : formatDateLocal(currentMonth);
	}

	function viewUrl(view: EventView) {
		return buildWhatsOnUrl(lang, {
			view,
			year: data.params.year,
			month: data.params.month,
			anchorDate: data.params.anchorDate
		});
	}

	function shiftedWeekUrl(amount: number) {
		return buildWhatsOnUrl(lang, {
			view: 'week',
			year: data.params.year,
			month: data.params.month,
			anchorDate: formatDateLocal(addDays(anchorDate, amount * 7))
		});
	}

	function shiftedMonthUrl(amount: number) {
		const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1, 12);
		return buildWhatsOnUrl(lang, {
			view: 'calendar',
			year: next.getFullYear(),
			month: next.getMonth() + 1,
			anchorDate: formatDateLocal(next)
		});
	}

	function navigateTo(url: string) {
		return goto(url, { noScroll: true, keepFocus: true });
	}

	function goToThisWeek() {
		const today = new Date();
		return navigateTo(buildWhatsOnUrl(lang, {
			view: 'week',
			year: today.getFullYear(),
			month: today.getMonth() + 1,
			anchorDate: formatDateLocal(today)
		}));
	}

	function goToThisMonth() {
		const today = new Date();
		return navigateTo(buildWhatsOnUrl(lang, {
			view: 'calendar',
			year: today.getFullYear(),
			month: today.getMonth() + 1,
			anchorDate: formatDateLocal(today)
		}));
	}

	function loadMoreEvents() {
		visibleEventCount = Math.min(upcomingEvents.length, visibleEventCount + EVENT_BATCH_SIZE);
	}

	const seoTitle = m.whats_on_seo_title();
	const seoDescription = m.whats_on_seo_description();
	const currentLang = $derived(lang as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, '/whats-on'));
	const pageJsonLd = $derived(safeJsonLd(buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, '/whats-on'), seoTitle, seoDescription, currentLang)));
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	{@html jsonLdScript(pageJsonLd)}
</svelte:head>

<main class="whats-on-page mx-auto w-full pb-20 pt-6 sm:pt-8 md:pb-24">
	<header class="page-head">
		<div>
			<p class="eyebrow">{m.whats_on_eyebrow()}</p>
			<h1>{m.whats_on_title()}</h1>
			<p class="page-intro">{m.whats_on_intro()}</p>
		</div>
		{#if featured}
			<p class="page-update">
				<span>{m.whats_on_updated({ date: formatNewsDate(featured.publishedDate) })}</span>
				<span>{m.whats_on_content_summary({ news: data.whatsOn.news.length, events: upcomingEvents.length })}</span>
			</p>
		{/if}
	</header>

	<section class="content-section" aria-labelledby="news-heading">
		<header class="section-head">
			<div>
				<h2 id="news-heading">{m.whats_on_news_title()}</h2>
				<p>{m.whats_on_news_subtitle()}</p>
			</div>
			<span>{m.whats_on_story_count({ count: data.whatsOn.news.length })}</span>
		</header>

		{#if featured}
			<div class="news-digest">
				<article class="news-story lead-story">
					<div class="news-meta">
						<time datetime={featured.publishedDate}>{formatNewsDate(featured.publishedDate)}</time>
						<span>{m.whats_on_source_label({ source: featured.sourceName })}</span>
					</div>
					<div class="news-copy">
						<h3>
							{#if featured.sourceUrl}
								<a href={featured.sourceUrl} target="_blank" rel="noreferrer">{featured.headline}</a>
							{:else}
								{featured.headline}
							{/if}
						</h3>
						<p>{featured.blurb}</p>
					</div>
				</article>

				{#each recentNews as item}
					<article class="news-story quick-story">
						<div class="news-meta">
							<time datetime={item.publishedDate}>{formatNewsDate(item.publishedDate)}</time>
							<span>{m.whats_on_source_label({ source: item.sourceName })}</span>
						</div>
						<div class="news-copy">
							<h3>
								{#if item.sourceUrl}
									<a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.headline}</a>
								{:else}
									{item.headline}
								{/if}
							</h3>
							<p>{item.blurb}</p>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="data-state" role="status">
				<strong>
					{data.whatsOn.sourceStatus.news === 'unavailable' ? m.whats_on_news_unavailable() : m.whats_on_no_news()}
				</strong>
				{#if data.whatsOn.sourceStatus.news === 'unavailable'}
					<span>{m.whats_on_source_retry()}</span>
				{/if}
			</div>
		{/if}
	</section>

	<section class="content-section events-section" aria-labelledby="events-heading">
		<header class="section-head">
			<div>
				<h2 id="events-heading">{m.whats_on_events_title()}</h2>
				<p>{m.whats_on_events_subtitle()}</p>
			</div>
			<span>{m.whats_on_event_count({ count: upcomingEvents.length })}</span>
		</header>

		<div class="events-tools">
			<nav class="view-tabs" aria-label={m.whats_on_view_label()}>
				{#each views as view}
					<a
						href={viewUrl(view.id)}
						aria-current={viewMode === view.id ? 'page' : undefined}
						class:active={viewMode === view.id}
						data-sveltekit-noscroll
					>
						{view.label()}
					</a>
				{/each}
			</nav>
			{#if viewMode === 'all'}
				<p class="period-label">{m.whats_on_upcoming_events()}</p>
			{/if}
		</div>

		{#if data.whatsOn.sourceStatus.events === 'unavailable'}
			<div class="data-state" role="status">
				<strong>{m.whats_on_events_unavailable()}</strong>
				<span>{m.whats_on_source_retry()}</span>
			</div>
		{:else if viewMode === 'all'}
			<div class="view-surface all-view">
				{#if upcomingEvents.length}
					<div class="all-events" aria-live="polite">
						{#each visibleEvents as event}
							{@const eventType = getType(event)}
							<article class="all-event-row" data-tone={eventType?.colorName.toLowerCase() ?? 'other'}>
								<time datetime={event.startsAt} class="all-event-date">
									<strong>{formatDate(parseDateKey(event.dateKey), { day: '2-digit', month: 'short' })}</strong>
									<span>{formatEventTime(event)}</span>
								</time>
								<div class="all-event-copy">
									<h3>{eventTitle(event)}</h3>
									<p>{displayLocation(event.location)} · {event.sourceTimezone.replaceAll('_', ' ')}</p>
								</div>
								<span class="all-event-type">{eventType?.name ?? m.whats_on_type_other()}</span>
							</article>
						{/each}
					</div>
					<div class="load-more-wrap">
						<p>{m.whats_on_showing_count({ shown: visibleEvents.length, total: upcomingEvents.length })}</p>
						<button type="button" onclick={loadMoreEvents} disabled={remainingEventCount === 0}>
							{remainingEventCount > 0 ? m.whats_on_load_more({ count: nextBatchCount }) : m.whats_on_all_loaded()}
						</button>
					</div>
				{:else}
					<div class="data-state compact" role="status">
						<strong>{m.whats_on_no_upcoming_events()}</strong>
					</div>
				{/if}
			</div>
		{:else if viewMode === 'week'}
			<CalendarWeekHeader
				currentWeek={anchorDate}
				onPrevWeek={() => navigateTo(shiftedWeekUrl(-1))}
				onNextWeek={() => navigateTo(shiftedWeekUrl(1))}
				onThisWeek={goToThisWeek}
			/>

			<div class="mobile-week">
				<div class="mobile-day-tabs" aria-label={m.whats_on_view_week()}>
					{#each weekDates as date}
						{@const dateKey = formatDateLocal(date)}
						{@const dayEvents = eventsOn(date)}
						<button
							type="button"
							class:active={selectedDate === dateKey}
							aria-pressed={selectedDate === dateKey}
							onclick={() => selectedDateOverride = dateKey}
						>
							<span>{formatDate(date, { weekday: 'short' })}</span>
							<strong>{date.getDate()}</strong>
							{#if dayEvents.length}<i aria-hidden="true"></i>{/if}
						</button>
					{/each}
				</div>
				<div class="mobile-day-panel">
					<header>
						<div>
							<strong>{formatDate(parseDateKey(selectedDate), { weekday: 'long' })}</strong>
							<span>{formatDate(parseDateKey(selectedDate), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
						</div>
						<small>{m.whats_on_event_count({ count: selectedEvents.length })}</small>
					</header>
					<div class="event-stack">
						{#each selectedEvents as event}
							<EventCard {event} eventType={getType(event)} {lang} />
						{:else}
							<div class="empty-day"><strong>{m.whats_on_no_events()}</strong><span>{m.whats_on_no_events_hint()}</span></div>
						{/each}
					</div>
				</div>
			</div>

			<div class="view-surface week-board" aria-label={m.whats_on_view_week()}>
				{#each weekDates as date}
					{@const dayEvents = eventsOn(date)}
					<section class="week-column">
						<header>
							<strong>{formatDate(date, { weekday: 'short' })}</strong>
							<span>{formatDate(date, { day: '2-digit', month: 'short' })}</span>
						</header>
						<div class="week-events">
							{#each dayEvents as event}
								<EventCard {event} eventType={getType(event)} {lang} compact />
							{:else}
								<p class="quiet-empty">{m.whats_on_no_events()}</p>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{:else}
			<CalendarMonthHeader
				{currentMonth}
				viewMode="calendar"
				{lang}
				onPrevMonth={() => navigateTo(shiftedMonthUrl(-1))}
				onNextMonth={() => navigateTo(shiftedMonthUrl(1))}
				onToday={goToThisMonth}
			/>

			<p class="view-help">{m.whats_on_calendar_help()}</p>
			<div class="view-surface month-layout">
				<div class="month-main">
					<div class="month-weekdays" aria-hidden="true">
						{#each weekDates as date}<span>{formatDate(date, { weekday: 'short' })}</span>{/each}
					</div>
					<div class="month-grid">
						{#each monthDays as date}
							{@const dateKey = formatDateLocal(date)}
							{@const dayEvents = eventsOn(date)}
							<button
								type="button"
								class:outside={!isInMonth(dateKey, currentMonth)}
								class:selected={selectedDate === dateKey}
								aria-pressed={selectedDate === dateKey}
								aria-label={`${formatDate(date, { dateStyle: 'full' })}, ${m.whats_on_event_count({ count: dayEvents.length })}`}
								onclick={() => selectedDateOverride = dateKey}
							>
								<span>{date.getDate()}</span>
								{#if dayEvents.length}
									<div class="event-dots" aria-hidden="true">
										{#each dayEvents.slice(0, 3) as event}
											<i data-tone={getType(event)?.colorName.toLowerCase() ?? 'other'}></i>
										{/each}
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
				<aside class="selected-day-panel">
					<p class="eyebrow">{m.whats_on_selected_day()}</p>
					<h3>{formatDate(parseDateKey(selectedDate), { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
					<div class="event-stack">
						{#each selectedEvents as event}
							<EventCard {event} eventType={getType(event)} {lang} />
						{:else}
							<div class="empty-day"><strong>{m.whats_on_no_events()}</strong><span>{m.whats_on_no_events_hint()}</span></div>
						{/each}
					</div>
				</aside>
			</div>
		{/if}

		<p class="data-note">{m.whats_on_data_note()}</p>
	</section>
</main>

<style>
	.whats-on-page {
		max-width: 65rem;
		color: var(--orbit-ink);
	}

	.page-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
		padding-bottom: 1.35rem;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		color: var(--orbit-coral-dark);
		font-size: 0.64rem;
		font-weight: 800;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	h1,
	h2 {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight, 700);
	}

	h1 {
		margin: 0;
		font-size: clamp(1.7rem, 2.5vw, 2.2rem);
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.page-intro {
		max-width: 32rem;
		margin-top: 0.45rem;
		color: var(--orbit-muted);
		font-size: 0.86rem;
		line-height: 1.65;
	}

	.page-update {
		display: grid;
		flex: 0 0 auto;
		gap: 0.08rem;
		color: var(--orbit-muted);
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
		text-align: right;
	}

	.content-section {
		padding: 2.2rem 0;
	}

	.content-section + .content-section {
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.section-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.section-head h2 {
		margin: 0;
		font-size: 1.3rem;
		line-height: 1.25;
	}

	.section-head p {
		margin-top: 0.25rem;
		color: var(--orbit-muted);
		font-size: 0.76rem;
	}

	.section-head > span {
		color: var(--orbit-muted);
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.news-digest {
		display: grid;
		grid-template-columns: minmax(0, 1.08fr) minmax(18rem, 0.92fr);
		overflow: hidden;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
	}

	.news-story {
		min-width: 0;
	}

	.quick-story {
		display: grid;
		grid-template-columns: 4.4rem minmax(0, 1fr);
		gap: 0.8rem;
		padding: 0.75rem 0.9rem;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.quick-story:last-child {
		border-bottom: 0;
	}

	.lead-story {
		grid-row: 1 / span 5;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 1.4rem 1.5rem;
		border-right: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
	}

	.news-meta {
		color: var(--orbit-muted);
		font-size: 0.64rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}

	.news-meta time,
	.news-meta span {
		display: block;
	}

	.news-meta time {
		color: var(--orbit-coral-dark);
		font-weight: 800;
	}

	.lead-story .news-meta {
		margin-bottom: 1.1rem;
	}

	.news-copy h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.42;
		text-wrap: pretty;
	}

	.lead-story h3 {
		max-width: 25ch;
		font-size: 1.35rem;
		line-height: 1.38;
	}

	.news-copy h3 a {
		color: inherit;
		text-decoration: none;
	}

	.news-copy h3 a:hover {
		color: var(--orbit-link, var(--orbit-coral-dark));
		text-decoration: underline;
		text-underline-offset: 0.18rem;
	}

	.news-copy p {
		margin-top: 0.35rem;
		color: var(--orbit-muted);
		font-size: 0.76rem;
		line-height: 1.6;
	}

	.lead-story .news-copy p {
		max-width: 54ch;
	}

	.quick-story .news-copy p {
		display: none;
	}

	.events-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.view-tabs {
		display: flex;
		gap: 0.25rem;
	}

	.view-tabs a {
		display: grid;
		min-height: 44px;
		place-items: center;
		padding: 0.45rem 0.8rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		color: var(--orbit-muted);
		font-size: 0.72rem;
		font-weight: var(--orbit-font-label-weight, 700);
		white-space: nowrap;
		transition: background-color var(--orbit-motion-fast), color var(--orbit-motion-fast), border-color var(--orbit-motion-fast);
	}

	.view-tabs a:hover {
		border-color: var(--orbit-line-strong);
		color: var(--orbit-ink);
	}

	.view-tabs a.active {
		border-color: var(--orbit-ink);
		background: var(--orbit-ink);
		color: var(--orbit-paper);
	}

	.period-label {
		color: var(--orbit-muted);
		font-size: 0.76rem;
		font-weight: 700;
	}

	.view-surface {
		overflow: hidden;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
	}

	.all-event-row {
		--event-tone: var(--orbit-muted);
		position: relative;
		display: grid;
		grid-template-columns: 6.5rem minmax(0, 1fr) 9rem;
		gap: 1rem;
		align-items: start;
		padding: 0.85rem 1rem 0.85rem 1.2rem;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.all-event-row::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 3px;
		background: var(--event-tone);
	}

	.all-event-row:last-child {
		border-bottom: 0;
	}

	.all-event-row[data-tone='blue'] { --event-tone: var(--orbit-link, var(--orbit-coral-dark)); }
	.all-event-row[data-tone='purple'] { --event-tone: var(--orbit-coral-dark); }
	.all-event-row[data-tone='lavender'] { --event-tone: var(--orbit-ink); }
	.all-event-row[data-tone='green'] { --event-tone: var(--orbit-success, var(--orbit-ink)); }
	.all-event-row[data-tone='orange'],
	.all-event-row[data-tone='yellow'] { --event-tone: var(--orbit-warning, var(--orbit-coral)); }
	.all-event-row[data-tone='red'] { --event-tone: var(--orbit-error, var(--orbit-coral-dark)); }

	.all-event-date {
		color: var(--orbit-muted);
		font-size: 0.65rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.45;
	}

	.all-event-date strong,
	.all-event-date span {
		display: block;
	}

	.all-event-date strong {
		color: var(--orbit-coral-dark);
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	.all-event-copy h3 {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 700;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.all-event-copy p {
		margin-top: 0.18rem;
		color: var(--orbit-muted);
		font-size: 0.66rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.all-event-type {
		justify-self: end;
		color: var(--event-tone);
		font-size: 0.64rem;
		font-weight: 700;
		line-height: 1.4;
		text-align: right;
	}

	.load-more-wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 1rem;
		border-top: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.load-more-wrap p {
		color: var(--orbit-muted);
		font-size: 0.68rem;
	}

	.load-more-wrap button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		color: var(--orbit-ink);
		font-size: 0.72rem;
		font-weight: var(--orbit-font-label-weight, 700);
		box-shadow: var(--orbit-shadow-sm);
	}

	.load-more-wrap button:hover:not(:disabled) {
		background: var(--orbit-coral-soft);
	}

	.load-more-wrap button:disabled {
		cursor: default;
		opacity: 0.55;
		box-shadow: none;
	}

	.mobile-week {
		display: block;
	}

	.mobile-day-tabs {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: var(--orbit-border-width);
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		background: var(--orbit-line);
	}

	.mobile-day-tabs button {
		position: relative;
		display: grid;
		min-width: 0;
		min-height: 60px;
		place-items: center;
		align-content: center;
		padding: 0.35rem 0.1rem;
		background: var(--orbit-surface);
		color: var(--orbit-ink);
	}

	.mobile-day-tabs button span {
		color: var(--orbit-muted);
		font-size: 0.58rem;
	}

	.mobile-day-tabs button strong {
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}

	.mobile-day-tabs button i {
		position: absolute;
		bottom: 0.35rem;
		width: 0.28rem;
		height: 0.28rem;
		border-radius: 50%;
		background: var(--orbit-coral);
	}

	.mobile-day-tabs button.active {
		background: var(--orbit-ink);
		color: var(--orbit-paper);
	}

	.mobile-day-tabs button.active span {
		color: color-mix(in srgb, var(--orbit-paper) 72%, transparent);
	}

	.mobile-day-panel {
		margin-top: 0.7rem;
		padding: 0.8rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
	}

	.mobile-day-panel > header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.7rem;
		padding-bottom: 0.65rem;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.mobile-day-panel > header strong,
	.mobile-day-panel > header span {
		display: block;
	}

	.mobile-day-panel > header strong {
		font-size: 0.9rem;
	}

	.mobile-day-panel > header span {
		color: var(--orbit-muted);
		font-size: 0.66rem;
	}

	.mobile-day-panel > header small {
		padding: 0.35rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		background: var(--orbit-coral-soft);
		color: var(--orbit-coral-dark);
		font-size: 0.66rem;
		white-space: nowrap;
	}

	.event-stack {
		display: grid;
		gap: 0.45rem;
	}

	.empty-day {
		display: grid;
		gap: 0.25rem;
		place-items: center;
		min-height: 7rem;
		padding: 0.8rem;
		color: var(--orbit-muted);
		text-align: center;
	}

	.empty-day strong {
		color: var(--orbit-ink);
		font-size: 0.78rem;
	}

	.empty-day span {
		max-width: 31rem;
		font-size: 0.68rem;
		line-height: 1.5;
	}

	.week-board {
		display: none;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.week-column {
		min-width: 0;
		border-right: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.week-column:last-child {
		border-right: 0;
	}

	.week-column > header {
		padding: 0.6rem 0.35rem;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		text-align: center;
	}

	.week-column > header strong,
	.week-column > header span {
		display: block;
	}

	.week-column > header strong {
		font-size: 0.72rem;
	}

	.week-column > header span {
		color: var(--orbit-muted);
		font-size: 0.6rem;
		font-variant-numeric: tabular-nums;
		text-transform: uppercase;
	}

	.week-events {
		display: grid;
		min-height: 15rem;
		align-content: start;
		gap: 0.42rem;
		padding: 0.42rem;
		background: var(--orbit-paper);
	}

	.quiet-empty {
		padding: 1.2rem 0.2rem;
		color: var(--orbit-muted);
		font-size: 0.64rem;
		text-align: center;
	}

	.view-help {
		margin: -0.2rem 0 0.7rem;
		color: var(--orbit-muted);
		font-size: 0.7rem;
		text-align: center;
	}

	.month-layout {
		display: grid;
	}

	.month-main {
		min-width: 0;
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.month-weekdays,
	.month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.month-weekdays {
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
	}

	.month-weekdays span {
		padding: 0.45rem 0.15rem;
		color: var(--orbit-muted);
		font-size: 0.6rem;
		font-weight: 700;
		text-align: center;
	}

	.month-grid button {
		min-height: 3.9rem;
		padding: 0.35rem;
		border-right: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		background: transparent;
		color: var(--orbit-ink);
		text-align: left;
	}

	.month-grid button:nth-child(7n) {
		border-right: 0;
	}

	.month-grid button:nth-last-child(-n + 7) {
		border-bottom: 0;
	}

	.month-grid button:hover {
		background: var(--orbit-paper-deep, var(--orbit-coral-soft));
	}

	.month-grid button.outside {
		opacity: 0.45;
	}

	.month-grid button.selected {
		background: var(--orbit-coral-soft);
		box-shadow: inset 0 0 0 2px var(--orbit-coral);
	}

	.month-grid button > span {
		font-size: 0.66rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.event-dots {
		display: flex;
		gap: 0.15rem;
		margin-top: 0.65rem;
	}

	.event-dots i {
		--dot: var(--orbit-muted);
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 50%;
		background: var(--dot);
	}

	.event-dots [data-tone='blue'] { --dot: var(--orbit-link, var(--orbit-coral-dark)); }
	.event-dots [data-tone='purple'] { --dot: var(--orbit-coral-dark); }
	.event-dots [data-tone='lavender'] { --dot: var(--orbit-ink); }
	.event-dots [data-tone='green'] { --dot: var(--orbit-success, var(--orbit-ink)); }
	.event-dots [data-tone='orange'],
	.event-dots [data-tone='yellow'] { --dot: var(--orbit-warning, var(--orbit-coral)); }
	.event-dots [data-tone='red'] { --dot: var(--orbit-error, var(--orbit-coral-dark)); }

	.selected-day-panel {
		padding: 1rem;
		background: var(--orbit-surface);
	}

	.selected-day-panel > h3 {
		margin: 0.2rem 0 0.75rem;
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.4;
	}

	.data-state {
		display: grid;
		gap: 0.25rem;
		padding: 1rem;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		border-radius: var(--orbit-radius-card);
		background: color-mix(in srgb, var(--orbit-surface) 82%, var(--orbit-paper));
		color: var(--orbit-muted);
		font-size: 0.78rem;
		line-height: 1.55;
	}

	.data-state strong {
		color: var(--orbit-ink);
		font-size: 0.84rem;
	}

	.data-state.compact {
		border: 0;
		border-radius: 0;
		background: transparent;
	}

	.data-note {
		margin-top: 0.7rem;
		color: var(--orbit-muted);
		font-size: 0.66rem;
		line-height: 1.5;
	}

	@media (min-width: 740px) {
		.mobile-week {
			display: none;
		}

		.week-board {
			display: grid;
		}
	}

	@media (min-width: 820px) {
		.month-layout {
			grid-template-columns: minmax(0, 1fr) 16rem;
		}

		.month-main {
			border-right: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
			border-bottom: 0;
		}

		.month-grid button {
			min-height: 4.5rem;
		}
	}

	@media (max-width: 819px) {
		.news-digest {
			grid-template-columns: 1fr;
		}

		.lead-story {
			grid-row: auto;
			border-right: 0;
			border-bottom: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line-strong);
		}
	}

	@media (max-width: 620px) {
		.page-head {
			display: block;
			padding-bottom: 1rem;
		}

		h1 {
			font-size: 1.55rem;
		}

		.page-update {
			margin-top: 0.55rem;
			text-align: left;
		}

		.content-section {
			padding: 1.65rem 0;
		}

		.section-head {
			align-items: start;
			margin-bottom: 0.8rem;
		}

		.section-head h2 {
			font-size: 1.12rem;
		}

		.lead-story {
			padding: 1rem;
		}

		.lead-story h3 {
			font-size: 1.15rem;
		}

		.quick-story {
			grid-template-columns: 3.8rem minmax(0, 1fr);
			gap: 0.6rem;
			padding: 0.7rem;
		}

		.events-tools {
			display: grid;
			gap: 0.6rem;
		}

		.view-tabs {
			width: 100%;
		}

		.view-tabs a {
			flex: 1;
			padding-inline: 0.45rem;
		}

		.period-label {
			text-align: right;
		}

		.all-event-row {
			grid-template-columns: 4.4rem minmax(0, 1fr);
			gap: 0.7rem;
			padding: 0.78rem 0.75rem 0.78rem 0.95rem;
		}

		.all-event-type {
			grid-column: 2;
			justify-self: start;
			text-align: left;
		}

		.load-more-wrap {
			align-items: stretch;
			flex-direction: column;
			text-align: center;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.view-tabs a {
			transition: none;
		}
	}
</style>
