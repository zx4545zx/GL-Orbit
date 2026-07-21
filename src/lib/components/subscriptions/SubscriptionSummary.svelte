<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type {
		SubscriptionListItem,
		SubscriptionSummary as Summary
	} from '$lib/subscriptions/types.js';

	let {
		summary,
		subscriptions,
		loading,
		error,
		onRetry
	}: {
		summary: Summary | null;
		subscriptions: SubscriptionListItem[];
		loading: boolean;
		error: string | null;
		onRetry: () => void;
	} = $props();

	const subscriptionLabel = (id: string) => {
		const item = subscriptions.find((subscription) => subscription.id === id);
		return item?.platform?.name ?? item?.customPlatformName ?? item?.planName ?? id;
	};
	const detailHref = (id: string) =>
		localizedHref(`/subscriptions/${id}`, page.data.lang ?? 'th');
</script>

<section
	class="grid border border-[var(--orbit-line)] bg-[var(--orbit-surface)] lg:grid-cols-12"
	aria-live="polite"
>
	{#if loading}
		<div
			class="col-span-full grid min-h-40 animate-pulse place-items-center p-6 text-[var(--orbit-muted)]"
			aria-busy="true"
		>
			<span>{m.subscriptions_loading()}</span>
		</div>
	{:else if error}
		<div class="col-span-full p-6 text-[var(--orbit-ink)]" role="alert">
			<p>{error}</p>
			<button class="touch-target mt-4 border border-[var(--orbit-line-strong)] px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orbit-coral)]" onclick={onRetry}>
				{m.subscriptions_retry()}
			</button>
		</div>
	{:else if summary}
		<article data-section="actual" class="border-b border-[var(--orbit-line)] p-5 sm:p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
			<h2 class="text-sm font-semibold text-[var(--orbit-muted)]">{m.subscriptions_actual_title()}</h2>
			{#if summary.actualTotals.length === 0}
				<p class="mt-4 font-display text-3xl text-[var(--orbit-muted)]">—</p>
			{/if}
			{#each summary.actualTotals as item (item.currency)}
				<p data-currency={item.currency} class="mt-3 flex items-baseline justify-between gap-4 text-[var(--orbit-ink)]">
					<span class="text-xs font-bold tracking-wider text-[var(--orbit-muted)]">{item.currency}</span>
					<strong class="font-display text-2xl sm:text-3xl">{item.total}</strong>
				</p>
			{/each}
		</article>

		<article data-section="forecast" class="border-b border-[var(--orbit-line)] bg-[var(--orbit-lavender)] p-5 sm:p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
			<h2 class="text-sm font-semibold text-[var(--orbit-ink)]">{m.subscriptions_forecast_title()}</h2>
			<p class="mt-1 text-xs leading-5 text-[var(--orbit-muted)]">{m.subscriptions_forecast_note()}</p>
			{#if summary.forecastTotals.length === 0}
				<p class="mt-4 font-display text-3xl text-[var(--orbit-muted)]">—</p>
			{/if}
			{#each summary.forecastTotals as item (item.currency)}
				<p class="mt-3 flex items-baseline justify-between gap-4 text-[var(--orbit-ink)]">
					<span class="text-xs font-bold tracking-wider text-[var(--orbit-muted)]">{item.currency}</span>
					<strong class="font-display text-2xl sm:text-3xl">{item.total}</strong>
				</p>
			{/each}
		</article>

		<article class="p-5 sm:p-6 lg:col-span-4">
			<h2 class="text-sm font-semibold text-[var(--orbit-muted)]">{m.subscriptions_budget_title()}</h2>
			<div class="mt-4 grid gap-4">
				{#each summary.budgets as budget (budget.currency)}
					<div
						data-currency={budget.currency}
						data-budget-state={budget.state}
						class="text-[var(--orbit-ink)]"
					>
						<div class="flex items-end justify-between gap-4 text-sm">
							<strong class="text-xs tracking-wider">{budget.currency}</strong>
							<span class="text-right font-medium">
								{budget.actual} / {budget.monthlyLimit}
							</span>
						</div>
						<div class="mt-2 h-2 bg-[var(--orbit-paper-deep)]">
							<div
								class="h-full {budget.state === 'SAFE' ? 'bg-[var(--orbit-mint)]' : 'bg-[var(--orbit-coral)]'}"
								style:width={`${Math.min(100, budget.usageBasisPoints / 100)}%`}
							></div>
						</div>
						<p class="mt-2 text-xs text-[var(--orbit-muted)]">
							{budget.state === 'OVER'
								? m.subscriptions_budget_over()
								: budget.state === 'NEAR'
									? m.subscriptions_budget_near()
									: m.subscriptions_budget_safe()}
						</p>
					</div>
				{/each}
				{#if summary.budgets.length === 0}
					<p class="font-display text-3xl text-[var(--orbit-muted)]">—</p>
				{/if}
			</div>
		</article>

		{#if summary.urgencies.some((item) => item.state !== 'SAFE')}
			<article data-section="alerts" class="col-span-full border-t border-[var(--orbit-line)] bg-[var(--orbit-coral-soft)] p-5 sm:p-6">
				<h2 class="font-display text-lg text-[var(--orbit-ink)]">{m.subscriptions_alerts_title()}</h2>
				<ul class="mt-3 grid gap-2">
					{#each summary.urgencies.filter((item) => item.state !== 'SAFE') as item (item.subscriptionId)}
						<li>
							<a
								class="touch-target flex items-center gap-1.5 border border-[var(--orbit-coral)] px-2 py-2 text-xs text-[var(--orbit-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orbit-coral)] sm:gap-2 sm:px-3 sm:text-sm"
								href={detailHref(item.subscriptionId)}
							>
								<strong class="shrink-0">{subscriptionLabel(item.subscriptionId)}</strong>
								<span class="whitespace-nowrap">
									· {item.state === 'EXPIRED'
										? m.subscriptions_expired()
										: item.state === 'DUE_TODAY'
											? m.subscriptions_due_today()
											: m.subscriptions_days_remaining({ days: item.daysRemaining })}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</article>
		{/if}
	{/if}
</section>
