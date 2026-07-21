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

	const money = (amount: string, currency: string) => `${currency} ${amount}`;
	const subscriptionLabel = (id: string) => {
		const item = subscriptions.find((subscription) => subscription.id === id);
		return item?.platform?.name ?? item?.customPlatformName ?? item?.planName ?? id;
	};
	const detailHref = (id: string) =>
		localizedHref(`/subscriptions/${id}`, page.data.lang ?? 'th');
</script>

<section
	class="grid gap-px border border-[var(--orbit-line)] bg-[var(--orbit-line)] lg:grid-cols-2"
	aria-live="polite"
>
	{#if loading}
		<div
			class="col-span-full grid min-h-40 animate-pulse place-items-center bg-white p-6"
			aria-busy="true"
		>
			<span>{m.subscriptions_loading()}</span>
		</div>
	{:else if error}
		<div class="col-span-full bg-white p-6" role="alert">
			<p>{error}</p>
			<button class="touch-target mt-4 border border-plum/20 px-4" onclick={onRetry}>
				{m.subscriptions_retry()}
			</button>
		</div>
	{:else if summary}
		<article data-section="actual" class="bg-white p-5 sm:p-6">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_actual_title()}</h2>
			{#if summary.actualTotals.length === 0}
				<p class="mt-3 text-sm text-plum/60">—</p>
			{/if}
			{#each summary.actualTotals as item (item.currency)}
				<p data-currency={item.currency} class="mt-3 flex justify-between gap-4">
					<span>{item.currency}</span>
					<strong>{money(item.total, item.currency)}</strong>
				</p>
			{/each}
		</article>

		<article data-section="forecast" class="bg-lavender/10 p-5 sm:p-6">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_forecast_title()}</h2>
			<p class="mt-1 text-sm text-plum/65">{m.subscriptions_forecast_note()}</p>
			{#if summary.forecastTotals.length === 0}
				<p class="mt-3 text-sm text-plum/60">—</p>
			{/if}
			{#each summary.forecastTotals as item (item.currency)}
				<p class="mt-3 flex justify-between gap-4">
					<span>{item.currency}</span>
					<strong>{money(item.total, item.currency)}</strong>
				</p>
			{/each}
		</article>

		<article class="bg-white p-5 sm:p-6 lg:col-span-2">
			<h2 class="font-display text-xl text-plum">{m.subscriptions_budget_title()}</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each summary.budgets as budget (budget.currency)}
					<div
						data-currency={budget.currency}
						data-budget-state={budget.state}
						class="border border-[var(--orbit-line)] p-4"
					>
						<div class="flex justify-between gap-4">
							<strong>{budget.currency}</strong>
							<span class="text-right">
								{money(budget.actual, budget.currency)} / {money(
									budget.monthlyLimit,
									budget.currency
								)}
							</span>
						</div>
						<div class="mt-3 h-2 bg-plum/10">
							<div
								class="h-full bg-coral"
								style:width={`${Math.min(100, budget.usageBasisPoints / 100)}%`}
							></div>
						</div>
						<p class="mt-2 text-sm">
							{budget.state === 'OVER'
								? m.subscriptions_budget_over()
								: budget.state === 'NEAR'
									? m.subscriptions_budget_near()
									: m.subscriptions_budget_safe()}
						</p>
					</div>
				{/each}
			</div>
		</article>

		{#if summary.urgencies.some((item) => item.state !== 'SAFE')}
			<article data-section="alerts" class="bg-coral/10 p-5 sm:p-6 lg:col-span-2">
				<h2 class="font-display text-xl text-plum">{m.subscriptions_alerts_title()}</h2>
				<ul class="mt-3 grid gap-2">
					{#each summary.urgencies.filter((item) => item.state !== 'SAFE') as item (item.subscriptionId)}
						<li>
							<a
								class="touch-target flex items-center border border-coral/40 px-3 py-2"
								href={detailHref(item.subscriptionId)}
							>
								<strong>{subscriptionLabel(item.subscriptionId)}</strong>
								<span class="ml-2">
									· {item.state === 'EXPIRED'
										? m.subscriptions_expired()
										: item.state === 'DUE_TODAY'
											? m.subscriptions_due_today()
											: m.subscriptions_days_remaining({ days: item.daysRemaining })}{item.awaitingConfirmation
										? ` · ${m.subscriptions_awaiting_confirmation()}`
										: ''}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</article>
		{/if}
	{/if}
</section>
