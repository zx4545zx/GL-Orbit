<script lang="ts">
	import { page } from '$app/state';
	import { rememberCurrencyPreference } from '$lib/subscriptions/currency.js';
	import type { CurrencyOption } from '$lib/subscriptions/types.js';

	let {
		id,
		value = $bindable(),
		currencies,
		disabled = false,
		required = true,
		invalid = false,
		describedBy,
		legacyCode = null
	}: {
		id: string;
		value: string;
		currencies: CurrencyOption[];
		disabled?: boolean;
		required?: boolean;
		invalid?: boolean;
		describedBy?: string;
		legacyCode?: string | null;
	} = $props();

	const optionLabel = (item: CurrencyOption) =>
		`${page.data.lang === 'en' ? item.nameEn : item.nameTh} (${item.code})`;
</script>

<select
	{id}
	bind:value
	{disabled}
	{required}
	aria-invalid={invalid ? 'true' : undefined}
	aria-describedby={describedBy}
	onchange={() => rememberCurrencyPreference(value)}
	class="touch-target w-full rounded-none border border-[var(--orbit-line-strong)] bg-white px-3 outline-none focus:border-coral focus:ring-2 focus:ring-coral/25"
>
	{#if legacyCode && !currencies.some((item) => item.code === legacyCode)}
		<option value={legacyCode} disabled>{legacyCode}</option>
	{/if}
	{#each currencies as item (item.code)}
		<option value={item.code}>{optionLabel(item)}</option>
	{/each}
</select>
