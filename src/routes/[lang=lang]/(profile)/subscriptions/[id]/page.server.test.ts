import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionDomainError } from '$lib/server/subscriptions/errors.js';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	getSubscriptionDetail: vi.fn(),
	listCurrencyOptions: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	getSubscriptionDetail: mocks.getSubscriptionDetail,
	listCurrencyOptions: mocks.listCurrencyOptions
}));

const { load } = await import('./+page.server.js');

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'USER' } as App.Locals['user'];

beforeEach(() => vi.clearAllMocks());

describe('subscription detail page load', () => {
	it('redirects anonymous users before database access', async () => {
		await expect(
			load({ locals: { user: null }, params: { id: 'sub' } } as never)
		).rejects.toMatchObject({ status: 303, location: '/login' });
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('loads an owned subscription by route id', async () => {
		const db = { marker: 'db' };
		const subscription = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
		mocks.getDb.mockResolvedValue(db);
		mocks.getSubscriptionDetail.mockResolvedValue(subscription);
		const currencies = [{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 }];
		mocks.listCurrencyOptions.mockResolvedValue(currencies);

		await expect(
			load({ locals: { user }, params: { id: subscription.id } } as never)
		).resolves.toEqual({ subscription, currencies });
		expect(mocks.getSubscriptionDetail).toHaveBeenCalledWith(db, user?.id, subscription.id);
		expect(mocks.listCurrencyOptions).toHaveBeenCalledWith(db);
	});

	it('maps a foreign or missing subscription to a generic page 404', async () => {
		mocks.getDb.mockResolvedValue({ marker: 'db' });
		mocks.getSubscriptionDetail.mockRejectedValue(
			new SubscriptionDomainError('SUBSCRIPTION_NOT_FOUND')
		);

		await expect(
			load({ locals: { user }, params: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } } as never)
		).rejects.toMatchObject({ status: 404, body: { message: 'Not found' } });
	});
});
