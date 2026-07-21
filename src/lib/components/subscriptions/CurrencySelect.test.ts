// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { CurrencyOption } from '$lib/subscriptions/types.js';
import CurrencySelect from './CurrencySelect.svelte';

afterEach(() => {
	cleanup();
	localStorage.clear();
});

const currencies: CurrencyOption[] = [
	{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 },
	{ code: 'JPY', nameTh: 'เยนญี่ปุ่น', nameEn: 'Japanese Yen', minorUnit: 0 }
];

describe('CurrencySelect', () => {
	it('renders localized catalog labels and remembers explicit changes', async () => {
		const user = userEvent.setup();
		render(CurrencySelect, { props: { id: 'currency', value: 'THB', currencies } });

		const select = screen.getByRole('combobox');
		expect(screen.getByRole('option', { name: 'บาทไทย (THB)' })).toBeTruthy();
		await user.selectOptions(select, 'JPY');
		expect((select as HTMLSelectElement).value).toBe('JPY');
		expect(localStorage.getItem('gl-orbit-preferred-currency')).toBe('JPY');
	});

	it('forwards state attributes and retains an inactive legacy code', () => {
		render(CurrencySelect, {
			props: {
				id: 'currency',
				value: 'CAD',
				currencies,
				legacyCode: 'CAD',
				disabled: true,
				invalid: true,
				describedBy: 'currency-error'
			}
		});

		const select = screen.getByRole('combobox') as HTMLSelectElement;
		expect(select.disabled).toBe(true);
		expect(select.getAttribute('aria-invalid')).toBe('true');
		expect(select.getAttribute('aria-describedby')).toBe('currency-error');
		expect((screen.getByRole('option', { name: 'CAD' }) as HTMLOptionElement).disabled).toBe(true);
	});
});
