<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	type CalendarView = 'grid' | 'calendar' | 'list' | 'card';

	interface Props {
		viewMode: CalendarView;
		ariaLabel: string;
		onSelect: (view: CalendarView) => void | Promise<void>;
	}

	let { viewMode, ariaLabel, onSelect }: Props = $props();

	const viewButtons = [
		{ key: 'card' as const, label: m.calendar_view_week, icon: '<rect x="1.5" y="2" width="13" height="12"/><path d="M1.5 6h13M5.5 2v12M10.5 2v12"/>' },
		{ key: 'list' as const, label: m.calendar_view_list, icon: '<path d="M1.5 3.5h13M1.5 8h13M1.5 12.5h13"/>' },
		{ key: 'calendar' as const, label: m.calendar_view_month_calendar, icon: '<rect x="1.5" y="2" width="13" height="12"/><path d="M1.5 6h13M5.5 2v4M10.5 2v4"/>' },
		{ key: 'grid' as const, label: m.calendar_view_month_grid, icon: '<rect x="1.5" y="1.5" width="5.5" height="5.5"/><rect x="9" y="1.5" width="5.5" height="5.5"/><rect x="1.5" y="9" width="5.5" height="5.5"/><rect x="9" y="9" width="5.5" height="5.5"/>' }
	];
</script>

<div class="cal-toggle" role="group" aria-label={ariaLabel}>
	{#each viewButtons as btn}
		{@const active = viewMode === btn.key}
		<button
			type="button"
			class="cal-toggle-btn {active ? 'cal-toggle-btn--active' : ''}"
			aria-label={btn.label()}
			aria-pressed={active}
			title={btn.label()}
			onclick={() => onSelect(btn.key)}
		>
			<svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 16 16" aria-hidden="true">{@html btn.icon}</svg>
			<span class="hidden sm:inline">{btn.label()}</span>
		</button>
	{/each}
</div>

<style>
	.cal-toggle {
		display: inline-flex;
		border: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: var(--orbit-radius-control);
		background: var(--orbit-surface);
		box-shadow: var(--orbit-shadow);
		overflow: hidden;
	}
	.cal-toggle-btn {
		appearance: none;
		border: none;
		background: transparent;
		cursor: pointer;
		min-width: 48px;
		min-height: 44px;
		padding: 10px 14px;
		font-family: var(--orbit-font-display);
		font-weight: var(--orbit-font-label-weight, 600);
		font-size: 12px;
		color: var(--orbit-ink);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border-right: var(--orbit-border-width) solid var(--orbit-line-strong);
		border-radius: 0 !important;
		transition: background-color var(--orbit-motion-fast, 120ms) var(--orbit-motion-ease, ease);
	}
	.cal-toggle-btn:last-child { border-right: none; }
	.cal-toggle-btn:hover { background: var(--orbit-coral-soft); }
	.cal-toggle-btn--active,
	.cal-toggle-btn--active:hover {
		background: var(--orbit-ink);
		color: var(--orbit-mint);
	}

	@media (max-width: 639px) {
		.cal-toggle-btn { min-width: 44px; padding: 10px 11px; }
		.cal-toggle { align-self: flex-start; max-width: 100%; }
	}

	@media (prefers-reduced-motion: reduce) {
		.cal-toggle-btn { transition: none; }
	}
</style>
