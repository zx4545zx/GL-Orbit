<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
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
		CalendarDate,
		CurrencyOption,
		FieldErrorCode,
		PaymentItem,
		PaymentPage
	} from '$lib/subscriptions/types.js';
	import CurrencySelect from './CurrencySelect.svelte';

	type Request = (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>;
	type Draft = {
		amount: string;
		currency: string;
		paidDate: CalendarDate | '';
		servicePeriodStart: CalendarDate | '';
		servicePeriodEnd: CalendarDate | '';
	};

	let {
		subscriptionId,
		page,
		currencies = [],
		request = subscriptionFetch,
		onChanged
	}: {
		subscriptionId: string;
		page: PaymentPage;
		currencies?: CurrencyOption[];
		request?: Request;
		onChanged: () => Promise<PaymentPage>;
	} = $props();

	let items = $state(untrack(() => page.items));
	let nextCursor = $state<string | null>(untrack(() => page.nextCursor));
	let lastIncomingPage = untrack(() => page);
	let pendingKey = $state<string | null>(null);
	let errorText = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});
	let editorOpen = $state(false);
	let editingId = $state<string | null>(null);
	let deleteArmedId = $state<string | null>(null);
	let reverseArmedId = $state<string | null>(null);
	let localToday = $state<CalendarDate | null>(null);
	let createOperationId = $state<string | null>(null);
	let createWriteConfirmed = $state(false);
	let draft = $state<Draft>({
		amount: '',
		currency: '',
		paidDate: '',
		servicePeriodStart: '',
		servicePeriodEnd: ''
	});

	onMount(() => {
		seedDraftDates();
		if (!draft.currency) draft.currency = suggestedCurrency();
	});

	$effect(() => {
		const incoming = page;
		if (incoming === lastIncomingPage) return;
		lastIncomingPage = incoming;
		items = incoming.items;
		nextCursor = incoming.nextCursor;
	});

	const fieldMessage = (field: string) =>
		fieldErrors[field]?.map(subscriptionFieldErrorMessage).join(' · ') ?? null;

	function seedDraftDates() {
		const today = deviceLocalToday();
		localToday = today;
		draft = {
			...draft,
			paidDate: draft.paidDate || today,
			servicePeriodStart: draft.servicePeriodStart || today,
			servicePeriodEnd: draft.servicePeriodEnd || today
		};
	}

	function suggestedCurrency() {
		return selectSuggestedCurrency(currencies, {
			stored: readCurrencyPreference(),
			locale: navigator.language,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
	}

	function resetDraft() {
		const today = deviceLocalToday();
		draft = {
			amount: '',
			currency: suggestedCurrency(),
			paidDate: today,
			servicePeriodStart: today,
			servicePeriodEnd: today
		};
	}

	function captureError(caught: unknown) {
		if (caught instanceof SubscriptionApiRequestError) {
			errorText = subscriptionErrorMessage(caught);
			fieldErrors = caught.fieldErrors;
			return;
		}
		errorText = m.subscriptions_error_internal();
		fieldErrors = {};
	}

	async function replaceFromServer() {
		const fresh = await onChanged();
		items = fresh.items;
		nextCursor = fresh.nextCursor;
	}

	async function run(key: string, operation: () => Promise<unknown>) {
		if (pendingKey) return;
		pendingKey = key;
		errorText = null;
		fieldErrors = {};
		try {
			await operation();
			await replaceFromServer();
			editingId = null;
			editorOpen = false;
			deleteArmedId = null;
			reverseArmedId = null;
			resetDraft();
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}

	function paymentBody(operationId?: string) {
		return JSON.stringify({
			...(operationId ? { operationId } : {}),
			amount: draft.amount,
			currency: draft.currency,
			paidDate: draft.paidDate,
			servicePeriodStart: draft.servicePeriodStart,
			servicePeriodEnd: draft.servicePeriodEnd
		});
	}

	function openCreate() {
		if (pendingKey) return;
		editingId = null;
		editorOpen = !editorOpen;
		errorText = null;
		fieldErrors = {};
		if (editorOpen) resetDraft();
		if (editorOpen) {
			createOperationId = null;
			createWriteConfirmed = false;
		}
	}

	function openEdit(item: PaymentItem) {
		if (pendingKey) return;
		editingId = item.id;
		editorOpen = true;
		errorText = null;
		fieldErrors = {};
		draft = {
			amount: item.amount,
			currency: item.currency,
			paidDate: item.paidDate,
			servicePeriodStart: item.servicePeriodStart,
			servicePeriodEnd: item.servicePeriodEnd
		};
	}

	async function savePayment() {
		if (!draft.paidDate || !draft.servicePeriodStart || !draft.servicePeriodEnd) return;
		if (localToday && compareCalendarDates(draft.paidDate, localToday) > 0) {
			fieldErrors = { paidDate: ['future_date'] };
			errorText = m.subscriptions_form_invalid();
			return;
		}
		if (editingId) {
			await run(`EDIT:${editingId}`, () =>
				request(`/api/subscription-payments/${editingId}`, {
					method: 'PATCH',
					body: paymentBody()
				})
			);
			return;
		}
		if (pendingKey) return;
		pendingKey = 'CREATE';
		errorText = null;
		fieldErrors = {};
		try {
			if (!createWriteConfirmed) {
				createOperationId ??= crypto.randomUUID();
				await request(`/api/subscriptions/${subscriptionId}/payments`, {
					method: 'POST',
					body: paymentBody(createOperationId)
				});
				createWriteConfirmed = true;
			}
			await replaceFromServer();
			createOperationId = null;
			createWriteConfirmed = false;
			editorOpen = false;
			resetDraft();
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}

	function deletePayment(item: PaymentItem) {
		if (pendingKey) return;
		if (deleteArmedId !== item.id) {
			deleteArmedId = item.id;
			reverseArmedId = null;
			return;
		}
		void run(`DELETE:${item.id}`, () =>
			request(`/api/subscription-payments/${item.id}`, { method: 'DELETE' })
		);
	}

	function reversePayment(item: PaymentItem) {
		if (pendingKey) return;
		if (reverseArmedId !== item.id) {
			reverseArmedId = item.id;
			deleteArmedId = null;
			return;
		}
		void run(`REVERSE:${item.id}`, () =>
			request(`/api/subscriptions/${subscriptionId}/reverse-latest-renewal`, {
				method: 'POST',
				body: JSON.stringify({ paymentId: item.id })
			})
		);
	}

	async function loadMore() {
		if (pendingKey || !nextCursor) return;
		pendingKey = 'LOAD_MORE';
		errorText = null;
		fieldErrors = {};
		try {
			const loaded = (await request(
				`/api/subscriptions/${subscriptionId}/payments?cursor=${encodeURIComponent(nextCursor)}`
			)) as PaymentPage;
			const known = new Set(items.map((item) => item.id));
			items = [...items, ...loaded.items.filter((item) => !known.has(item.id))];
			nextCursor = loaded.nextCursor;
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}

	function kindLabel(kind: PaymentItem['kind']) {
		if (kind === 'INITIAL') return m.subscriptions_payment_initial();
		if (kind === 'RENEWAL') return m.subscriptions_payment_renewal();
		return m.subscriptions_payment_manual();
	}
</script>

<section class="border border-[var(--orbit-line)] bg-white" aria-labelledby="payment-history-title">
	<header class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--orbit-line)] p-4 sm:p-5">
		<div>
			<p class="text-xs font-bold uppercase tracking-[0.16em] text-coral">{m.subscriptions_paid_date()}</p>
			<h2 id="payment-history-title" class="mt-1 font-display text-2xl text-plum">
				{m.subscriptions_payment_history()}
			</h2>
		</div>
		<button
			type="button"
			class="touch-target border border-plum bg-plum px-4 font-semibold text-white disabled:opacity-50"
			disabled={pendingKey !== null}
			onclick={openCreate}
		>
			{editorOpen && !editingId ? m.subscriptions_cancel() : m.subscriptions_payment_add()}
		</button>
	</header>

	{#if editorOpen}
		<form
			class="grid gap-4 border-b border-[var(--orbit-line)] bg-cream/45 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5"
			onsubmit={(event) => {
				event.preventDefault();
				void savePayment();
			}}
		>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_amount()}</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={draft.amount}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.amount ? 'true' : undefined}
					required
				/>
				{#if fieldMessage('amount')}<span class="text-xs text-coral">{fieldMessage('amount')}</span>{/if}
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_currency()}</span>
				<CurrencySelect
					id="payment-currency"
					bind:value={draft.currency}
					{currencies}
					legacyCode={editingId ? draft.currency : currencies.length ? null : draft.currency}
					invalid={Boolean(fieldErrors.currency)}
					describedBy={fieldMessage('currency') ? 'payment-currency-error' : undefined}
				/>
				{#if fieldMessage('currency')}<span id="payment-currency-error" class="text-xs text-coral">{fieldMessage('currency')}</span>{/if}
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_paid_date()}</span>
				<input
					type="date"
					bind:value={draft.paidDate}
					max={localToday ?? undefined}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.paidDate ? 'true' : undefined}
					required
				/>
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_period_start()}</span>
				<input
					type="date"
					bind:value={draft.servicePeriodStart}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.servicePeriodStart ? 'true' : undefined}
					required
				/>
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_period_end()}</span>
				<input
					type="date"
					bind:value={draft.servicePeriodEnd}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.servicePeriodEnd ? 'true' : undefined}
					required
				/>
			</label>
			<div class="flex gap-2 sm:col-span-2 lg:col-span-5">
				<button
					type="submit"
					class="touch-target border border-coral bg-coral px-5 font-semibold text-white disabled:opacity-50"
					disabled={pendingKey !== null || !draft.paidDate || !draft.servicePeriodStart || !draft.servicePeriodEnd}
				>
					{pendingKey ? m.subscriptions_saving() : m.subscriptions_payment_save()}
				</button>
				{#if editingId}
					<button
						type="button"
						class="touch-target border border-plum/25 px-4"
						disabled={pendingKey !== null}
						onclick={() => {
							editingId = null;
							editorOpen = false;
						}}
					>
						{m.subscriptions_cancel()}
					</button>
				{/if}
			</div>
		</form>
	{/if}

	{#if errorText}
		<p class="m-4 border border-coral/40 bg-coral/10 p-3 text-sm text-plum" role="alert">
			{errorText}
		</p>
	{/if}

	<div class="grid" aria-busy={pendingKey !== null}>
		{#if items.length === 0}
			<p class="p-6 text-sm text-plum/60">{m.subscriptions_no_payments()}</p>
		{:else}
			{#each items as item (item.id)}
				<article
					data-testid={`payment-row-${item.id}`}
					class="grid gap-3 border-b border-[var(--orbit-line)] p-4 last:border-b-0 sm:p-5 lg:grid-cols-[8rem_1fr_1fr_auto] lg:items-center"
				>
					<div>
						<p class="text-xs font-bold uppercase tracking-[0.12em] text-coral">{kindLabel(item.kind)}</p>
						<p class="mt-1 font-display text-lg text-plum">{item.currency} {item.amount}</p>
					</div>
					<div class="text-sm">
						<p class="text-plum/55">{m.subscriptions_paid_date()}</p>
						<p class="mt-1 font-medium text-plum">{item.paidDate}</p>
					</div>
					<div class="text-sm">
						<p class="text-plum/55">{m.subscriptions_service_period()}</p>
						<p class="mt-1 font-medium text-plum">{item.servicePeriodStart} – {item.servicePeriodEnd}</p>
					</div>
					<div class="grid min-w-48 gap-2 sm:grid-cols-2 lg:grid-cols-1">
						{#if item.canEdit}
							<button
								type="button"
								class="touch-target border border-plum/25 px-3 text-sm disabled:opacity-50"
								disabled={pendingKey !== null}
								onclick={() => openEdit(item)}
							>
								{m.subscriptions_payment_edit()}
							</button>
						{/if}
						{#if item.canDelete}
							<button
								type="button"
								class="touch-target border border-coral/50 px-3 text-sm text-coral disabled:opacity-50"
								disabled={pendingKey !== null}
								onclick={() => deletePayment(item)}
							>
								{deleteArmedId === item.id
									? m.subscriptions_payment_confirm_delete()
									: m.subscriptions_payment_delete()}
							</button>
						{/if}
						{#if item.kind === 'RENEWAL'}
							<p class="text-xs text-plum/55 sm:col-span-2 lg:col-span-1">
								{m.subscriptions_payment_locked()}
							</p>
							{#if item.canReverse}
								<button
									type="button"
									class="touch-target border border-coral/60 px-3 text-sm text-coral disabled:opacity-50"
									disabled={pendingKey !== null}
									onclick={() => reversePayment(item)}
								>
									{reverseArmedId === item.id
										? m.subscriptions_reverse_confirm()
										: m.subscriptions_reverse_renewal()}
								</button>
							{/if}
						{/if}
					</div>
				</article>
			{/each}
		{/if}
	</div>

	{#if nextCursor}
		<div class="border-t border-[var(--orbit-line)] p-4 text-center" aria-busy={pendingKey === 'LOAD_MORE'}>
			<button
				type="button"
				class="touch-target border border-plum px-5 text-sm text-plum disabled:opacity-50"
				disabled={pendingKey !== null}
				onclick={() => void loadMore()}
			>
				{pendingKey === 'LOAD_MORE' ? m.subscriptions_loading() : m.subscriptions_load_more()}
			</button>
		</div>
	{/if}
</section>
