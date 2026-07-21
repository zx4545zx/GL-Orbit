import { describe, expect, it } from 'vitest';
import {
	fromScaleFour,
	getCurrencyMinorUnits,
	parseMoney,
	parseMoneyCandidate,
	parseMoneyWithMinorUnit,
	sumCurrencyAmounts,
	toScaleFour
} from './money.js';

describe('subscription money', () => {
	it('enforces ISO currency exponents', () => {
		expect(getCurrencyMinorUnits('JPY')).toBe(0);
		expect(getCurrencyMinorUnits('USD')).toBe(2);
		expect(getCurrencyMinorUnits('KWD')).toBe(3);
		expect(parseMoney('1.00', 'JPY')).toEqual({ ok: false, reason: 'fraction_digits' });
		expect(parseMoney('1.234', 'USD')).toEqual({ ok: false, reason: 'fraction_digits' });
	});

	it('accepts a catalog minor unit as the authoritative exponent', () => {
		expect(parseMoneyWithMinorUnit('10.25', 2)).toEqual({ ok: true, value: '10.25' });
		expect(parseMoneyWithMinorUnit('10.1', 0)).toEqual({
			ok: false,
			reason: 'fraction_digits'
		});
		expect(parseMoneyWithMinorUnit('0', 2, { positive: true })).toEqual({
			ok: false,
			reason: 'out_of_range'
		});
	});

	it('parses request money shape without consulting runtime Intl metadata', () => {
		expect(parseMoneyCandidate('001.230')).toEqual({ ok: true, value: '1.230' });
		expect(parseMoneyCandidate('1.00001')).toEqual({ ok: false, reason: 'fraction_digits' });
	});

	it('canonicalizes without binary floating point', () => {
		expect(parseMoney('00012.30', 'USD')).toEqual({ ok: true, value: '12.3' });
		expect(toScaleFour('0.1') + toScaleFour('0.2')).toBe(3000n);
		expect(fromScaleFour(3000n)).toBe('0.3');
	});

	it('rejects negatives, exponent notation, overflow, and unsupported codes', () => {
		expect(parseMoney('-1', 'USD').ok).toBe(false);
		expect(parseMoney('1e2', 'USD').ok).toBe(false);
		expect(parseMoney('100000000000000', 'USD').ok).toBe(false);
		expect(parseMoney('1', 'ZZZ')).toEqual({ ok: false, reason: 'unsupported_currency' });
	});

	it('groups currencies independently and preserves exact large totals', () => {
		expect(
			sumCurrencyAmounts([
				{ currency: 'USD', amount: '900719925474.09' },
				{ currency: 'USD', amount: '0.01' },
				{ currency: 'THB', amount: '199' }
			])
		).toEqual([
			{ currency: 'THB', total: '199' },
			{ currency: 'USD', total: '900719925474.1' }
		]);
	});
});
