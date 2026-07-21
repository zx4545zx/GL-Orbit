import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import {
	addCalendarDays,
	getCalendarMonthRange,
	parseCalendarDate
} from '$lib/subscriptions/calendar.js';
import { fromScaleFour, toScaleFour } from '$lib/subscriptions/money.js';
import { classifyUrgency, evaluateBudget } from '$lib/subscriptions/summary.js';
import type {
	CalendarDate,
	CurrencyTotal,
	SubscriptionStatus,
	SubscriptionSummary
} from '$lib/subscriptions/types.js';
import { resultRows } from './queries.js';

function totals(rows: Array<{ currency: string; total: string }>): CurrencyTotal[] {
	return rows
		.map((row) => ({ currency: row.currency, total: fromScaleFour(toScaleFour(row.total)) }))
		.sort((left, right) => left.currency.localeCompare(right.currency));
}

export async function getSubscriptionSummary(
	db: Db,
	userId: string,
	today: CalendarDate
): Promise<SubscriptionSummary> {
	const { start: monthStart, endExclusive: monthEndExclusive } = getCalendarMonthRange(today);
	const forecastEndExclusive = addCalendarDays(today, 30);
	const actualTotals = totals(
		resultRows<{ currency: string; total: string }>(
			await db.execute(sql`
				SELECT currency, COALESCE(SUM(amount), 0)::text AS total
				FROM subscription_payments
				WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
					AND paid_date >= ${monthStart}::date AND paid_date < ${monthEndExclusive}::date
				GROUP BY currency
				ORDER BY currency
			`)
		)
	);
	const forecastTotals = totals(
		resultRows<{ currency: string; total: string }>(
			await db.execute(sql`
				SELECT currency, COALESCE(SUM(amount), 0)::text AS total
				FROM user_subscriptions
				WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND status = 'ACTIVE'
					AND current_period_end >= ${today}::date
					AND current_period_end < ${forecastEndExclusive}::date
				GROUP BY currency
				ORDER BY currency
			`)
		)
	);
	const budgetRows = resultRows<{
		currency: string;
		monthly_limit: string;
		warning_percent: number;
	}>(
		await db.execute(sql`
			SELECT currency, monthly_limit::text, warning_percent
			FROM subscription_budgets
			WHERE user_id = ${userId}::uuid
			ORDER BY currency
		`)
	);
	const urgencyRows = resultRows<{
		id: string;
		current_period_end: string;
		alert_days: number[];
		renews_automatically: boolean;
		status: SubscriptionStatus;
	}>(
		await db.execute(sql`
			SELECT id, current_period_end::text, alert_days, renews_automatically, status
			FROM user_subscriptions
			WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND status = 'ACTIVE'
			ORDER BY current_period_end, id
		`)
	);
	const actualByCurrency = new Map(actualTotals.map((item) => [item.currency, item.total]));
	const budgets = budgetRows.map((row) => {
		const actual = actualByCurrency.get(row.currency) ?? '0';
		const monthlyLimit = fromScaleFour(toScaleFour(row.monthly_limit));
		return {
			currency: row.currency,
			actual,
			monthlyLimit,
			warningPercent: row.warning_percent,
			...evaluateBudget(actual, monthlyLimit, row.warning_percent)
		};
	});
	const urgencies = urgencyRows.map((row) => {
		const currentPeriodEnd = parseCalendarDate(row.current_period_end);
		if (!currentPeriodEnd) {
			throw new Error('Invalid current_period_end returned by subscription summary query');
		}
		return {
			subscriptionId: row.id,
			...classifyUrgency(
				currentPeriodEnd,
				today,
				row.alert_days,
				row.renews_automatically,
				row.status
			)
		};
	});
	return {
		today,
		monthStart,
		monthEndExclusive,
		forecastEndExclusive,
		actualTotals,
		forecastTotals,
		budgets,
		urgencies,
		counts: {
			expired: urgencies.filter((item) => item.state === 'EXPIRED').length,
			dueToday: urgencies.filter((item) => item.state === 'DUE_TODAY').length,
			awaitingConfirmation: urgencies.filter((item) => item.awaitingConfirmation).length
		}
	};
}
