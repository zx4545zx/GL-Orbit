<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import PaymentHistory from '$lib/components/subscriptions/PaymentHistory.svelte';
	import RenewalDialog from '$lib/components/subscriptions/RenewalDialog.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import { deviceLocalToday, subscriptionFetch } from '$lib/subscriptions/client.js';
	import { classifyUrgency } from '$lib/subscriptions/summary.js';
	import type { CalendarDate, PaymentPage } from '$lib/subscriptions/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	let renewalOpen = $state(false);
	let renewalTrigger = $state<HTMLElement | null>(null);
	let today = $state<CalendarDate | null>(null);
	let urgency = $derived(
		today
			? classifyUrgency(
					data.subscription.currentPeriodEnd,
					today,
					data.subscription.alertDays,
					data.subscription.renewsAutomatically,
					data.subscription.status
				)
			: null
	);

	onMount(() => {
		today = deviceLocalToday();

		function refreshLocalDate() {
			if (document.visibilityState !== 'visible') return;
			const nextToday = deviceLocalToday();
			if (today !== nextToday) today = nextToday;
		}

		document.addEventListener('visibilitychange', refreshLocalDate);
		return () => document.removeEventListener('visibilitychange', refreshLocalDate);
	});

	const href = (path: string) => localizedHref(path, page.data.lang ?? 'th');
	const identity = () =>
		data.subscription.platform?.name ??
		data.subscription.customPlatformName ??
		data.subscription.planName ??
		'—';
	const initials = () =>
		identity()
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	const cycleLabel = () => {
		const unit =
			data.subscription.billingUnit === 'DAY'
				? m.subscriptions_billing_day()
				: data.subscription.billingUnit === 'YEAR'
					? m.subscriptions_billing_year()
					: m.subscriptions_billing_month();
		return `${data.subscription.billingInterval} ${unit}`;
	};
	const expiryLabel = () => {
		if (!urgency) return '';
		if (urgency.state === 'EXPIRED') return m.subscriptions_expired();
		if (urgency.state === 'DUE_TODAY') return m.subscriptions_due_today();
		return m.subscriptions_days_remaining({ days: urgency.daysRemaining });
	};
	const seriesTitle = (series: (typeof data.subscription.relatedSeries)[number]) =>
		page.data.lang === 'en'
			? (series.titleEn ?? series.titleTh ?? '—')
			: (series.titleTh ?? series.titleEn ?? '—');

	function openRenewal(trigger: HTMLElement) {
		renewalTrigger = trigger;
		renewalOpen = true;
	}

	function closeRenewal() {
		renewalOpen = false;
	}

	async function reloadPayments(): Promise<PaymentPage> {
		const paymentPage = await subscriptionFetch<PaymentPage>(
			`/api/subscriptions/${data.subscription.id}/payments`
		);
		await invalidateAll();
		return paymentPage;
	}

	async function refreshDetail() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{identity()} · {m.subscriptions_title()} · GL Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto grid w-full max-w-6xl gap-6 pb-24 pt-5 sm:gap-8 sm:pt-8 md:pb-12">
	<a
		class="touch-target inline-flex w-fit items-center border border-[var(--orbit-line)] bg-white px-4 text-sm text-plum"
		href={href('/subscriptions')}
	>
		← {m.subscriptions_back()}
	</a>

	<section class="border border-[var(--orbit-line)] bg-white">
		<header class="grid gap-5 border-b border-[var(--orbit-line)] p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-7">
			<div class="flex min-w-0 items-start gap-4">
				{#if data.subscription.platform?.logoUrl}
					<img
						src={data.subscription.platform.logoUrl}
						alt=""
						class="h-16 w-16 shrink-0 border border-[var(--orbit-line)] object-cover"
					/>
				{:else}
					<div class="grid h-16 w-16 shrink-0 place-items-center border border-[var(--orbit-line)] bg-lavender/15 font-display text-lg">
						{initials()}
					</div>
				{/if}
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-coral">{m.subscriptions_overview()}</p>
					<h1 class="mt-2 break-words font-display text-3xl text-plum sm:text-4xl">{identity()}</h1>
					{#if data.subscription.planName}<p class="mt-2 text-plum/75">{data.subscription.planName}</p>{/if}
					{#if data.subscription.accountLabel}<p class="mt-1 text-sm text-plum/55">{data.subscription.accountLabel}</p>{/if}
				</div>
			</div>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-1">
				{#if data.subscription.status === 'ACTIVE'}
					<button
						type="button"
						class="touch-target border border-coral bg-coral px-5 font-semibold text-white"
						onclick={(event) => openRenewal(event.currentTarget)}
					>
						{m.subscriptions_renew()}
					</button>
				{/if}
				<a
					class="touch-target inline-flex items-center justify-center border border-plum/25 px-5 font-semibold text-plum"
					href={href(`/subscriptions/${data.subscription.id}/edit`)}
				>
					{m.subscriptions_edit()}
				</a>
			</div>
		</header>

		<div class="grid gap-px bg-[var(--orbit-line)] sm:grid-cols-2 lg:grid-cols-4">
			<div class="bg-white p-5">
				<p class="text-xs text-plum/55">{m.subscriptions_amount()}</p>
				<p class="mt-2 font-display text-xl text-plum">{data.subscription.currency} {data.subscription.amount}</p>
				<p class="mt-1 text-sm text-plum/60">{cycleLabel()}</p>
			</div>
			<div class="bg-white p-5">
				<p class="text-xs text-plum/55">{m.subscriptions_status()}</p>
				<p class="mt-2 font-semibold text-plum">
					{data.subscription.status === 'ACTIVE'
						? m.subscriptions_status_active()
						: m.subscriptions_status_canceled()}
				</p>
			</div>
			<div class="bg-white p-5">
				<p class="text-xs text-plum/55">{m.subscriptions_service_period()}</p>
				<p class="mt-2 font-medium text-plum">
					{data.subscription.currentPeriodStart} – {data.subscription.currentPeriodEnd}
				</p>
			</div>
			<div class="bg-cream p-5">
				<p class="text-xs text-plum/55">{m.subscriptions_period_end()}</p>
				{#if urgency}
					<p class="mt-2 font-semibold text-coral">{expiryLabel()}</p>
				{:else}
					<div class="mt-2 h-6 w-28 animate-pulse bg-lavender/25" aria-busy="true">
						<span class="sr-only">{m.subscriptions_loading()}</span>
					</div>
				{/if}
			</div>
		</div>
	</section>

	{#if data.subscription.platform}
		<section class="border border-[var(--orbit-line)] bg-white p-5 sm:p-7">
			<h2 class="font-display text-2xl text-plum">{m.subscriptions_related_series()}</h2>
			{#if data.subscription.relatedSeries.length > 0}
				<div class="mt-5 grid grid-cols-2 gap-px bg-[var(--orbit-line)] sm:grid-cols-3 lg:grid-cols-5">
					{#each data.subscription.relatedSeries as series (series.id)}
						<a class="group bg-white p-3 focus-visible:outline-2 focus-visible:outline-coral" href={href(`/series/${series.id}`)}>
							{#if series.posterUrl}
								<img src={series.posterUrl} alt="" class="aspect-[2/3] w-full object-cover" loading="lazy" />
							{:else}
								<div class="grid aspect-[2/3] w-full place-items-center bg-lavender/15 font-display text-2xl text-plum/50">
									GL
								</div>
							{/if}
							<h3 class="mt-3 break-words font-display text-sm text-plum group-hover:text-coral sm:text-base">
								{seriesTitle(series)}
							</h3>
						</a>
					{/each}
				</div>
			{:else}
				<p class="mt-4 text-sm text-plum/60">{m.subscriptions_no_related_series()}</p>
			{/if}
		</section>
	{/if}

	<PaymentHistory
		subscriptionId={data.subscription.id}
		page={data.subscription.payments}
		currencies={data.currencies}
		onChanged={reloadPayments}
	/>
</main>

<RenewalDialog
	subscription={data.subscription}
	currencies={data.currencies}
	open={renewalOpen}
	returnFocusTo={renewalTrigger}
	onClose={closeRenewal}
	onRenewed={async () => {
		await refreshDetail();
		closeRenewal();
	}}
	onConflict={refreshDetail}
/>
