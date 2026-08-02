<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	interface Props {
		currentMonth: Date;
		viewMode: 'grid' | 'calendar';
		lang: string;
		onPrevMonth: () => void | Promise<void>;
		onNextMonth: () => void | Promise<void>;
		onToday: () => void | Promise<void>;
	}

	let { currentMonth, viewMode, lang, onPrevMonth, onNextMonth, onToday }: Props = $props();
</script>

<nav class="cal-monthnav" aria-label={viewMode === 'grid' ? m.calendar_view_month_grid() : m.calendar_view_month_calendar()}>
	<button type="button" aria-label={m.calendar_month_prev_aria()} onclick={onPrevMonth} class="cal-sqbtn">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
	</button>

	<div class="min-w-0 flex-1 text-center">
		<div class="cal-monthnav-label">
			{viewMode === 'grid' ? m.calendar_view_month_grid() : m.calendar_view_month_calendar()}
		</div>
		<h2 class="cal-monthnav-name">
			<span class="sm:hidden">{new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short' }).format(currentMonth)}</span>
			<span class="hidden sm:inline">{new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long' }).format(currentMonth)}</span>
		</h2>
	</div>

	<button type="button" onclick={onToday} aria-label={m.calendar_month_today_aria()} class="cal-today-btn hidden sm:inline-flex">
		{m.calendar_month_today_text()}
	</button>
	<button type="button" onclick={onToday} aria-label={m.calendar_month_today_aria()} class="cal-today-btn cal-today-btn--icon sm:hidden">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
	</button>
	<button type="button" aria-label={m.calendar_month_next_aria()} onclick={onNextMonth} class="cal-sqbtn">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
	</button>
</nav>

<style>
	.cal-monthnav {
		margin: 8px 0 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: nowrap;
		background: var(--orbit-surface);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-surface);
		box-shadow: var(--orbit-shadow);
		padding: 10px 14px;
	}
	.cal-monthnav-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--orbit-coral-dark);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 2px;
	}
	.cal-monthnav-name {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight, 700);
		font-size: 20px;
		color: var(--orbit-ink);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cal-sqbtn {
		flex: 0 0 auto;
		width: 44px;
		height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--orbit-lavender);
		color: var(--orbit-ink);
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		cursor: pointer;
		transition: background-color var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease), transform var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-sqbtn:hover { background: var(--orbit-coral-soft); }
	.cal-sqbtn:active { transform: translate(1px, 1px); box-shadow: none; }
	.cal-today-btn {
		flex: 0 0 auto;
		min-height: 44px;
		padding: 10px 18px;
		align-items: center;
		justify-content: center;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-label-weight, 700);
		font-size: 13px;
		background: var(--orbit-coral);
		color: #fff;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		box-shadow: var(--orbit-shadow);
		cursor: pointer;
	}
	.cal-today-btn:hover { background: var(--orbit-coral-dark); }
	.cal-today-btn--icon { width: 44px; padding: 0; display: inline-flex; }

	@media (max-width: 639px) {
		.cal-monthnav { gap: 6px; padding: 8px 10px; }
		.cal-monthnav-name { font-size: 15px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.cal-sqbtn { transition: none; }
		.cal-sqbtn:active { transform: none; }
	}
</style>
