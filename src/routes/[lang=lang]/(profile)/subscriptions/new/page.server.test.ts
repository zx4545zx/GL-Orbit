import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDb: vi.fn(),
	listPlatformOptions: vi.fn(),
	listCurrencyOptions: vi.fn()
}));

vi.mock('$lib/server/db/index.js', () => ({ getDb: mocks.getDb }));
vi.mock('$lib/server/subscriptions/queries.js', () => ({
	listPlatformOptions: mocks.listPlatformOptions,
	listCurrencyOptions: mocks.listCurrencyOptions
}));

const { load } = await import('./+page.server.js');

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'USER' } as App.Locals['user'];

beforeEach(() => vi.clearAllMocks());

describe('new subscription page load', () => {
	it('redirects anonymous users before database access', async () => {
		await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(mocks.getDb).not.toHaveBeenCalled();
	});

	it('loads platform and active currency options', async () => {
		const db = { marker: 'db' };
		const platforms = [{ id: 'platform', name: 'Stream GL', logoUrl: null }];
		mocks.getDb.mockResolvedValue(db);
		mocks.listPlatformOptions.mockResolvedValue(platforms);
		const currencies = [{ code: 'THB', nameTh: 'บาทไทย', nameEn: 'Thai Baht', minorUnit: 2 }];
		mocks.listCurrencyOptions.mockResolvedValue(currencies);

		await expect(load({ locals: { user } } as never)).resolves.toEqual({ platforms, currencies });
		expect(mocks.listPlatformOptions).toHaveBeenCalledWith(db);
		expect(mocks.listCurrencyOptions).toHaveBeenCalledWith(db);
	});
});
