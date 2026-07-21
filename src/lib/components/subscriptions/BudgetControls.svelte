<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { readCurrencyPreference, selectSuggestedCurrency } from '$lib/subscriptions/currency.js';
	import {
		subscriptionErrorMessage,
		subscriptionFetch,
		subscriptionFieldErrorMessage,
		SubscriptionApiRequestError
	} from '$lib/subscriptions/client.js';
	import type { CurrencyOption, FieldErrorCode } from '$lib/subscriptions/types.js';
	import CurrencySelect from './CurrencySelect.svelte';

	type Budget = { currency: string; monthlyLimit: string; warningPercent: number };
	type Draft = { monthlyLimit: string; warningPercent: number };
	type Request = (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>;

	let {
		budgets,
		currencies = [],
		request = subscriptionFetch,
		onChanged
	}: {
		budgets: Budget[];
		currencies?: CurrencyOption[];
		request?: Request;
		onChanged: () => Promise<void> | void;
	} = $props();

	let drafts = $state<Record<string, Partial<Draft>>>({});
	let newCurrency = $state('');
	let newMonthlyLimit = $state('');
	let newWarningPercent = $state(80);
	let pendingKey = $state<string | null>(null);
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});
	const activeCodes = $derived(new Set(currencies.map((item) => item.code)));

	onMount(() => {
		newCurrency = selectSuggestedCurrency(currencies, {
			stored: readCurrencyPreference(),
			locale: navigator.language,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
	});

	const fieldMessage = (field: string) =>
		fieldErrors[field]?.map(subscriptionFieldErrorMessage).join(' · ') ?? null;

	function captureError(caught: unknown) {
		if (caught instanceof SubscriptionApiRequestError) {
			error = subscriptionErrorMessage(caught);
			fieldErrors = caught.fieldErrors;
			return;
		}
		error = m.subscriptions_error_internal();
		fieldErrors = {};
	}

	async function saveExisting(currency: string) {
		if (pendingKey) return;
		if (!activeCodes.has(currency)) return;
		const budget = budgets.find((item) => item.currency === currency);
		if (!budget) return;
		const draft = {
			monthlyLimit: drafts[currency]?.monthlyLimit ?? budget.monthlyLimit,
			warningPercent: drafts[currency]?.warningPercent ?? budget.warningPercent
		};
		pendingKey = currency;
		error = null;
		fieldErrors = {};
		try {
			await request(`/api/subscription-budgets/${encodeURIComponent(currency)}`, {
				method: 'PUT',
				body: JSON.stringify(draft)
			});
			await onChanged();
			delete drafts[currency];
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}

	async function remove(currency: string) {
		if (pendingKey) return;
		pendingKey = currency;
		error = null;
		fieldErrors = {};
		try {
			await request(`/api/subscription-budgets/${encodeURIComponent(currency)}`, {
				method: 'DELETE'
			});
			await onChanged();
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}

	async function createBudget() {
		if (pendingKey) return;
		const currency = newCurrency.trim().toUpperCase();
		pendingKey = 'NEW';
		error = null;
		fieldErrors = {};
		try {
			await request(`/api/subscription-budgets/${encodeURIComponent(currency)}`, {
				method: 'PUT',
				body: JSON.stringify({
					monthlyLimit: newMonthlyLimit,
					warningPercent: newWarningPercent
				})
			});
			await onChanged();
			newCurrency = selectSuggestedCurrency(currencies, {
				stored: readCurrencyPreference(),
				locale: navigator.language,
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
			});
			newMonthlyLimit = '';
			newWarningPercent = 80;
		} catch (caught) {
			captureError(caught);
		} finally {
			pendingKey = null;
		}
	}
</script>

<section class="border border-[var(--orbit-line)] bg-white p-5 sm:p-6">
	<h2 class="font-display text-xl text-plum">{m.subscriptions_budget_title()}</h2>
	{#if error}<p class="mt-3 border border-coral/40 bg-coral/10 p-3 text-sm" role="alert">{error}</p>{/if}

	<div class="mt-4 grid gap-3">
		{#each budgets as budget (budget.currency)}
			<form
				class="grid gap-3 border border-[var(--orbit-line)] p-4 md:grid-cols-[auto_1fr_9rem_auto] md:items-end"
				onsubmit={(event) => {
					event.preventDefault();
					void saveExisting(budget.currency);
				}}
			>
				<strong class="touch-target flex items-center">{budget.currency}</strong>
				<label class="grid gap-1 text-sm">
					<span>{m.subscriptions_budget_limit()} {budget.currency}</span>
					<input
						type="text"
						inputmode="decimal"
						value={drafts[budget.currency]?.monthlyLimit ?? budget.monthlyLimit}
						oninput={(event) => {
							drafts[budget.currency] = {
								...drafts[budget.currency],
								monthlyLimit: event.currentTarget.value
							};
						}}
					class="touch-target border border-[var(--orbit-line-strong)] px-3"
					aria-invalid={fieldErrors.monthlyLimit ? 'true' : undefined}
					disabled={!activeCodes.has(budget.currency)}
					/>
					{#if fieldMessage('monthlyLimit')}<span class="text-xs text-coral">{fieldMessage('monthlyLimit')}</span>{/if}
				</label>
				<label class="grid gap-1 text-sm">
					<span>{m.subscriptions_budget_warning_percent()} {budget.currency}</span>
					<input
						type="number"
						min="1"
						max="100"
						value={drafts[budget.currency]?.warningPercent ?? budget.warningPercent}
						oninput={(event) => {
							drafts[budget.currency] = {
								...drafts[budget.currency],
								warningPercent: event.currentTarget.valueAsNumber
							};
						}}
					class="touch-target border border-[var(--orbit-line-strong)] px-3"
					aria-invalid={fieldErrors.warningPercent ? 'true' : undefined}
					disabled={!activeCodes.has(budget.currency)}
					/>
				</label>
				<div class="grid grid-cols-2 gap-2 md:grid-cols-1">
					<button
						type="submit"
						class="touch-target border border-plum bg-plum px-3 text-sm text-white disabled:opacity-50"
						disabled={pendingKey !== null || !activeCodes.has(budget.currency)}
					>
						{pendingKey === budget.currency ? m.subscriptions_saving() : m.subscriptions_budget_save()}
					</button>
					<button
						type="button"
						class="touch-target border border-coral/50 px-3 text-sm text-coral disabled:opacity-50"
						disabled={pendingKey !== null}
						onclick={() => void remove(budget.currency)}
					>
						{m.subscriptions_budget_delete()}
					</button>
				</div>
			</form>
		{/each}

		<form
			class="grid gap-3 border border-dashed border-[var(--orbit-line-strong)] bg-mint/5 p-4 md:grid-cols-[8rem_1fr_9rem_auto] md:items-end"
			onsubmit={(event) => {
				event.preventDefault();
				void createBudget();
			}}
		>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_currency()}</span>
				<CurrencySelect
					id="budget-currency"
					bind:value={newCurrency}
					{currencies}
					legacyCode={currencies.length ? null : newCurrency}
					invalid={Boolean(fieldErrors.currency)}
					describedBy={fieldMessage('currency') ? 'budget-currency-error' : undefined}
				/>
				{#if fieldMessage('currency')}<span id="budget-currency-error" class="text-xs text-coral">{fieldMessage('currency')}</span>{/if}
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_budget_limit()}</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={newMonthlyLimit}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.monthlyLimit ? 'true' : undefined}
				/>
			</label>
			<label class="grid gap-1 text-sm">
				<span>{m.subscriptions_budget_warning_percent()}</span>
				<input
					type="number"
					min="1"
					max="100"
					bind:value={newWarningPercent}
					class="touch-target border border-[var(--orbit-line-strong)] bg-white px-3"
					aria-invalid={fieldErrors.warningPercent ? 'true' : undefined}
				/>
			</label>
			<button
				type="submit"
				class="touch-target border border-plum bg-plum px-3 text-sm text-white disabled:opacity-50"
				disabled={pendingKey !== null}
			>
				{pendingKey === 'NEW' ? m.subscriptions_saving() : m.subscriptions_budget_add()}
			</button>
		</form>
	</div>
</section>
