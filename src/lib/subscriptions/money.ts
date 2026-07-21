import type { CurrencyTotal } from './types.js';

const supportedCurrencies = new Set(Intl.supportedValuesOf('currency'));
const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;

export type MoneyParseFailure =
	| 'invalid'
	| 'fraction_digits'
	| 'unsupported_currency'
	| 'out_of_range';

export function normalizeCurrency(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const currency = value.trim().toUpperCase();
	return /^[A-Z]{3}$/.test(currency) && supportedCurrencies.has(currency) ? currency : null;
}

export function getCurrencyMinorUnits(value: unknown): number | null {
	const currency = normalizeCurrency(value);
	if (!currency) return null;
	return (
		Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
			.maximumFractionDigits ?? null
	);
}

export function parseMoney(
	value: unknown,
	currencyValue: unknown,
	options: { positive?: boolean } = {}
): { ok: true; value: string } | { ok: false; reason: MoneyParseFailure } {
	const currency = normalizeCurrency(currencyValue);
	if (!currency) return { ok: false, reason: 'unsupported_currency' };
	return parseMoneyWithMinorUnit(value, getCurrencyMinorUnits(currency)!, options);
}

export function parseMoneyWithMinorUnit(
	value: unknown,
	minorUnit: number,
	options: { positive?: boolean } = {}
): { ok: true; value: string } | { ok: false; reason: MoneyParseFailure } {
	if (typeof value !== 'string') return { ok: false, reason: 'invalid' };
	if (!Number.isInteger(minorUnit) || minorUnit < 0 || minorUnit > 4) {
		return { ok: false, reason: 'unsupported_currency' };
	}
	const match = DECIMAL_PATTERN.exec(value.trim());
	if (!match) return { ok: false, reason: 'invalid' };
	const integer = match[1].replace(/^0+(?=\d)/, '');
	const rawFraction = match[2] ?? '';
	if (rawFraction.length > minorUnit) {
		return { ok: false, reason: 'fraction_digits' };
	}
	if (integer.length > 14) return { ok: false, reason: 'out_of_range' };
	const fraction = rawFraction.replace(/0+$/, '');
	const canonical = fraction ? `${integer}.${fraction}` : integer;
	if (options.positive && toScaleFour(canonical) <= 0n) {
		return { ok: false, reason: 'out_of_range' };
	}
	return { ok: true, value: canonical };
}

export function parseMoneyCandidate(
	value: unknown,
	options: { positive?: boolean } = {}
): { ok: true; value: string } | { ok: false; reason: MoneyParseFailure } {
	if (typeof value !== 'string') return { ok: false, reason: 'invalid' };
	const match = DECIMAL_PATTERN.exec(value.trim());
	if (!match) return { ok: false, reason: 'invalid' };
	const integer = match[1].replace(/^0+(?=\d)/, '');
	const fraction = match[2] ?? '';
	if (fraction.length > 4) return { ok: false, reason: 'fraction_digits' };
	if (integer.length > 14) return { ok: false, reason: 'out_of_range' };
	const normalized = fraction ? `${integer}.${fraction}` : integer;
	if (options.positive && toScaleFour(normalized) <= 0n) {
		return { ok: false, reason: 'out_of_range' };
	}
	return { ok: true, value: normalized };
}

export function toScaleFour(value: string): bigint {
	const match = DECIMAL_PATTERN.exec(value);
	if (!match || (match[2]?.length ?? 0) > 4) {
		throw new RangeError('Invalid scale-four decimal');
	}
	return BigInt(match[1]) * 10000n + BigInt((match[2] ?? '').padEnd(4, '0'));
}

export function fromScaleFour(value: bigint): string {
	if (value < 0n) throw new RangeError('Negative money is unsupported');
	const integer = value / 10000n;
	const fraction = String(value % 10000n)
		.padStart(4, '0')
		.replace(/0+$/, '');
	return fraction ? `${integer}.${fraction}` : String(integer);
}

export function sumCurrencyAmounts(rows: Array<{ currency: string; amount: string }>): CurrencyTotal[] {
	const totals = new Map<string, bigint>();
	for (const row of rows) {
		totals.set(row.currency, (totals.get(row.currency) ?? 0n) + toScaleFour(row.amount));
	}
	return [...totals.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([currency, total]) => ({ currency, total: fromScaleFour(total) }));
}
