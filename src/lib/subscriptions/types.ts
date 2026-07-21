export const billingUnits = ['DAY', 'MONTH', 'YEAR'] as const;
export const subscriptionStatuses = ['ACTIVE', 'CANCELED'] as const;
export const paymentKinds = ['INITIAL', 'RENEWAL', 'MANUAL'] as const;

export type BillingUnit = (typeof billingUnits)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export type PaymentKind = (typeof paymentKinds)[number];
export type CalendarDate = string & { readonly __calendarDate: unique symbol };

export type ScheduleVersion = {
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalAnchorDate: CalendarDate;
	renewalSequence: number;
	billingUnit: BillingUnit;
	billingInterval: number;
};

export type SubscriptionWrite = {
	platformId: string | null;
	customPlatformName: string | null;
	planName: string | null;
	accountLabel: string | null;
	amount: string;
	currency: string;
	billingUnit: BillingUnit;
	billingInterval: number;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewsAutomatically: boolean;
	status: SubscriptionStatus;
	alertDays: number[];
};

export type CreateSubscriptionRequest = SubscriptionWrite & {
	operationId: string;
	recordInitialPayment: boolean;
	initialPaidDate: CalendarDate | null;
};

export type UpdateSubscriptionRequest = SubscriptionWrite & {
	expectedSchedule: ScheduleVersion;
};

export type PaymentWriteRequest = {
	amount: string;
	currency: string;
	paidDate: CalendarDate;
	servicePeriodStart: CalendarDate;
	servicePeriodEnd: CalendarDate;
};

export type CreatePaymentRequest = PaymentWriteRequest & { operationId: string };

export type RenewSubscriptionRequest = {
	expectedPeriodEnd: CalendarDate;
	paidDate: CalendarDate;
	amount: string;
	currency: string;
};

export type ReverseRenewalRequest = { paymentId: string };
export type BudgetWriteRequest = { monthlyLimit: string; warningPercent: number };
export type RenewalResult = {
	paymentId: string;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalSequence: number;
};
export type ReversalResult = {
	paymentId: string;
	currentPeriodStart: CalendarDate;
	currentPeriodEnd: CalendarDate;
	renewalSequence: number;
};

export type SubscriptionErrorCode =
	| 'AUTH_REQUIRED'
	| 'INVALID_INPUT'
	| 'INTERNAL_ERROR'
	| 'UNSUPPORTED_CURRENCY'
	| 'PLATFORM_NOT_FOUND'
	| 'SUBSCRIPTION_NOT_FOUND'
	| 'PAYMENT_NOT_FOUND'
	| 'RENEWAL_CONFLICT'
	| 'RENEWAL_ALREADY_RECORDED'
	| 'RENEWAL_REVERSAL_NOT_ALLOWED';

export type FieldErrorCode =
	| 'required'
	| 'invalid'
	| 'too_long'
	| 'out_of_range'
	| 'future_date'
	| 'fraction_digits'
	| 'source_xor'
	| 'date_order'
	| 'duplicate';

export type SubscriptionApiError = {
	ok: false;
	code: SubscriptionErrorCode;
	fieldErrors?: Record<string, FieldErrorCode[]>;
};

export type PlatformOption = { id: string; name: string; logoUrl: string | null };
export type RelatedSeries = {
	id: string;
	titleTh: string | null;
	titleEn: string;
	posterUrl: string | null;
};

export type SubscriptionListItem = SubscriptionWrite & {
	id: string;
	platform: PlatformOption | null;
	scheduleVersion: ScheduleVersion;
	nextPeriod: { start: CalendarDate; end: CalendarDate };
	relatedSeries: RelatedSeries[];
	relatedSeriesRemaining: number;
};

export type PaymentItem = PaymentWriteRequest & {
	id: string;
	kind: PaymentKind;
	createdAt: string;
	canEdit: boolean;
	canDelete: boolean;
	canReverse: boolean;
};

export type PaymentPage = { items: PaymentItem[]; nextCursor: string | null };

export type SubscriptionDetail = SubscriptionListItem & {
	payments: PaymentPage;
	relatedSeries: RelatedSeries[];
};

export type CurrencyTotal = { currency: string; total: string };

export type CurrencyOption = {
	code: string;
	nameTh: string;
	nameEn: string;
	minorUnit: number;
};
export type UrgencyState = 'SAFE' | 'UPCOMING' | 'DUE_TODAY' | 'EXPIRED';
export type BudgetState = 'SAFE' | 'NEAR' | 'OVER';
export type SubscriptionUrgency = {
	subscriptionId: string;
	daysRemaining: number;
	state: UrgencyState;
	matchedAlertDay: number | null;
	awaitingConfirmation: boolean;
};
export type BudgetSummary = {
	currency: string;
	actual: string;
	monthlyLimit: string;
	warningPercent: number;
	state: BudgetState;
	usageBasisPoints: number;
};
export type SubscriptionSummary = {
	today: CalendarDate;
	monthStart: CalendarDate;
	monthEndExclusive: CalendarDate;
	forecastEndExclusive: CalendarDate;
	actualTotals: CurrencyTotal[];
	forecastTotals: CurrencyTotal[];
	budgets: BudgetSummary[];
	urgencies: SubscriptionUrgency[];
	counts: { expired: number; dueToday: number; awaitingConfirmation: number };
};

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiResult<T> = ApiSuccess<T> | SubscriptionApiError;
