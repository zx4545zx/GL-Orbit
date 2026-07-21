<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import { compareCalendarDates } from '$lib/subscriptions/calendar.js';
	import { readCurrencyPreference, selectSuggestedCurrency } from '$lib/subscriptions/currency.js';
	import {
		deviceLocalToday,
		subscriptionErrorMessage,
		subscriptionFetch,
		subscriptionFieldErrorMessage,
		SubscriptionApiRequestError
	} from '$lib/subscriptions/client.js';
	import type {
		BillingUnit,
		CalendarDate,
		CurrencyOption,
		FieldErrorCode,
		PlatformOption,
		SubscriptionDetail,
		SubscriptionStatus
	} from '$lib/subscriptions/types.js';
	import CurrencySelect from './CurrencySelect.svelte';

	type Request = (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>;

	let {
		mode,
		platforms,
		currencies = [],
		subscription,
		request = subscriptionFetch,
		onSaved,
		onDelete
	}: {
		mode: 'create' | 'edit';
		platforms: PlatformOption[];
		currencies?: CurrencyOption[];
		subscription: SubscriptionDetail | null;
		request?: Request;
		onSaved: (id: string) => Promise<void> | void;
		onDelete?: () => Promise<void> | void;
	} = $props();

	let sourceMode = $state<'catalog' | 'custom'>(
		untrack(() => (subscription ? (subscription.platform ? 'catalog' : 'custom') : 'catalog'))
	);
	let platformId = $state(untrack(() => subscription?.platform?.id ?? ''));
	let customPlatformName = $state(untrack(() => subscription?.customPlatformName ?? ''));
	let planName = $state(untrack(() => subscription?.planName ?? ''));
	let accountLabel = $state(untrack(() => subscription?.accountLabel ?? ''));
	let amount = $state(untrack(() => subscription?.amount ?? ''));
	let currency = $state(untrack(() => subscription?.currency ?? ''));
	let billingUnit = $state<BillingUnit>(untrack(() => subscription?.billingUnit ?? 'MONTH'));
	let billingInterval = $state(untrack(() => subscription?.billingInterval ?? 1));
	let currentPeriodStart = $state<CalendarDate | ''>(
		untrack(() => subscription?.currentPeriodStart ?? '')
	);
	let currentPeriodEnd = $state<CalendarDate | ''>(
		untrack(() => subscription?.currentPeriodEnd ?? '')
	);
	let renewsAutomatically = $state(untrack(() => subscription?.renewsAutomatically ?? true));
	let status = $state<SubscriptionStatus>(untrack(() => subscription?.status ?? 'ACTIVE'));
	let alertDaysText = $state(untrack(() => (subscription?.alertDays ?? [7, 3, 1]).join(', ')));
	let recordInitialPayment = $state(false);
	let initialPaidDate = $state<CalendarDate | ''>('');
	let localToday = $state<CalendarDate | null>(null);
	let pending = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});
	let deleteArmed = $state(false);
	let alertDaysInput = $state<HTMLInputElement>();
	let initialPaidDateInput = $state<HTMLInputElement>();
	let createOperationId = $state<string | null>(null);
	let confirmedSavedId = $state<string | null>(null);

	const cancelHref = $derived(
		localizedHref(
			mode === 'edit' && subscription ? `/subscriptions/${subscription.id}` : '/subscriptions',
			page.data.lang ?? 'th'
		)
	);
	const fieldMessage = (field: string) =>
		fieldErrors[field]?.map(subscriptionFieldErrorMessage).join(' · ') ?? null;
	const fieldDescription = (field: string) =>
		fieldErrors[field]?.length ? `subscription-${field}-error` : undefined;

	onMount(() => {
		if (mode !== 'create') return;
		const today = deviceLocalToday();
		currency = selectSuggestedCurrency(currencies, {
			stored: readCurrencyPreference(),
			locale: navigator.language,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
		localToday = today;
		if (!currentPeriodStart) currentPeriodStart = today;
		if (!currentPeriodEnd) currentPeriodEnd = today;
		if (!initialPaidDate) initialPaidDate = today;
	});

	function chooseSource(next: 'catalog' | 'custom') {
		sourceMode = next;
		if (next === 'catalog') customPlatformName = '';
		else platformId = '';
		fieldErrors = { ...fieldErrors, platformId: [], customPlatformName: [] };
	}

	function parseAlertDaysDraft(): number[] | null {
		const trimmed = alertDaysText.trim();
		if (!trimmed) return [];
		const tokens = trimmed.split(',').map((value) => value.trim());
		if (tokens.some((value) => !/^-?\d+$/.test(value))) return null;
		return [...new Set(tokens.map(Number))].sort((a, b) => b - a);
	}

	function payload(alertDays: number[], operationId: string | null) {
		return {
			platformId: sourceMode === 'catalog' ? platformId || null : null,
			customPlatformName: sourceMode === 'custom' ? customPlatformName || null : null,
			planName: planName || null,
			accountLabel: accountLabel || null,
			amount,
			currency: currency.trim().toUpperCase(),
			billingUnit,
			billingInterval: Number(billingInterval),
			currentPeriodStart,
			currentPeriodEnd,
			renewsAutomatically,
			status,
			alertDays,
			...(mode === 'create'
				? {
						operationId,
						recordInitialPayment,
						initialPaidDate: recordInitialPayment ? initialPaidDate || null : null
					}
				: { expectedSchedule: subscription!.scheduleVersion })
		};
	}

	async function submit() {
		if (pending || !currentPeriodStart || !currentPeriodEnd) return;
		formError = null;
		fieldErrors = {};
		if (
			mode === 'create' &&
			recordInitialPayment &&
			initialPaidDate &&
			localToday &&
			compareCalendarDates(initialPaidDate, localToday) > 0
		) {
			fieldErrors = { initialPaidDate: ['future_date'] };
			formError = m.subscriptions_form_invalid();
			await tick();
			initialPaidDateInput?.focus();
			return;
		}
		const alertDays = parseAlertDaysDraft();
		if (alertDays === null) {
			fieldErrors = { alertDays: ['invalid'] };
			formError = m.subscriptions_form_invalid();
			await tick();
			alertDaysInput?.focus();
			return;
		}

		pending = true;
		try {
			if (!confirmedSavedId) {
				if (mode === 'create' && !createOperationId) createOperationId = crypto.randomUUID();
				const result = await request(
					mode === 'create' ? '/api/subscriptions' : `/api/subscriptions/${subscription!.id}`,
					{
						method: mode === 'create' ? 'POST' : 'PATCH',
						body: JSON.stringify(payload(alertDays, createOperationId))
					}
				);
				const id =
					result && typeof result === 'object' && typeof (result as { id?: unknown }).id === 'string'
						? (result as { id: string }).id
						: subscription?.id;
				if (!id) throw new Error('Subscription response omitted its id');
				confirmedSavedId = id;
			}
			await onSaved(confirmedSavedId);
		} catch (caught) {
			if (caught instanceof SubscriptionApiRequestError) {
				fieldErrors = caught.fieldErrors;
				formError = subscriptionErrorMessage(caught);
			} else {
				formError = m.subscriptions_error_internal();
			}
		} finally {
			pending = false;
		}
	}

	async function confirmDelete() {
		if (!deleteArmed) {
			deleteArmed = true;
			return;
		}
		if (pending || !onDelete) return;
		pending = true;
		formError = null;
		try {
			await onDelete();
		} catch (caught) {
			formError =
				caught instanceof SubscriptionApiRequestError
					? subscriptionErrorMessage(caught)
					: m.subscriptions_error_internal();
		} finally {
			pending = false;
		}
	}
</script>

<form
	class="grid gap-6"
	aria-busy={pending}
	onsubmit={(event) => {
		event.preventDefault();
		void submit();
	}}
>
	{#if formError}
		<p class="border border-coral/40 bg-coral/10 p-3 text-sm text-plum" role="alert">{formError}</p>
	{/if}

	<fieldset class="grid gap-4 border border-[var(--orbit-line)] p-4 sm:p-5">
		<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_platform()}</legend>
		<div class="grid gap-2 sm:grid-cols-2">
			<label class="touch-target flex items-center gap-3 border border-[var(--orbit-line)] px-3">
				<input
					type="radio"
					name="subscription-source"
					value="catalog"
					checked={sourceMode === 'catalog'}
					onchange={() => chooseSource('catalog')}
				/>
				<span>{m.subscriptions_platform_catalog()}</span>
			</label>
			<label class="touch-target flex items-center gap-3 border border-[var(--orbit-line)] px-3">
				<input
					type="radio"
					name="subscription-source"
					value="custom"
					checked={sourceMode === 'custom'}
					onchange={() => chooseSource('custom')}
				/>
				<span>{m.subscriptions_platform_custom()}</span>
			</label>
		</div>

		{#if sourceMode === 'catalog'}
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_platform()}</span>
				<select
					bind:value={platformId}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
					aria-invalid={fieldErrors.platformId?.length ? 'true' : undefined}
					aria-describedby={fieldDescription('platformId')}
					required
				>
					<option value="" disabled>{m.subscriptions_platform_catalog()}</option>
					{#each platforms as platform (platform.id)}
						<option value={platform.id}>{platform.name}</option>
					{/each}
				</select>
				{#if fieldMessage('platformId')}<span id="subscription-platformId-error" class="text-xs text-coral">{fieldMessage('platformId')}</span>{/if}
			</label>
		{:else}
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_custom_platform_name()}</span>
				<input
					type="text"
					maxlength="255"
					bind:value={customPlatformName}
					class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
					aria-invalid={fieldErrors.customPlatformName?.length ? 'true' : undefined}
					aria-describedby={fieldDescription('customPlatformName')}
					required
				/>
				{#if fieldMessage('customPlatformName')}<span id="subscription-customPlatformName-error" class="text-xs text-coral">{fieldMessage('customPlatformName')}</span>{/if}
			</label>
		{/if}
	</fieldset>

	<fieldset class="grid gap-4 border border-[var(--orbit-line)] p-4 sm:grid-cols-2 sm:p-5">
		<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_plan_name()}</legend>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_plan_name()}</span>
			<input
				type="text"
				maxlength="120"
				bind:value={planName}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.planName?.length ? 'true' : undefined}
			/>
			{#if fieldMessage('planName')}<span class="text-xs text-coral">{fieldMessage('planName')}</span>{/if}
		</label>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_account_label()}</span>
			<input
				type="text"
				maxlength="120"
				bind:value={accountLabel}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.accountLabel?.length ? 'true' : undefined}
			/>
			{#if fieldMessage('accountLabel')}<span class="text-xs text-coral">{fieldMessage('accountLabel')}</span>{/if}
		</label>
	</fieldset>

	<fieldset class="grid gap-4 border border-[var(--orbit-line)] p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
		<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_billing_cycle()}</legend>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_amount()}</span>
			<input
				type="text"
				inputmode="decimal"
				bind:value={amount}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.amount?.length ? 'true' : undefined}
				aria-describedby={fieldDescription('amount')}
				required
			/>
			{#if fieldMessage('amount')}<span id="subscription-amount-error" class="text-xs text-coral">{fieldMessage('amount')}</span>{/if}
		</label>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_currency()}</span>
			<CurrencySelect
				id="subscription-currency"
				bind:value={currency}
				{currencies}
				legacyCode={subscription?.currency ?? (currencies.length ? null : currency)}
				invalid={Boolean(fieldErrors.currency?.length)}
				describedBy={fieldDescription('currency')}
			/>
			{#if fieldMessage('currency')}<span id="subscription-currency-error" class="text-xs text-coral">{fieldMessage('currency')}</span>{/if}
		</label>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_billing_cycle()}</span>
			<input
				type="number"
				min="1"
				max={billingUnit === 'DAY' ? 365 : billingUnit === 'MONTH' ? 120 : 20}
				bind:value={billingInterval}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.billingInterval?.length ? 'true' : undefined}
				required
			/>
			{#if fieldMessage('billingInterval')}<span class="text-xs text-coral">{fieldMessage('billingInterval')}</span>{/if}
		</label>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_billing_cycle()}</span>
			<select
				bind:value={billingUnit}
				class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.billingUnit?.length ? 'true' : undefined}
			>
				<option value="DAY">{m.subscriptions_billing_day()}</option>
				<option value="MONTH">{m.subscriptions_billing_month()}</option>
				<option value="YEAR">{m.subscriptions_billing_year()}</option>
			</select>
		</label>
	</fieldset>

	<fieldset class="grid gap-4 border border-[var(--orbit-line)] p-4 sm:grid-cols-2 sm:p-5">
		<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_period_start()} – {m.subscriptions_period_end()}</legend>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_period_start()}</span>
			<input
				type="date"
				bind:value={currentPeriodStart}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.currentPeriodStart?.length ? 'true' : undefined}
				required
			/>
			{#if fieldMessage('currentPeriodStart')}<span class="text-xs text-coral">{fieldMessage('currentPeriodStart')}</span>{/if}
		</label>
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_period_end()}</span>
			<input
				type="date"
				bind:value={currentPeriodEnd}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.currentPeriodEnd?.length ? 'true' : undefined}
				required
			/>
			{#if fieldMessage('currentPeriodEnd')}<span class="text-xs text-coral">{fieldMessage('currentPeriodEnd')}</span>{/if}
		</label>
	</fieldset>

	<fieldset class="grid gap-4 border border-[var(--orbit-line)] p-4 sm:p-5">
		<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_status()}</legend>
		<label class="touch-target flex items-center gap-3 border border-[var(--orbit-line)] px-3">
			<input type="checkbox" bind:checked={renewsAutomatically} />
			<span>{m.subscriptions_auto_renew()}</span>
		</label>
		{#if mode === 'edit'}
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_status()}</span>
				<select
					bind:value={status}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
					aria-invalid={fieldErrors.status?.length ? 'true' : undefined}
				>
					<option value="ACTIVE">{m.subscriptions_status_active()}</option>
					<option value="CANCELED">{m.subscriptions_status_canceled()}</option>
				</select>
			</label>
		{/if}
		<label class="grid gap-1 text-sm">
			<span>{m.subscriptions_alert_days()}</span>
			<input
				bind:this={alertDaysInput}
				type="text"
				inputmode="numeric"
				bind:value={alertDaysText}
				class="touch-target border border-[var(--orbit-line-strong)] px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
				aria-invalid={fieldErrors.alertDays?.length ? 'true' : undefined}
				aria-describedby={fieldDescription('alertDays')}
			/>
			{#if fieldMessage('alertDays')}<span id="subscription-alertDays-error" class="text-xs text-coral">{fieldMessage('alertDays')}</span>{/if}
		</label>
	</fieldset>

	{#if mode === 'create'}
		<fieldset class="grid gap-4 border border-[var(--orbit-line)] bg-mint/5 p-4 sm:p-5">
			<legend class="px-2 font-display text-lg text-plum">{m.subscriptions_initial_payment()}</legend>
			<label class="touch-target flex items-center gap-3 border border-[var(--orbit-line)] bg-white px-3">
				<input type="checkbox" bind:checked={recordInitialPayment} />
				<span>{m.subscriptions_initial_payment()}</span>
			</label>
			{#if recordInitialPayment}
				<p class="text-sm text-plum/65">{m.subscriptions_actual_title()} · {m.subscriptions_initial_payment()}</p>
				<label class="grid gap-1 text-sm">
					<span>{m.subscriptions_paid_date()}</span>
					<input
						bind:this={initialPaidDateInput}
						type="date"
						bind:value={initialPaidDate}
						max={localToday ?? undefined}
						class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
						aria-invalid={fieldErrors.initialPaidDate?.length ? 'true' : undefined}
						required
					/>
					{#if fieldMessage('initialPaidDate')}<span class="text-xs text-coral">{fieldMessage('initialPaidDate')}</span>{/if}
				</label>
			{/if}
		</fieldset>
	{/if}

	<div class="grid gap-2 sm:grid-cols-2">
		<a
			class="touch-target inline-flex min-h-11 items-center justify-center border border-plum/20 px-4 font-semibold"
			href={cancelHref}
		>
			{m.subscriptions_cancel()}
		</a>
		<button
			type="submit"
			class="touch-target min-h-11 border border-coral bg-coral px-4 font-semibold text-white disabled:opacity-50"
			disabled={pending || !currentPeriodStart || !currentPeriodEnd}
		>
			{pending ? m.subscriptions_saving() : m.subscriptions_save()}
		</button>
	</div>

	{#if mode === 'edit'}
		<section class="border border-coral/40 bg-coral/5 p-4">
			<button
				type="button"
				class="touch-target min-h-11 w-full border border-coral px-4 font-semibold text-coral disabled:opacity-50"
				disabled={pending}
				onclick={() => void confirmDelete()}
			>
				{deleteArmed ? m.subscriptions_delete_confirm() : m.subscriptions_delete()}
			</button>
		</section>
	{/if}
</form>
