import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const menu = readFileSync('src/routes/[lang=lang]/(app)/menus/+page.svelte', 'utf8');
const profile = readFileSync('src/routes/[lang=lang]/(app)/profile/+page.svelte', 'utf8');
const navigation = readFileSync('src/lib/components/Navigation.svelte', 'utf8');
const detail = readFileSync('src/routes/[lang=lang]/(app)/subscriptions/[id]/+page.svelte', 'utf8');
const dashboard = readFileSync('src/routes/[lang=lang]/(app)/subscriptions/+page.svelte', 'utf8');
const create = readFileSync('src/routes/[lang=lang]/(app)/subscriptions/new/+page.svelte', 'utf8');
const edit = readFileSync('src/routes/[lang=lang]/(app)/subscriptions/[id]/edit/+page.svelte', 'utf8');
const schema = readFileSync('src/lib/server/db/schema.ts', 'utf8');
const appCss = readFileSync('src/app.css', 'utf8');
const currencySurfaces = [
	'SubscriptionForm.svelte',
	'PaymentHistory.svelte',
	'RenewalDialog.svelte',
	'BudgetControls.svelte'
].map((file) => readFileSync(`src/lib/components/subscriptions/${file}`, 'utf8'));

describe('subscription feature integration', () => {
	it('links authenticated menu and profile surfaces through localizedHref', () => {
		expect(menu).toContain("localizedHref('/subscriptions', page.data.lang)");
		expect(profile).toContain("localizedHref('/subscriptions'");
		expect(menu).toContain('m.subscriptions_nav()');
	});

	it('exposes subscriptions in the desktop profile menu', () => {
		expect(navigation).toContain('href="/{page.data.lang}/subscriptions"');
		expect(navigation).toContain('m.subscriptions_nav()');
	});

	it('does not add notification, cron, timezone, or route pending-shell coupling', () => {
		expect(schema).toMatch(/pgTable\(['"]user_subscriptions['"]/);
		expect(schema).toMatch(/pgTable\(['"]subscription_payments['"]/);
		expect(schema).toMatch(/pgTable\(['"]subscription_budgets['"]/);
		expect(schema).not.toMatch(
			/subscription_(?:notifications?|reminders?|timezones?)|subscriptionTimezone/i
		);
		for (const source of [menu, profile]) expect(source).not.toContain('SubscriptionPendingShell');
	});

	it('refreshes detail urgency when the visible device-local date changes', () => {
		expect(detail).toContain("document.addEventListener('visibilitychange'");
		expect(detail).toContain("document.removeEventListener('visibilitychange'");
		expect(detail).toContain('deviceLocalToday()');
	});

	it('wires the authoritative currency catalog to every financial entry surface', () => {
		expect(dashboard).toContain('currencies={data.currencies}');
		expect(detail).toContain('currencies={data.currencies}');
		expect(create).toContain('currencies={data.currencies}');
		expect(edit).toContain('currencies={data.currencies}');
		for (const source of currencySurfaces) {
			expect(source).toContain('CurrencySelect');
			expect(source).not.toContain('subscription-budget-currencies');
			expect(source).not.toContain('maxlength="3"');
		}
	});

	it('associates every currency select with its field error text', () => {
		const [form, payments, renewal, budgets] = currencySurfaces;
		expect(form).toContain('describedBy={fieldDescription(\'currency\')}');
		expect(form).toContain('id="subscription-currency-error"');
		expect(payments).toContain("describedBy={fieldMessage('currency') ? 'payment-currency-error' : undefined}");
		expect(payments).toContain('id="payment-currency-error"');
		expect(renewal).toContain("describedBy={fieldMessage('currency') ? 'renewal-currency-error' : undefined}");
		expect(renewal).toContain('id="renewal-currency-error"');
		expect(budgets).toContain("describedBy={fieldMessage('currency') ? 'budget-currency-error' : undefined}");
		expect(budgets).toContain('id="budget-currency-error"');
	});

	it('maps plum text utilities through the active theme tokens', () => {
		expect(appCss).toContain('--color-plum: var(--orbit-ink);');
		expect(appCss).toContain('--color-plum-light: var(--orbit-muted);');
		for (const opacity of [50, 55, 60, 65, 75]) {
			expect(`${detail}${currencySurfaces.join('')}`).toContain(`text-plum/${opacity}`);
		}
	});
});
