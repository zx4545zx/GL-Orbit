<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import type { EventType, OrbitEvent } from '$lib/types/whats-on.js';
	import { googleMapsSearchUrl, venueName } from './whats-on.js';

	let {
		event,
		eventType = null,
		lang,
		compact = false
	}: {
		event: OrbitEvent;
		eventType?: EventType | null;
		lang: string;
		compact?: boolean;
	} = $props();

	const tone = $derived(eventType?.colorName.toLowerCase() ?? 'other');
	const typeLabel = $derived(eventType?.name ?? m.whats_on_type_other());

	function formatTime(value: string) {
		return new Intl.DateTimeFormat(lang, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: event.sourceTimezone
		}).format(new Date(value));
	}

</script>

<article class:compact class="event-card" data-tone={tone}>
	<div class="event-accent" aria-hidden="true"></div>
	<div class="event-body">
		<div class="event-meta">
			<span class="event-type">{typeLabel}</span>
			<span aria-hidden="true">·</span>
			<span>
				{#if event.allDay}
					{m.whats_on_all_day()}
				{:else}
					{formatTime(event.startsAt)}{event.endsAt ? `–${formatTime(event.endsAt)}` : ''}
				{/if}
			</span>
		</div>
		<h3>{event.performer ? `${event.performer} · ${event.title}` : event.title}</h3>
		{#if !compact}
			{@const venue = venueName(event.location)}
			<div class="event-details">
				<span class="event-location">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
					{#if venue}
						<a href={googleMapsSearchUrl(venue)} target="_blank" rel="noopener noreferrer">{venue}</a>
					{:else}
						{m.whats_on_no_location()}
					{/if}
				</span>
				<span>
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
					{m.whats_on_timezone({ timezone: event.sourceTimezone.replaceAll('_', ' ') })}
				</span>
			</div>
		{/if}
	</div>
</article>

<style>
	.event-card {
		--event-tone: var(--orbit-muted);
		--event-soft: var(--orbit-paper-deep, var(--orbit-paper));
		display: grid;
		grid-template-columns: 0.35rem minmax(0, 1fr);
		min-width: 0;
		border: var(--orbit-border-width) var(--orbit-border-style) var(--orbit-line);
		border-radius: var(--orbit-radius-card);
		background: var(--orbit-surface);
		overflow: hidden;
		box-shadow: var(--orbit-shadow-sm);
		transition: transform var(--orbit-motion-fast) var(--orbit-motion-ease), border-color var(--orbit-motion-fast), box-shadow var(--orbit-motion-fast);
	}

	.event-card:hover {
		border-color: var(--event-tone);
		transform: translateY(-2px);
		box-shadow: var(--orbit-shadow-raised, var(--orbit-shadow));
	}

	.event-card:active { transform: translateY(0) scale(0.99); }

	.event-card[data-tone='blue'] { --event-tone: var(--orbit-link, var(--orbit-coral-dark)); --event-soft: var(--orbit-mint); }
	.event-card[data-tone='purple'] { --event-tone: var(--orbit-coral-dark); --event-soft: var(--orbit-lavender); }
	.event-card[data-tone='lavender'] { --event-tone: var(--orbit-ink); --event-soft: var(--orbit-lavender); }
	.event-card[data-tone='grey'] { --event-tone: var(--orbit-muted); }
	.event-card[data-tone='green'] { --event-tone: var(--orbit-success, var(--orbit-ink)); --event-soft: var(--orbit-mint); }
	.event-card[data-tone='orange'] { --event-tone: var(--orbit-warning, var(--orbit-coral)); --event-soft: var(--orbit-coral-soft); }
	.event-card[data-tone='red'] { --event-tone: var(--orbit-error, var(--orbit-coral-dark)); --event-soft: var(--orbit-coral-soft); }
	.event-card[data-tone='yellow'] { --event-tone: var(--orbit-warning, var(--orbit-coral)); --event-soft: color-mix(in srgb, var(--orbit-coral-soft) 48%, var(--orbit-surface)); }

	.event-accent { background: var(--event-tone); }
	.event-body { min-width: 0; padding: 0.85rem 0.9rem 0.9rem; }
	.event-meta { display: flex; flex-wrap: wrap; gap: 0.3rem; color: var(--orbit-muted); font-size: 0.72rem; line-height: 1.25; }
	.event-type { color: var(--event-tone); font-weight: 800; }
	h3 { margin-top: 0.38rem; color: var(--orbit-ink); font-family: var(--orbit-font-body); font-size: 0.9rem; font-weight: 750; line-height: 1.4; overflow-wrap: anywhere; }
	.event-details { display: grid; gap: 0.32rem; margin-top: 0.7rem; padding-top: 0.65rem; border-top: 1px var(--orbit-border-style) var(--orbit-line); color: var(--orbit-muted); font-size: 0.72rem; }
	.event-details span { display: flex; min-width: 0; align-items: flex-start; gap: 0.38rem; overflow-wrap: anywhere; }
	.event-details svg { width: 0.9rem; height: 0.9rem; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; }
	.event-location a { color: inherit; text-decoration: underline; text-decoration-style: dotted; text-decoration-thickness: 1px; text-underline-offset: 0.16em; }
	.event-location a:hover { color: var(--event-tone); text-decoration-style: solid; }
	.event-location a:focus-visible { outline: 2px solid var(--event-tone); outline-offset: 2px; border-radius: 0.15rem; }

	.compact { box-shadow: none; }
	.compact:hover { transform: none; box-shadow: none; }
	.compact .event-body { padding: 0.65rem 0.7rem; }
	.compact h3 { font-size: 0.76rem; line-height: 1.35; }
	.compact .event-meta { font-size: 0.65rem; }

	@media (prefers-reduced-motion: reduce) {
		.event-card { transition: none; }
		.event-card:hover,
		.event-card:active { transform: none; }
	}
</style>
