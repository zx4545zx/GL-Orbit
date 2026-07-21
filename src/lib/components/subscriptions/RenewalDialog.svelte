<script lang="ts">
	import { tick } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { compareCalendarDates } from '$lib/subscriptions/calendar.js';
	import {
		deviceLocalToday,
		subscriptionErrorMessage,
		subscriptionFetch,
		subscriptionFieldErrorMessage,
		SubscriptionApiRequestError
	} from '$lib/subscriptions/client.js';
	import type {
		CalendarDate,
		CurrencyOption,
		FieldErrorCode,
		SubscriptionListItem
	} from '$lib/subscriptions/types.js';
	import CurrencySelect from './CurrencySelect.svelte';
	type Request = (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>;

	let {
		subscription,
		open,
		returnFocusTo,
		currencies = [],
		onClose,
		onRenewed,
		onConflict,
		request = subscriptionFetch
	}: {
		subscription: SubscriptionListItem | null;
		open: boolean;
		returnFocusTo: HTMLElement | null;
		currencies?: CurrencyOption[];
		onClose: () => void;
		onRenewed: () => Promise<void> | void;
		onConflict: () => Promise<void> | void;
		request?: Request;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let paidDateInput = $state<HTMLInputElement>();
	let initializedForId = $state<string | null>(null);
	let dismissed = $state(false);
	let focusTarget = $state<HTMLElement | null>(null);
	let paidDate = $state<CalendarDate | ''>('');
	let localToday = $state<CalendarDate | null>(null);
	let amount = $state('');
	let currency = $state('');
	let pending = $state(false);
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});

	$effect(() => {
		if (open && subscription && dialog && !dismissed) {
			if (!dialog.open) dialog.showModal();
			if (initializedForId !== subscription.id) {
				initializedForId = subscription.id;
				focusTarget = returnFocusTo;
				localToday = deviceLocalToday();
				paidDate = localToday;
				amount = subscription.amount;
				currency = subscription.currency;
				error = null;
				fieldErrors = {};
				void tick().then(() => paidDateInput?.focus());
			}
			return;
		}
		if ((!open || dismissed) && dialog?.open) dialog.close();
		if (!open) {
			initializedForId = null;
			dismissed = false;
		}
	});

	const fieldMessage = (field: string) =>
		fieldErrors[field]?.map(subscriptionFieldErrorMessage).join(' · ') ?? null;

	function restoreFocus() {
		const target = focusTarget;
		void tick().then(() => target?.focus());
	}

	function requestClose() {
		if (pending) return;
		initializedForId = null;
		dismissed = true;
		if (dialog?.open) dialog.close();
		onClose();
	}

	async function submit() {
		if (pending || !subscription || !paidDate) return;
		error = null;
		fieldErrors = {};
		if (localToday && compareCalendarDates(paidDate, localToday) > 0) {
			fieldErrors = { paidDate: ['future_date'] };
			error = m.subscriptions_form_invalid();
			await tick();
			paidDateInput?.focus();
			return;
		}
		pending = true;
		try {
			await request(`/api/subscriptions/${subscription.id}/renew`, {
				method: 'POST',
				body: JSON.stringify({
					expectedPeriodEnd: subscription.currentPeriodEnd,
					paidDate,
					amount,
					currency
				})
			});
			await onRenewed();
			pending = false;
			requestClose();
		} catch (caught) {
			if (caught instanceof SubscriptionApiRequestError) {
				fieldErrors = caught.fieldErrors;
				if (
					caught.code === 'RENEWAL_CONFLICT' ||
					caught.code === 'RENEWAL_ALREADY_RECORDED'
				) {
					error = m.subscriptions_renew_conflict();
					await onConflict();
				} else {
					error = subscriptionErrorMessage(caught);
				}
			} else {
				error = m.subscriptions_error_internal();
			}
			pending = false;
		}
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="subscription-renewal-title"
	class="m-auto w-[min(94vw,36rem)] border border-[var(--orbit-line-strong)] bg-white p-0 text-plum backdrop:bg-plum/55"
	onclose={restoreFocus}
	oncancel={(event) => {
		event.preventDefault();
		requestClose();
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			requestClose();
		}
	}}
>
	{#if subscription}
		<form
			class="grid gap-5 p-5 sm:p-7"
			onsubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<header>
				<p class="text-xs font-bold uppercase tracking-[0.16em] text-coral">
					{subscription.platform?.name ?? subscription.customPlatformName}
				</p>
				<h2 id="subscription-renewal-title" class="mt-1 font-display text-2xl">
					{m.subscriptions_renew_title()}
				</h2>
				<p class="mt-2 text-sm text-plum/65">{m.subscriptions_renew_effect()}</p>
			</header>

			<div class="grid gap-px bg-[var(--orbit-line)] sm:grid-cols-2">
				<div class="bg-cream p-3">
					<p class="text-xs text-plum/55">{m.subscriptions_period_start()} – {m.subscriptions_period_end()}</p>
					<p class="mt-1 font-medium">{subscription.currentPeriodStart} – {subscription.currentPeriodEnd}</p>
				</div>
				<div class="bg-mint/10 p-3">
					<p class="text-xs text-plum/55">{m.subscriptions_renew_title()}</p>
					<p class="mt-1 font-medium">{subscription.nextPeriod.start} – {subscription.nextPeriod.end}</p>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<label class="grid gap-1 text-sm">
					<span>{m.subscriptions_paid_date()}</span>
					<input
						bind:this={paidDateInput}
						type="date"
						bind:value={paidDate}
						max={localToday ?? undefined}
						class="touch-target border border-[var(--orbit-line-strong)] px-3"
						aria-invalid={fieldErrors.paidDate ? 'true' : undefined}
						required
					/>
					{#if fieldMessage('paidDate')}<span class="text-xs text-coral">{fieldMessage('paidDate')}</span>{/if}
				</label>
				<label class="grid gap-1 text-sm">
					<span>{m.subscriptions_amount()}</span>
					<input
						type="text"
						inputmode="decimal"
						bind:value={amount}
						class="touch-target border border-[var(--orbit-line-strong)] px-3"
						aria-invalid={fieldErrors.amount ? 'true' : undefined}
						required
					/>
					{#if fieldMessage('amount')}<span class="text-xs text-coral">{fieldMessage('amount')}</span>{/if}
				</label>
				<label class="grid gap-1 text-sm sm:col-span-2">
					<span>{m.subscriptions_currency()}</span>
					<CurrencySelect
						id="renewal-currency"
						bind:value={currency}
						{currencies}
						legacyCode={subscription.currency}
						invalid={Boolean(fieldErrors.currency)}
						describedBy={fieldMessage('currency') ? 'renewal-currency-error' : undefined}
					/>
					{#if fieldMessage('currency')}<span id="renewal-currency-error" class="text-xs text-coral">{fieldMessage('currency')}</span>{/if}
				</label>
			</div>

			{#if error}<p class="border border-coral/40 bg-coral/10 p-3 text-sm" role="alert">{error}</p>{/if}

			<footer class="grid grid-cols-2 gap-2">
				<button
					type="button"
					class="touch-target border border-plum/25 px-4 disabled:opacity-50"
					disabled={pending}
					onclick={requestClose}
				>
					{m.subscriptions_cancel()}
				</button>
				<button
					type="submit"
					class="touch-target border border-coral bg-coral px-4 font-semibold text-white disabled:opacity-50"
					disabled={pending}
				>
					{pending ? m.subscriptions_saving() : m.subscriptions_renew_confirm()}
				</button>
			</footer>
		</form>
	{/if}
</dialog>
