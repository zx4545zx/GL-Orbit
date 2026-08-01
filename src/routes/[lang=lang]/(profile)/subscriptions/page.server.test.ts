import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	listSubscriptions: vi.fn(),
	listSubscriptionBudgets: vi.fn(),
	listPlatformOptions: vi.fn(),
	listCurrencyOptions: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	listSubscriptions: mocks.listSubscriptions,
	listSubscriptionBudgets: mocks.listSubscriptionBudgets,
	listPlatformOptions: mocks.listPlatformOptions,
	listCurrencyOptions: mocks.listCurrencyOptions
}));

const { load } = await import('./+page.server.js');

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'USER' } as App.Locals['user'];

beforeEach(() => vi.clearAllMocks());

describe('subscriptions dashboard page load', () => {
	it('redirects anonymous users before database access', async () => {
		await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('loads only stable private data in parallel', async () => {
		const db = { marker: 'db' };
		mocks.getDb.mockResolvedValue(db);
		mocks.listSubscriptions.mockResolvedValue([{ id: 'sub' }]);
		mocks.listSubscriptionBudgets.mockResolvedValue([
			{ currency: 'THB', monthlyLimit: '1000', warningPercent: 80 }
		]);
		mocks.listPlatformOptions.mockResolvedValue([
			{ id: 'platform', name: 'Stream GL', logoUrl: null }
		]);
		mocks.listCurrencyOptions.mockResolvedValue([
			{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 }
		]);

		await expect(load({ locals: { user } } as never)).resolves.toEqual({
			subscriptions: [{ id: 'sub' }],
			budgets: [{ currency: 'THB', monthlyLimit: '1000', warningPercent: 80 }],
			platforms: [{ id: 'platform', name: 'Stream GL', logoUrl: null }],
			currencies: [{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 }]
		});
		expect(mocks.listSubscriptions).toHaveBeenCalledWith(db, user?.id);
		expect(mocks.listSubscriptionBudgets).toHaveBeenCalledWith(db, user?.id);
		expect(mocks.listPlatformOptions).toHaveBeenCalledWith(db);
		expect(mocks.listCurrencyOptions).toHaveBeenCalledWith(db);
	});
});
