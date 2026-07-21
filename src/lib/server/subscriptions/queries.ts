import { sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/index.js';
import { calculateNextPeriod, parseCalendarDate } from '$lib/subscriptions/calendar.js';
import { fromScaleFour, toScaleFour } from '$lib/subscriptions/money.js';
import type {
	BillingUnit,
	CurrencyOption,
	PaymentItem,
	PaymentKind,
	PaymentPage,
	PlatformOption,
	RelatedSeries,
	SubscriptionDetail,
	SubscriptionListItem,
	SubscriptionStatus
} from '$lib/subscriptions/types.js';
import { decodePaymentCursor, encodePaymentCursor } from './cursor.js';
import { SubscriptionDomainError } from './errors.js';

type SubscriptionDbRow = {
	id: string;
	platform_id: string | null;
	platform_name: string | null;
	platform_logo_url: string | null;
	custom_platform_name: string | null;
	plan_name: string | null;
	account_label: string | null;
	amount: string;
	currency: string;
	billing_unit: BillingUnit;
	billing_interval: number;
	current_period_start: string;
	current_period_end: string;
	renewal_anchor_date: string;
	renewal_sequence: number;
	renews_automatically: boolean;
	status: SubscriptionStatus;
	alert_days: number[];
	related_series: unknown;
	related_series_count: number | string;
};

type RelatedSeriesDbRow = {
	id: string;
	title_th: string | null;
	title_en: string;
	poster_url: string | null;
};

export function resultRows<T>(result: unknown): T[] {
	if (Array.isArray(result)) return result as T[];
	if (
		result &&
		typeof result === 'object' &&
		Array.isArray((result as { rows?: unknown }).rows)
	) {
		return (result as { rows: T[] }).rows;
	}
	return [];
}

function canonicalDbMoney(value: string): string {
	return fromScaleFour(toScaleFour(value));
}

function requiredDate(value: string) {
	const parsed = parseCalendarDate(value);
	if (!parsed) throw new Error(`Database returned invalid civil date: ${value}`);
	return parsed;
}

function parseRelatedSeriesValue(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	if (typeof value !== 'string') return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function mapRelatedSeries(value: unknown): RelatedSeries[] {
	const seen = new Set<string>();
	return parseRelatedSeriesValue(value).flatMap((row) => {
		if (!row || typeof row !== 'object') return [];
		const item = row as Record<string, unknown>;
		if (typeof item.id !== 'string' || typeof item.titleEn !== 'string' || seen.has(item.id)) {
			return [];
		}
		seen.add(item.id);
		return [
			{
				id: item.id,
				titleTh: typeof item.titleTh === 'string' ? item.titleTh : null,
				titleEn: item.titleEn,
				posterUrl: typeof item.posterUrl === 'string' ? item.posterUrl : null
			}
		];
	});
}

function mapRelatedSeriesRows(rows: RelatedSeriesDbRow[]): RelatedSeries[] {
	return mapRelatedSeries(
		rows.map((row) => ({
			id: row.id,
			titleTh: row.title_th,
			titleEn: row.title_en,
			posterUrl: row.poster_url
		}))
	);
}

function mapSubscriptionRow(row: SubscriptionDbRow): SubscriptionListItem {
	const currentPeriodStart = requiredDate(row.current_period_start);
	const currentPeriodEnd = requiredDate(row.current_period_end);
	const renewalAnchorDate = requiredDate(row.renewal_anchor_date);
	const relatedSeries = mapRelatedSeries(row.related_series).slice(0, 3);
	const relatedSeriesCount = Number(row.related_series_count);
	if (!Number.isSafeInteger(relatedSeriesCount) || relatedSeriesCount < 0) {
		throw new Error('Database returned invalid related-series count');
	}
	if (row.platform_id && !row.platform_name) {
		throw new Error('Database returned a subscription with an invalid platform');
	}
	const scheduleVersion = {
		currentPeriodStart,
		currentPeriodEnd,
		renewalAnchorDate,
		renewalSequence: row.renewal_sequence,
		billingUnit: row.billing_unit,
		billingInterval: row.billing_interval
	};
	const nextPeriod = calculateNextPeriod({
		anchorDate: renewalAnchorDate,
		sequence: row.renewal_sequence,
		billingUnit: row.billing_unit,
		billingInterval: row.billing_interval
	});
	return {
		id: row.id,
		platformId: row.platform_id,
		platform: row.platform_id
			? { id: row.platform_id, name: row.platform_name!, logoUrl: row.platform_logo_url }
			: null,
		customPlatformName: row.custom_platform_name,
		planName: row.plan_name,
		accountLabel: row.account_label,
		amount: canonicalDbMoney(row.amount),
		currency: row.currency,
		billingUnit: row.billing_unit,
		billingInterval: row.billing_interval,
		currentPeriodStart,
		currentPeriodEnd,
		renewsAutomatically: row.renews_automatically,
		status: row.status,
		alertDays: Array.isArray(row.alert_days) ? row.alert_days : [],
		scheduleVersion,
		nextPeriod: { start: nextPeriod.start, end: nextPeriod.end },
		relatedSeries,
		relatedSeriesRemaining: Math.max(0, relatedSeriesCount - relatedSeries.length)
	};
}

const subscriptionListSql = (userId: string, subscriptionId?: string) => sql`
	WITH related AS (
		SELECT DISTINCT links.platform_id, s.id, s.title_th, s.title_en, s.poster_url
		FROM (
			SELECT ss.platform_id, ss.series_id
			FROM series_schedules ss
			WHERE ss.platform_id IS NOT NULL
			UNION
			SELECT es.platform_id, e.series_id
			FROM episode_schedules es
			INNER JOIN episodes e ON e.id = es.episode_id AND e.deleted_at IS NULL
			WHERE es.platform_id IS NOT NULL AND es.deleted_at IS NULL
		) links
		INNER JOIN series s ON s.id = links.series_id AND s.deleted_at IS NULL
	), ranked_related AS (
		SELECT related.*,
			ROW_NUMBER() OVER (PARTITION BY platform_id ORDER BY title_en, id) AS row_number,
			COUNT(*) OVER (PARTITION BY platform_id) AS related_count
		FROM related
	)
	SELECT us.id, us.platform_id, p.name AS platform_name, p.logo_url AS platform_logo_url,
		us.custom_platform_name, us.plan_name, us.account_label, us.amount::text, us.currency,
		us.billing_unit, us.billing_interval, us.current_period_start::text, us.current_period_end::text,
		us.renewal_anchor_date::text, us.renewal_sequence, us.renews_automatically, us.status,
		us.alert_days,
		COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'id', rr.id,
					'titleTh', rr.title_th,
					'titleEn', rr.title_en,
					'posterUrl', rr.poster_url
				)
				ORDER BY rr.title_en, rr.id
			) FILTER (WHERE rr.row_number <= 3),
			'[]'::jsonb
		) AS related_series,
		COALESCE(MAX(rr.related_count), 0)::int AS related_series_count
	FROM user_subscriptions us
	LEFT JOIN platforms p ON p.id = us.platform_id
	LEFT JOIN ranked_related rr ON rr.platform_id = us.platform_id
	WHERE us.user_id = ${userId}::uuid
		AND us.deleted_at IS NULL
		${subscriptionId ? sql`AND us.id = ${subscriptionId}::uuid` : sql``}
	GROUP BY us.id, p.id
	ORDER BY us.current_period_end ASC, us.created_at ASC, us.id ASC
`;

export async function listPlatformOptions(db: Db): Promise<PlatformOption[]> {
	const rows = resultRows<{ id: string; name: string; logo_url: string | null }>(
		await db.execute(sql`
			SELECT id, name, logo_url
			FROM platforms
			WHERE deleted_at IS NULL
			ORDER BY name, id
		`)
	);
	return rows.map((row) => ({ id: row.id, name: row.name, logoUrl: row.logo_url }));
}

export async function listCurrencyOptions(db: Db): Promise<CurrencyOption[]> {
	const rows = resultRows<{
		code: string;
		name_th: string;
		name_en: string;
		minor_unit: number;
	}>(
		await db.execute(sql`
			SELECT code, name_th, name_en, minor_unit
			FROM currencies
			WHERE is_active = TRUE
			ORDER BY sort_order, code
		`)
	);
	return rows.map((row) => ({
		code: row.code,
		nameTh: row.name_th,
		nameEn: row.name_en,
		minorUnit: row.minor_unit
	}));
}

export async function listSubscriptionBudgets(
	db: Db,
	userId: string
): Promise<Array<{ currency: string; monthlyLimit: string; warningPercent: number }>> {
	const rows = resultRows<{ currency: string; monthly_limit: string; warning_percent: number }>(
		await db.execute(sql`
			SELECT currency, monthly_limit::text, warning_percent
			FROM subscription_budgets
			WHERE user_id = ${userId}::uuid
			ORDER BY currency
		`)
	);
	return rows.map((row) => ({
		currency: row.currency,
		monthlyLimit: canonicalDbMoney(row.monthly_limit),
		warningPercent: row.warning_percent
	}));
}

export async function listSubscriptions(db: Db, userId: string): Promise<SubscriptionListItem[]> {
	return resultRows<SubscriptionDbRow>(await db.execute(subscriptionListSql(userId))).map(
		mapSubscriptionRow
	);
}

async function listAllRelatedSeries(db: Db, platformId: string): Promise<RelatedSeries[]> {
	const rows = resultRows<RelatedSeriesDbRow>(
		await db.execute(sql`
			SELECT DISTINCT s.id, s.title_th, s.title_en, s.poster_url
			FROM (
				SELECT ss.platform_id, ss.series_id
				FROM series_schedules ss
				WHERE ss.platform_id = ${platformId}::uuid
				UNION
				SELECT es.platform_id, e.series_id
				FROM episode_schedules es
				INNER JOIN episodes e ON e.id = es.episode_id AND e.deleted_at IS NULL
				WHERE es.platform_id = ${platformId}::uuid AND es.deleted_at IS NULL
			) links
			INNER JOIN series s ON s.id = links.series_id AND s.deleted_at IS NULL
			ORDER BY s.title_en, s.id
		`)
	);
	return mapRelatedSeriesRows(rows);
}

export async function listSubscriptionPayments(
	db: Db,
	userId: string,
	subscriptionId: string,
	cursorValue: string | null = null,
	limit = 25
): Promise<PaymentPage> {
	const cursor = cursorValue ? decodePaymentCursor(cursorValue) : null;
	if (cursorValue && !cursor) {
		throw new SubscriptionDomainError('INVALID_INPUT', { cursor: ['invalid'] });
	}
	const owned = resultRows<{ id: string }>(
		await db.execute(sql`
			SELECT id
			FROM user_subscriptions
			WHERE id = ${subscriptionId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
			LIMIT 1
		`)
	);
	if (!owned.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
	const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
	const rows = resultRows<{
		id: string;
		kind: PaymentKind;
		amount: string;
		currency: string;
		paid_date: string;
		service_period_start: string;
		service_period_end: string;
		created_at: string;
		can_reverse: boolean;
	}>(
		await db.execute(sql`
			SELECT sp.id, sp.kind, sp.amount::text, sp.currency, sp.paid_date::text,
				sp.service_period_start::text, sp.service_period_end::text, sp.created_at::text,
				(
					sp.kind = 'RENEWAL'
					AND sp.id = (
						SELECT newest.id
						FROM subscription_payments newest
						WHERE newest.subscription_id = sp.subscription_id
							AND newest.kind = 'RENEWAL'
							AND newest.deleted_at IS NULL
						ORDER BY newest.created_at DESC, newest.id DESC
						LIMIT 1
					)
					AND us.current_period_start = sp.service_period_start
					AND us.current_period_end = sp.service_period_end
					AND us.renewal_sequence = sp.renewal_sequence_before + 1
					AND us.renewal_anchor_date = sp.renewal_anchor_before
					AND us.billing_unit = sp.billing_unit_snapshot
					AND us.billing_interval = sp.billing_interval_snapshot
				) AS can_reverse
			FROM subscription_payments sp
			INNER JOIN user_subscriptions us
				ON us.id = sp.subscription_id AND us.user_id = sp.user_id
			WHERE sp.user_id = ${userId}::uuid
				AND sp.subscription_id = ${subscriptionId}::uuid
				AND sp.deleted_at IS NULL
				${
					cursor
						? sql`AND (sp.paid_date, sp.created_at, sp.id) < (${cursor.paidDate}::date, ${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
						: sql``
				}
			ORDER BY sp.paid_date DESC, sp.created_at DESC, sp.id DESC
			LIMIT ${safeLimit + 1}
		`)
	);
	const visible = rows.slice(0, safeLimit);
	const items: PaymentItem[] = visible.map((row) => ({
		id: row.id,
		kind: row.kind,
		amount: canonicalDbMoney(row.amount),
		currency: row.currency,
		paidDate: requiredDate(row.paid_date),
		servicePeriodStart: requiredDate(row.service_period_start),
		servicePeriodEnd: requiredDate(row.service_period_end),
		createdAt: row.created_at,
		canEdit: row.kind !== 'RENEWAL',
		canDelete: row.kind !== 'RENEWAL',
		canReverse: Boolean(row.can_reverse)
	}));
	const last = items.at(-1);
	return {
		items,
		nextCursor:
			rows.length > safeLimit && last
				? encodePaymentCursor({ paidDate: last.paidDate, createdAt: last.createdAt, id: last.id })
				: null
	};
}

export async function getSubscriptionDetail(
	db: Db,
	userId: string,
	subscriptionId: string,
	cursor: string | null = null
): Promise<SubscriptionDetail> {
	const rows = resultRows<SubscriptionDbRow>(
		await db.execute(subscriptionListSql(userId, subscriptionId))
	);
	if (!rows.length) throw new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND');
	const subscription = mapSubscriptionRow(rows[0]);
	const relatedSeries = subscription.platformId
		? await listAllRelatedSeries(db, subscription.platformId)
		: [];
	const payments = await listSubscriptionPayments(db, userId, subscriptionId, cursor, 25);
	return { ...subscription, relatedSeries, relatedSeriesRemaining: 0, payments };
}
