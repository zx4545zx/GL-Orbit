<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import BudgetControls from '$lib/components/subscriptions/BudgetControls.svelte';
	import RenewalDialog from '$lib/components/subscriptions/RenewalDialog.svelte';
	import SubscriptionList from '$lib/components/subscriptions/SubscriptionList.svelte';
	import SubscriptionSummary from '$lib/components/subscriptions/SubscriptionSummary.svelte';
	import {
		deviceLocalToday,
		subscriptionErrorMessage,
		subscriptionFetch,
		SubscriptionApiRequestError
	} from '$lib/subscriptions/client.js';
	import type {
		CalendarDate,
		SubscriptionListItem,
		SubscriptionSummary as Summary
	} from '$lib/subscriptions/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let subscriptions = $state(untrack(() => data.subscriptions));
	let budgets = $state(untrack(() => data.budgets));
	let today = $state<CalendarDate | null>(null);
	let summary = $state<Summary | null>(null);
	let loading = $state(true);
	let summaryError = $state<string | null>(null);
	let renewalTarget = $state<SubscriptionListItem | null>(null);
	let renewalTrigger = $state<HTMLElement | null>(null);

	async function refreshStableData() {
		subscriptions = await subscriptionFetch<SubscriptionListItem[]>('/api/subscriptions');
	}

	async function refreshSummary() {
		loading = true;
		summaryError = null;
		const localToday = deviceLocalToday();
		today = localToday;
		try {
			const nextSummary = await subscriptionFetch<Summary>(
				`/api/subscriptions/summary?today=${encodeURIComponent(localToday)}`
			);
			summary = nextSummary;
			budgets = nextSummary.budgets.map(({ currency, monthlyLimit, warningPercent }) => ({
				currency,
				monthlyLimit,
				warningPercent
			}));
		} catch (caught) {
			summary = null;
			summaryError =
				caught instanceof SubscriptionApiRequestError
					? subscriptionErrorMessage(caught)
					: m.subscriptions_error_internal();
		} finally {
			loading = false;
		}
	}

	async function refreshAll() {
		const targetId = renewalTarget?.id;
		await Promise.all([refreshStableData(), refreshSummary()]);
		if (targetId) {
			renewalTarget = subscriptions.find((item) => item.id === targetId) ?? renewalTarget;
		}
	}

	function openRenewal(item: SubscriptionListItem, trigger: HTMLElement) {
		renewalTarget = item;
		renewalTrigger = trigger;
	}

	function closeRenewal() {
		renewalTarget = null;
		renewalTrigger = null;
	}

	onMount(() => {
		void refreshSummary();
		const refreshIfDateChanged = () => {
			if (document.visibilityState === 'visible' && (today === null || deviceLocalToday() !== today)) {
				void refreshSummary();
			}
		};
		document.addEventListener('visibilitychange', refreshIfDateChanged);
		const timer = window.setInterval(refreshIfDateChanged, 60_000);
		return () => {
			document.removeEventListener('visibilitychange', refreshIfDateChanged);
			window.clearInterval(timer);
		};
	});
</script>

<svelte:head>
	<title>{m.subscriptions_seo_title()}</title>
	<meta name="description" content={m.subscriptions_seo_description()} />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto grid w-full max-w-6xl gap-6 pb-24 pt-5 sm:gap-8 sm:pt-8 md:pb-12">
	<header class="grid gap-4 border border-[var(--orbit-line)] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-7">
		<div>
			<p class="text-xs font-bold uppercase tracking-[0.18em] text-coral">GL Orbit</p>
			<h1 class="mt-2 font-display text-3xl text-plum sm:text-4xl">{m.subscriptions_title()}</h1>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-plum/65 sm:text-base">
				{m.subscriptions_subtitle()}
			</p>
		</div>
		<a
			class="touch-target inline-flex min-h-11 items-center justify-center border border-coral bg-coral px-5 font-semibold text-white"
			href={localizedHref('/subscriptions/new', page.data.lang)}
		>
			{m.subscriptions_add()}
		</a>
	</header>

	<SubscriptionSummary
		{summary}
		{subscriptions}
		{loading}
		error={summaryError}
		onRetry={refreshSummary}
	/>

	<BudgetControls budgets={budgets} currencies={data.currencies} onChanged={refreshSummary} />

	{#if today}
		<SubscriptionList {subscriptions} {today} onRenew={openRenewal} />
	{:else}
		<section
			class="grid min-h-48 animate-pulse place-items-center border border-[var(--orbit-line)] bg-white p-6"
			aria-busy="true"
		>
			{m.subscriptions_loading()}
		</section>
	{/if}
</main>

<RenewalDialog
	subscription={renewalTarget}
	currencies={data.currencies}
	open={renewalTarget !== null}
	returnFocusTo={renewalTrigger}
	onClose={closeRenewal}
	onRenewed={async () => {
		await refreshAll();
		closeRenewal();
	}}
	onConflict={refreshAll}
/>
