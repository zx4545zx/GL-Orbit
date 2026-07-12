import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/index.js', () => ({ getDb: vi.fn() }));
import { getDb } from '../db/index.js';
import { createMoment, setMomentLike } from './mutations.js';

describe('createMoment', () => {
	it('uses one Neon HTTP transaction for Moment and media inserts', async () => {
		const transaction = vi.fn().mockResolvedValue([]);
		vi.mocked(getDb).mockResolvedValue({ $client: Object.assign(vi.fn(), { transaction }) } as never);
		await createMoment({ authorId: 'user-1', sourceUrl: 'https://example.com', sourceCanonicalUrl: 'https://example.com', provider: 'OTHER', imageUrls: ['https://images.example/a'] });
		expect(transaction).toHaveBeenCalledOnce();
		expect(transaction.mock.calls[0][0]).toHaveLength(2);
	});
});

describe('setMomentLike', () => {
	it('batches the idempotent like and counter update in one Neon HTTP transaction', async () => {
		const transaction = vi.fn().mockResolvedValue([]);
		vi.mocked(getDb).mockResolvedValue({ $client: Object.assign(vi.fn(), { transaction }) } as never);
		await setMomentLike('moment-1', 'user-1', true);
		expect(transaction).toHaveBeenCalledOnce();
		expect(transaction.mock.calls[0][0]).toHaveLength(2);
	});
});
