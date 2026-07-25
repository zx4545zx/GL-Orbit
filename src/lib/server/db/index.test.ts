import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	clients: [] as Array<{ end: ReturnType<typeof vi.fn> }>
}));

vi.mock('postgres', () => ({
	default: vi.fn(() => {
		const client = Object.assign(vi.fn(), {
			begin: vi.fn(),
			end: vi.fn().mockResolvedValue(undefined)
		});
		mocks.clients.push(client);
		return client;
	})
}));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn((client) => ({ $client: client })) }));

describe('database connection lifecycle', () => {
	beforeEach(() => {
		vi.resetModules();
		mocks.clients.length = 0;
		process.env.NEON_DATABASE_URL = 'postgres://test';
		delete process.env.DB_PROVIDER;
	});

	it('closes the cached client and allows lazy reinitialization', async () => {
		const { closeDb, getDb } = await import('./index.js');
		const first = await getDb();
		expect(await getDb()).toBe(first);

		await closeDb();
		expect(mocks.clients[0].end).toHaveBeenCalledOnce();

		const second = await getDb();
		expect(second).not.toBe(first);
		expect(mocks.clients).toHaveLength(2);
	});
});
