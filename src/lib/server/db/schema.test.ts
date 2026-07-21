import { readFileSync } from 'node:fs';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { currencies, subscriptionBudgets, subscriptionPayments, userSubscriptions } from './schema.js';

const schema = readFileSync(new URL('./schema.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../../../drizzle/0019_free_captain_america.sql', import.meta.url), 'utf8');
const currencyMigration = readFileSync(
	new URL('../../../../drizzle/0025_subscription_currency_catalog.sql', import.meta.url),
	'utf8'
);

describe('Moment pending media constraints', () => {
	it('allows a published Moment to retain its expected upload count after final publication', () => {
		expect(schema).toContain("pendingMediaStatus: check('moments_pending_media_status', sql`\${table.status} <> 'UPLOADING' OR \${table.pendingMediaCount} > 0`)");
		expect(migration).toContain("CHECK (\"moments\".\"status\" <> 'UPLOADING' OR \"moments\".\"pending_media_count\" > 0)");
	});
});

describe('subscription schema', () => {
	it('uses date-only service fields and numeric(18,4) money', () => {
		const subscription = getTableConfig(userSubscriptions);
		expect(subscription.columns.find((column) => column.name === 'amount')?.getSQLType()).toBe('numeric(18, 4)');
		expect(subscription.columns.find((column) => column.name === 'current_period_end')?.getSQLType()).toBe('date');
		const payment = getTableConfig(subscriptionPayments);
		expect(payment.columns.find((column) => column.name === 'paid_date')?.getSQLType()).toBe('date');
	});

	it('defines composite ownership and live renewal idempotency constraints', () => {
		const subscription = getTableConfig(userSubscriptions);
		const payment = getTableConfig(subscriptionPayments);
		expect(subscription.uniqueConstraints.some((item) => item.name === 'user_subscriptions_user_id_id_unique')).toBe(true);
		expect(payment.foreignKeys.some((item) => item.getName() === 'subscription_payments_user_subscription_fk')).toBe(true);
		expect(payment.indexes.some((item) => item.config.name === 'subscription_payments_live_renewal_unique')).toBe(true);
	});

	it('keeps budgets unique per user and currency', () => {
		const budget = getTableConfig(subscriptionBudgets);
		expect(budget.uniqueConstraints.some((item) => item.name === 'subscription_budgets_user_currency_unique')).toBe(true);
	});

	it('defines the currency catalog and references it from financial tables', () => {
		const currency = getTableConfig(currencies);
		expect(currency.columns.find((column) => column.name === 'code')?.primary).toBe(true);
		expect(currency.columns.find((column) => column.name === 'minor_unit')?.notNull).toBe(true);
		expect(currency.columns.find((column) => column.name === 'is_active')?.notNull).toBe(true);

		for (const table of [userSubscriptions, subscriptionPayments, subscriptionBudgets]) {
			expect(
				getTableConfig(table).foreignKeys.some(
					(key) => key.reference().foreignTable === currencies
				)
			).toBe(true);
		}
	});

	it('seeds 15 active currencies and preserves legacy codes before adding foreign keys', () => {
		const seededCodes = [
			'THB', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'TWD', 'HKD', 'SGD',
			'MYR', 'PHP', 'IDR', 'VND', 'AUD'
		];
		for (const code of seededCodes) expect(currencyMigration).toContain(`('${code}',`);
		expect(currencyMigration.match(/, true, \d+\)/g)).toHaveLength(15);
		expect(currencyMigration).toContain('WITH "legacy_codes" AS');
		expect(currencyMigration).toContain('LOCK TABLE "user_subscriptions", "subscription_payments", "subscription_budgets"');
		expect(currencyMigration.indexOf('LOCK TABLE')).toBeLessThan(
			currencyMigration.indexOf('WITH "legacy_codes" AS')
		);
		expect(currencyMigration.indexOf('WITH "legacy_codes" AS')).toBeLessThan(
			currencyMigration.indexOf('ADD CONSTRAINT "subscription_budgets_currency_currencies_code_fk"')
		);
	});
});
