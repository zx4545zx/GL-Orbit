<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import { classifyUrgency } from '$lib/subscriptions/summary.js';
	import type {
		CalendarDate,
		SubscriptionListItem,
		SubscriptionStatus
	} from '$lib/subscriptions/types.js';

	let {
		subscriptions,
		today,
		onRenew
	}: {
		subscriptions: SubscriptionListItem[];
		today: CalendarDate;
		onRenew: (item: SubscriptionListItem, trigger: HTMLElement) => void;
	} = $props();

	let query = $state('');
	let status = $state<'ALL' | SubscriptionStatus>('ALL');
	let filtered = $derived(
		subscriptions.filter((item) => {
			const haystack = [
				item.platform?.name,
				item.customPlatformName,
				item.planName,
				item.accountLabel
			]
				.filter(Boolean)
				.join(' ')
				.toLocaleLowerCase();
			return (
				(status === 'ALL' || item.status === status) &&
				haystack.includes(query.trim().toLocaleLowerCase())
			);
		})
	);

	const href = (path: string) => localizedHref(path, page.data.lang ?? 'th');
	const identity = (item: SubscriptionListItem) =>
		item.platform?.name ?? item.customPlatformName ?? item.planName ?? '—';
	const initials = (item: SubscriptionListItem) =>
		identity(item)
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	const seriesTitle = (series: SubscriptionListItem['relatedSeries'][number]) =>
		page.data.lang === 'en' ? (series.titleEn ?? series.titleTh ?? '—') : (series.titleTh ?? series.titleEn ?? '—');
	const cycleLabel = (item: SubscriptionListItem) => {
		const unit =
			item.billingUnit === 'DAY'
				? m.subscriptions_billing_day()
				: item.billingUnit === 'YEAR'
					? m.subscriptions_billing_year()
					: m.subscriptions_billing_month();
		return `${item.billingInterval} ${unit}`;
	};
	const urgencyLabel = (item: SubscriptionListItem) => {
		const urgency = classifyUrgency(
			item.currentPeriodEnd,
			today,
			item.alertDays,
			item.renewsAutomatically,
			item.status
		);
		if (urgency.state === 'EXPIRED') return m.subscriptions_expired();
		if (urgency.state === 'DUE_TODAY') return m.subscriptions_due_today();
		return m.subscriptions_days_remaining({ days: urgency.daysRemaining });
	};
</script>

<section class="grid gap-4">
	<div class="grid gap-3 border border-[var(--orbit-line)] bg-white p-4 md:grid-cols-[1fr_auto] md:items-end">
		<label class="grid gap-1 text-sm font-medium text-plum">
			<span>{m.subscriptions_search_label()}</span>
			<input
				type="search"
				bind:value={query}
				class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
			/>
		</label>
		<div class="grid grid-cols-3" aria-label={m.subscriptions_status()}>
			{#each [
				{ value: 'ALL' as const, label: m.subscriptions_filter_all() },
				{ value: 'ACTIVE' as const, label: m.subscriptions_filter_active() },
				{ value: 'CANCELED' as const, label: m.subscriptions_filter_canceled() }
			] as filter}
				<button
					type="button"
					class="touch-target border border-[var(--orbit-line)] px-3 text-sm aria-pressed:bg-plum aria-pressed:text-white"
					aria-pressed={status === filter.value}
					onclick={() => (status = filter.value)}
				>
					{filter.label}
				</button>
			{/each}
		</div>
	</div>

	{#if filtered.length === 0}
		<div class="border border-[var(--orbit-line)] bg-white p-8 text-center text-plum/60">
			{m.subscriptions_empty()}
		</div>
	{/if}

	{#each filtered as item (item.id)}
		<article
			data-subscription-id={item.id}
			class="grid gap-5 border border-[var(--orbit-line)] bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(9rem,.6fr)_minmax(11rem,.7fr)_auto] lg:items-center"
		>
			<div class="flex min-w-0 items-start gap-3">
				{#if item.platform?.logoUrl}
					<img
						src={item.platform.logoUrl}
						alt=""
						class="h-12 w-12 shrink-0 border border-[var(--orbit-line)] object-cover"
					/>
				{:else}
					<div class="grid h-12 w-12 shrink-0 place-items-center border border-[var(--orbit-line)] bg-lavender/15 font-display text-sm">
						{initials(item)}
					</div>
				{/if}
				<div class="min-w-0">
					<p class="font-display text-lg text-plum">{identity(item)}</p>
					{#if item.planName}<p class="text-sm text-plum/75">{item.planName}</p>{/if}
					{#if item.accountLabel}<p class="text-xs text-plum/55">{item.accountLabel}</p>{/if}
					{#if item.platform && item.relatedSeries.length > 0}
						<div data-related-series class="mt-3 flex flex-wrap items-center gap-2 text-xs">
							<span class="font-medium text-plum/65">{m.subscriptions_related_series()}:</span>
							{#each item.relatedSeries as series (series.id)}
								<a class="touch-target inline-flex items-center underline-offset-4 hover:underline" href={href(`/series/${series.id}`)}>
									{seriesTitle(series)}
								</a>
							{/each}
							{#if item.relatedSeriesRemaining > 0}<span>+{item.relatedSeriesRemaining}</span>{/if}
						</div>
					{/if}
				</div>
			</div>

			<div>
				<p class="font-display text-lg text-plum">{item.currency} {item.amount}</p>
				<p class="text-sm text-plum/60">{cycleLabel(item)}</p>
			</div>

			<div>
				<p class="text-sm text-plum/60">{m.subscriptions_period_end()}</p>
				<p class="font-medium text-plum">{item.currentPeriodEnd}</p>
				<p class="mt-1 text-sm text-coral">{urgencyLabel(item)}</p>
			</div>

			<div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
				{#if item.status === 'ACTIVE'}
					<button
						type="button"
						class="touch-target min-h-11 min-w-11 border border-coral bg-coral px-3 text-sm font-semibold text-white"
						onclick={(event) => onRenew(item, event.currentTarget)}
					>
						{m.subscriptions_renew()}
					</button>
				{/if}
				<a
					class="touch-target min-h-11 min-w-11 border border-plum/20 px-3 text-center text-sm font-semibold leading-[2.75rem]"
					href={href(`/subscriptions/${item.id}`)}
				>
					{m.subscriptions_manage()}
				</a>
			</div>
		</article>
	{/each}
</section>
