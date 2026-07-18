<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';

	interface Props {
		currentWeek: Date;
		onPrevWeek: () => void;
		onNextWeek: () => void;
		onThisWeek: () => void;
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
			short: `${shortFmt.format(start)} - ${shortFmt.format(end)}`,
			full: `${fullFmt.format(start)} - ${fullFmt.format(end)}`
		};
	})());
</script>

<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6">
	<div class="flex items-center gap-3">
		<button
			aria-label={m.calendar_week_header_prev_aria()}
			onclick={onPrevWeek}
			class="w-11 h-11 rounded-xl orbit-control flex items-center justify-center transition-all hover:-translate-x-0.5 touch-target flex-shrink-0"
		>
			<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
			</svg>
		</button>

		<div class="flex-1 min-w-0 text-center">
			<div class="text-[11px] sm:text-xs font-bold text-coral-dark uppercase tracking-wide mb-0.5">{m.calendar_week_header_current_label()}</div>
			<h2 class="font-[family-name:var(--font-display)] text-base sm:text-2xl md:text-3xl font-bold text-plum truncate">
				<span class="sm:hidden">{weekRangeText.short}</span>
				<span class="hidden sm:inline">{weekRangeText.full}</span>
			</h2>
		</div>

		<div class="flex items-center gap-2 flex-shrink-0">
			<button
				onclick={onThisWeek}
				aria-label={m.calendar_week_header_this_week_aria()}
				class="hidden sm:inline-flex h-11 px-5 rounded-xl items-center justify-center orbit-action text-sm font-bold hover:-translate-y-0.5 transition-all touch-target"
			>
				{m.calendar_week_header_this_week_text()}
			</button>
			<button
				onclick={onThisWeek}
				aria-label={m.calendar_week_header_this_week_aria()}
				class="sm:hidden w-11 h-11 rounded-xl orbit-action flex items-center justify-center touch-target"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</button>
			<button
				aria-label={m.calendar_week_header_next_aria()}
				onclick={onNextWeek}
			class="w-11 h-11 rounded-xl orbit-control flex items-center justify-center transition-all hover:translate-x-0.5 touch-target"
			>
				<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</button>
		</div>
	</div>
</div>
