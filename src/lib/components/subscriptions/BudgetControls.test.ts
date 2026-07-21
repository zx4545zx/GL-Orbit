// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { CurrencyOption } from '$lib/subscriptions/types.js';
import BudgetControls from './BudgetControls.svelte';

afterEach(cleanup);

const currencies: CurrencyOption[] = [
	{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 },
	{ code: 'USD', nameTh: 'ดอลลาร์สหรัฐ', nameEn: 'US Dollar', minorUnit: 2 }
];

describe('BudgetControls', () => {
	it('does not publish budget changes before the server and authoritative refresh succeed', async () => {
		const user = userEvent.setup();
		let resolveWrite!: (value: { currency: string }) => void;
		const request = vi.fn(
			() => new Promise<{ currency: string }>((resolve) => (resolveWrite = resolve))
		);
		const changed = vi.fn();
		render(BudgetControls, {
			props: {
				budgets: [{ currency: 'THB', monthlyLimit: '1000', warningPercent: 80 }],
				currencies,
				request,
				onChanged: changed
			}
		});
		await user.click(screen.getByText(/monthly budgets|งบรายเดือน/i));

		const limit = screen.getByLabelText(/monthly limit|วงเงินรายเดือน/i);
		await user.clear(limit);
		await user.type(limit, '1200');
		await user.click(screen.getByRole('button', { name: /save budget|บันทึกงบ/i }));
		expect(changed).not.toHaveBeenCalled();
		expect(
			(screen.getByRole('button', { name: /saving|กำลังบันทึก/i }) as HTMLButtonElement).disabled
		).toBe(true);
		resolveWrite({ currency: 'THB' });
		await waitFor(() => expect(changed).toHaveBeenCalledOnce());
	});

	it('can create the first budget for a currency without a subscription', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ currency: 'USD' });
		const changed = vi.fn();
		render(BudgetControls, {
			props: { budgets: [], currencies, request, onChanged: changed }
		});
		await user.click(screen.getByText(/monthly budgets|งบรายเดือน/i));

		await user.selectOptions(screen.getByLabelText(/^currency$|^สกุลเงิน$/i), 'USD');
		await user.type(screen.getByLabelText(/monthly limit|วงเงินรายเดือน/i), '100');
		await user.clear(screen.getByLabelText(/warn at|เตือนเมื่อใช้ถึง/i));
		await user.type(screen.getByLabelText(/warn at|เตือนเมื่อใช้ถึง/i), '80');
		await user.click(screen.getByRole('button', { name: /set budget|ตั้งงบ/i }));

		expect(request).toHaveBeenCalledWith('/api/subscription-budgets/USD', {
			method: 'PUT',
			body: JSON.stringify({ monthlyLimit: '100', warningPercent: 80 })
		});
		expect(changed).toHaveBeenCalledOnce();
		expect((screen.getByLabelText(/^currency$|^สกุลเงิน$/i) as HTMLSelectElement).value).not.toBe('');
	});

	it('keeps an inactive legacy budget read-only but deletable', async () => {
		const user = userEvent.setup();
		const request = vi.fn().mockResolvedValue({ currency: 'CAD' });
		const changed = vi.fn();
		render(BudgetControls, {
			props: {
				budgets: [{ currency: 'CAD', monthlyLimit: '100', warningPercent: 80 }],
				currencies,
				request,
				onChanged: changed
			}
		});
		await user.click(screen.getByText(/monthly budgets|งบรายเดือน/i));

		expect((screen.getByLabelText(/monthly limit|วงเงินรายเดือน/i) as HTMLInputElement).disabled).toBe(true);
		expect((screen.getByRole('button', { name: /save budget|บันทึกงบ/i }) as HTMLButtonElement).disabled).toBe(true);
		await user.click(screen.getByRole('button', { name: /delete budget|ลบงบ/i }));

		expect(request).toHaveBeenCalledWith('/api/subscription-budgets/CAD', { method: 'DELETE' });
		expect(changed).toHaveBeenCalledOnce();
	});
});
