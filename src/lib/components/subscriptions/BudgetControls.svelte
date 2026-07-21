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

	let selectedCurrency = $state('');
	let monthlyLimit = $state('');
	let warningPercent = $state(80);
	let pendingKey = $state<string | null>(null);
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, FieldErrorCode[]>>({});
	const activeCodes = $derived(new Set(currencies.map((item) => item.code)));
	const selectedBudget = $derived(
		budgets.find((item) => item.currency === selectedCurrency) ?? null
	);

	onMount(() => {
		selectedCurrency =
			budgets[0]?.currency ??
			selectSuggestedCurrency(currencies, {
			stored: readCurrencyPreference(),
			locale: navigator.language,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
			});
	});

	$effect(() => {
		const budget = budgets.find((item) => item.currency === selectedCurrency);
		monthlyLimit = budget?.monthlyLimit ?? '';
		warningPercent = budget?.warningPercent ?? 80;
		error = null;
		fieldErrors = {};
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

	async function saveBudget() {
		if (pendingKey) return;
		const currency = selectedCurrency.trim().toUpperCase();
		if (!activeCodes.has(currency)) return;
		pendingKey = currency;
		error = null;
		fieldErrors = {};
		try {
			await request(`/api/subscription-budgets/${encodeURIComponent(currency)}`, {
				method: 'PUT',
				body: JSON.stringify({ monthlyLimit, warningPercent })
			});
			await onChanged();
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
</script>

<details class="group border border-[var(--orbit-line)] bg-[var(--orbit-surface)]">
	<summary class="touch-target flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orbit-coral)] sm:px-5 [&::-webkit-details-marker]:hidden">
		<span class="font-display text-lg text-[var(--orbit-ink)]">{m.subscriptions_budget_title()}</span>
		<span class="flex items-center gap-3">
			<span class="text-xs font-bold tracking-wider text-[var(--orbit-muted)]">{budgets.length}</span>
			<svg class="h-4 w-4 text-[var(--orbit-muted)] transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</span>
	</summary>
	<div class="border-t border-[var(--orbit-line)]">
	{#if error}<p class="m-4 border border-[var(--orbit-coral)] bg-[var(--orbit-coral-soft)] p-3 text-sm text-[var(--orbit-ink)]" role="alert">{error}</p>{/if}

		<form
			class="grid gap-3 p-4 md:grid-cols-[8rem_1fr_9rem_auto] md:items-end sm:p-5"
			onsubmit={(event) => {
				event.preventDefault();
				void saveBudget();
			}}
		>
			<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">
				<span>{m.subscriptions_currency()}</span>
				<CurrencySelect
					id="budget-currency"
					bind:value={selectedCurrency}
					{currencies}
					legacyCode={selectedBudget && !activeCodes.has(selectedCurrency) ? selectedCurrency : null}
					invalid={Boolean(fieldErrors.currency)}
					describedBy={fieldMessage('currency') ? 'budget-currency-error' : undefined}
				/>
				{#if fieldMessage('currency')}<span id="budget-currency-error" class="text-xs text-coral">{fieldMessage('currency')}</span>{/if}
			</label>
			<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">
				<span>{m.subscriptions_budget_limit()}</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={monthlyLimit}
					class="touch-target border border-[var(--orbit-line-strong)] bg-[var(--orbit-surface)] px-3 text-[var(--orbit-ink)] outline-none focus:border-[var(--orbit-coral)] focus:ring-2 focus:ring-[var(--orbit-coral-soft)]"
					aria-invalid={fieldErrors.monthlyLimit ? 'true' : undefined}
					disabled={!activeCodes.has(selectedCurrency)}
				/>
			</label>
			<label class="grid gap-1 text-sm text-[var(--orbit-ink)]">
				<span>{m.subscriptions_budget_warning_percent()}</span>
				<input
					type="number"
					min="1"
					max="100"
					bind:value={warningPercent}
					class="touch-target border border-[var(--orbit-line-strong)] bg-[var(--orbit-surface)] px-3 text-[var(--orbit-ink)] outline-none focus:border-[var(--orbit-coral)] focus:ring-2 focus:ring-[var(--orbit-coral-soft)]"
					aria-invalid={fieldErrors.warningPercent ? 'true' : undefined}
					disabled={!activeCodes.has(selectedCurrency)}
				/>
			</label>
			<div class="grid grid-cols-2 gap-2 md:grid-cols-1">
				<button
					type="submit"
					class="touch-target border border-[var(--orbit-coral-dark)] bg-[var(--orbit-coral)] px-3 text-sm font-semibold text-white hover:bg-[var(--orbit-coral-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orbit-coral)] disabled:opacity-50"
					disabled={pendingKey !== null || !activeCodes.has(selectedCurrency)}
				>
					{pendingKey === selectedCurrency
						? m.subscriptions_saving()
						: selectedBudget
							? m.subscriptions_budget_save()
							: m.subscriptions_budget_add()}
				</button>
				{#if selectedBudget}
					<button
						type="button"
						class="touch-target border border-[var(--orbit-coral)] px-3 text-sm text-[var(--orbit-coral)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orbit-coral)] disabled:opacity-50"
						disabled={pendingKey !== null}
						onclick={() => void remove(selectedCurrency)}
					>
						{m.subscriptions_budget_delete()}
					</button>
				{/if}
			</div>
		</form>
	</div>
</details>
