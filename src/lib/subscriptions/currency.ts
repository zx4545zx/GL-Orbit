import type { CurrencyOption } from './types.js';

const PREFERENCE_KEY = 'gl-orbit-preferred-currency';

const REGION_TO_CURRENCY: Record<string, string> = {
	TH: 'THB',
	US: 'USD',
	GB: 'GBP',
	JP: 'JPY',
	KR: 'KRW',
	CN: 'CNY',
	TW: 'TWD',
	HK: 'HKD',
	SG: 'SGD',
	MY: 'MYR',
	PH: 'PHP',
	ID: 'IDR',
	VN: 'VND',
	AU: 'AUD',
	AT: 'EUR',
	BE: 'EUR',
	CY: 'EUR',
	DE: 'EUR',
	EE: 'EUR',
	ES: 'EUR',
	FI: 'EUR',
	FR: 'EUR',
	GR: 'EUR',
	HR: 'EUR',
	IE: 'EUR',
	IT: 'EUR',
	LT: 'EUR',
	LU: 'EUR',
	LV: 'EUR',
	MT: 'EUR',
	NL: 'EUR',
	PT: 'EUR',
	SI: 'EUR',
	SK: 'EUR'
};

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
	'Asia/Bangkok': 'THB',
	'Asia/Tokyo': 'JPY',
	'Asia/Seoul': 'KRW',
	'Asia/Shanghai': 'CNY',
	'Asia/Taipei': 'TWD',
	'Asia/Hong_Kong': 'HKD',
	'Asia/Singapore': 'SGD',
	'Asia/Kuala_Lumpur': 'MYR',
	'Asia/Manila': 'PHP',
	'Asia/Jakarta': 'IDR',
	'Asia/Ho_Chi_Minh': 'VND',
	'Australia/Sydney': 'AUD',
	'Europe/London': 'GBP'
};

function normalizeCode(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const code = value.trim().toUpperCase();
	return /^[A-Z]{3}$/.test(code) ? code : null;
}

function localeRegion(locale: string): string | null {
	try {
		const parsed = new Intl.Locale(locale);
		return parsed.region ?? parsed.maximize().region ?? null;
	} catch {
		return null;
	}
}

export function selectSuggestedCurrency(
	currencies: CurrencyOption[],
	environment: { stored: string | null; locale: string; timeZone: string }
): string {
	const available = new Set(currencies.map((currency) => currency.code));
	const stored = normalizeCode(environment.stored);
	if (stored && available.has(stored)) return stored;

	const region = localeRegion(environment.locale);
	const localeCurrency = region ? REGION_TO_CURRENCY[region] : undefined;
	if (localeCurrency && available.has(localeCurrency)) return localeCurrency;

	const timezoneCurrency = TIMEZONE_TO_CURRENCY[environment.timeZone];
	if (timezoneCurrency && available.has(timezoneCurrency)) return timezoneCurrency;
	if (available.has('THB')) return 'THB';
	return currencies[0]?.code ?? 'THB';
}

export function readCurrencyPreference(): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return normalizeCode(localStorage.getItem(PREFERENCE_KEY));
	} catch {
		return null;
	}
}

export function rememberCurrencyPreference(code: string): void {
	if (typeof localStorage === 'undefined') return;
	const normalized = normalizeCode(code);
	if (!normalized) return;
	try {
		localStorage.setItem(PREFERENCE_KEY, normalized);
	} catch {
		// Storage may be disabled; currency selection must still work.
	}
}
