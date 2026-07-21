import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrencyOption } from './types.js';
import {
	readCurrencyPreference,
	rememberCurrencyPreference,
	selectSuggestedCurrency
} from './currency.js';

const currencies: CurrencyOption[] = [
	{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 },
	{ code: 'USD', nameTh: 'ดอลลาร์สหรัฐ', nameEn: 'US Dollar', minorUnit: 2 },
	{ code: 'EUR', nameTh: 'ยูโร', nameEn: 'Euro', minorUnit: 2 },
	{ code: 'GBP', nameTh: 'ปอนด์สเตอร์ลิง', nameEn: 'Pound Sterling', minorUnit: 2 },
	{ code: 'JPY', nameTh: 'เยนญี่ปุ่น', nameEn: 'Japanese Yen', minorUnit: 0 },
	{ code: 'KRW', nameTh: 'วอนเกาหลีใต้', nameEn: 'South Korean Won', minorUnit: 0 },
	{ code: 'CNY', nameTh: 'หยวนจีน', nameEn: 'Chinese Yuan', minorUnit: 2 },
	{ code: 'TWD', nameTh: 'ดอลลาร์ไต้หวันใหม่', nameEn: 'New Taiwan Dollar', minorUnit: 2 },
	{ code: 'HKD', nameTh: 'ดอลลาร์ฮ่องกง', nameEn: 'Hong Kong Dollar', minorUnit: 2 },
	{ code: 'SGD', nameTh: 'ดอลลาร์สิงคโปร์', nameEn: 'Singapore Dollar', minorUnit: 2 },
	{ code: 'MYR', nameTh: 'ริงกิตมาเลเซีย', nameEn: 'Malaysian Ringgit', minorUnit: 2 },
	{ code: 'PHP', nameTh: 'เปโซฟิลิปปินส์', nameEn: 'Philippine Peso', minorUnit: 2 },
	{ code: 'IDR', nameTh: 'รูเปียห์อินโดนีเซีย', nameEn: 'Indonesian Rupiah', minorUnit: 2 },
	{ code: 'VND', nameTh: 'ดองเวียดนาม', nameEn: 'Vietnamese Dong', minorUnit: 0 },
	{ code: 'AUD', nameTh: 'ดอลลาร์ออสเตรเลีย', nameEn: 'Australian Dollar', minorUnit: 2 }
];

describe('currency suggestion', () => {
	it('prefers an available remembered choice', () => {
		expect(
			selectSuggestedCurrency(currencies, {
				stored: 'USD',
				locale: 'th-TH',
				timeZone: 'Asia/Bangkok'
			})
		).toBe('USD');
	});

	it.each([
		['th-TH', 'THB'], ['en-US', 'USD'], ['de-DE', 'EUR'], ['en-GB', 'GBP'],
		['ja-JP', 'JPY'], ['ko-KR', 'KRW'], ['zh-CN', 'CNY'], ['zh-TW', 'TWD'],
		['zh-HK', 'HKD'], ['en-SG', 'SGD'], ['ms-MY', 'MYR'], ['en-PH', 'PHP'],
		['id-ID', 'IDR'], ['vi-VN', 'VND'], ['en-AU', 'AUD']
	])('maps locale %s to %s', (locale, expected) => {
		expect(selectSuggestedCurrency(currencies, { stored: null, locale, timeZone: '' })).toBe(expected);
	});

	it('uses timezone only after unavailable preference and locale', () => {
		expect(
			selectSuggestedCurrency(currencies, {
				stored: 'CAD',
				locale: 'zz',
				timeZone: 'Asia/Singapore'
			})
		).toBe('SGD');
	});

	it('falls back to THB without a usable signal', () => {
		expect(
			selectSuggestedCurrency(currencies, {
				stored: null,
				locale: 'zz',
				timeZone: 'Unknown/Zone'
			})
		).toBe('THB');
	});
});

describe('currency preference storage', () => {
	beforeEach(() => vi.unstubAllGlobals());

	it('reads and writes normalized values', () => {
		const storage = { getItem: vi.fn(() => 'usd'), setItem: vi.fn() };
		vi.stubGlobal('localStorage', storage);
		expect(readCurrencyPreference()).toBe('USD');
		rememberCurrencyPreference('thb');
		expect(storage.setItem).toHaveBeenCalledWith('gl-orbit-preferred-currency', 'THB');
	});

	it('ignores malformed values and storage failures', () => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => 'bad-value'),
			setItem: vi.fn(() => {
				throw new Error('blocked');
			})
		});
		expect(readCurrencyPreference()).toBeNull();
		expect(() => rememberCurrencyPreference('USD')).not.toThrow();
	});
});
