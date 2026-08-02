<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';

	interface Props {
		currentWeek: Date;
		onPrevWeek: () => void | Promise<void>;
		onNextWeek: () => void | Promise<void>;
		onThisWeek: () => void | Promise<void>;
	}

	let { currentWeek, onPrevWeek, onNextWeek, onThisWeek }: Props = $props();
	const lang = $derived(page.data.lang);

	function getStartOfWeek(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.setDate(diff));
	}

	function getEndOfWeek(date: Date): Date {
		const start = getStartOfWeek(date);
		return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
	}

	const weekRangeText = $derived((() => {
		const start = getStartOfWeek(currentWeek);
		const end = getEndOfWeek(currentWeek);
		const shortFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' });
		const fullFmt = new Intl.DateTimeFormat(lang, { month: 'long', day: 'numeric', year: 'numeric' });
		return {
			short: shortFmt.formatRange(start, end),
			full: fullFmt.formatRange(start, end)
		};
	})());
</script>

<nav class="weeknav" aria-label={m.calendar_week_header_current_label()}>
	<button type="button" aria-label={m.calendar_week_header_prev_aria()} onclick={onPrevWeek} class="weeknav-sqbtn">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
	</button>

	<div class="min-w-0 flex-1 text-center">
		<div class="weeknav-label">{m.calendar_week_header_current_label()}</div>
		<h2 class="weeknav-name">
			<span class="sm:hidden">{weekRangeText.short}</span>
			<span class="hidden sm:inline">{weekRangeText.full}</span>
		</h2>
	</div>

	<button type="button" onclick={onThisWeek} aria-label={m.calendar_week_header_this_week_aria()} class="weeknav-today hidden sm:inline-flex">
		{m.calendar_week_header_this_week_text()}
	</button>
	<button type="button" onclick={onThisWeek} aria-label={m.calendar_week_header_this_week_aria()} class="weeknav-today weeknav-today--icon sm:hidden">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
	</button>
	<button type="button" aria-label={m.calendar_week_header_next_aria()} onclick={onNextWeek} class="weeknav-sqbtn">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
	</button>
</nav>

<style>
	.weeknav {
		margin: 0 0 16px;
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
	.weeknav-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--orbit-coral-dark);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 2px;
	}
	.weeknav-name {
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-heading-weight, 700);
		font-size: 20px;
		color: var(--orbit-ink);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.weeknav-sqbtn {
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
	.weeknav-sqbtn:hover { background: var(--orbit-coral-soft); }
	.weeknav-sqbtn:active { transform: translate(1px, 1px); box-shadow: none; }
	.weeknav-today {
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
	.weeknav-today:hover { background: var(--orbit-coral-dark); }
	.weeknav-today--icon { width: 44px; padding: 0; display: inline-flex; }

	@media (max-width: 639px) {
		.weeknav { gap: 6px; padding: 8px 10px; }
		.weeknav-name { font-size: 14px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.weeknav-sqbtn { transition: none; }
		.weeknav-sqbtn:active { transform: none; }
	}
</style>
