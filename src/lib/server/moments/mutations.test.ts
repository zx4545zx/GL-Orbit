import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/index.js', () => ({ getDb: vi.fn() }));
import { getDb } from '../db/index.js';
import { appendMomentMedia, createMoment, setMomentLike } from './mutations.js';

describe('createMoment', () => {
	it('uses one Neon HTTP transaction for Moment and media inserts', async () => {
		const transaction = vi.fn().mockResolvedValue([]);
		vi.mocked(getDb).mockResolvedValue({ $client: Object.assign(vi.fn(), { transaction }) } as never);
		await createMoment({ authorId: 'user-1', sourceUrl: 'https://example.com', sourceCanonicalUrl: 'https://example.com', provider: 'OTHER', imageUrls: ['https://images.example/a'], pendingMediaCount: 0 });
		expect(transaction).toHaveBeenCalledOnce();
		expect(transaction.mock.calls[0][0]).toHaveLength(2);
	});

	it('creates a source-less Moment in one transaction', async () => {
		const transaction = vi.fn().mockResolvedValue([]);
		vi.mocked(getDb).mockResolvedValue({ $client: Object.assign(vi.fn(), { transaction }) } as never);
		await createMoment({ authorId: 'user-1', body: 'hello', sourceUrl: null, sourceCanonicalUrl: null, provider: 'OTHER', imageUrls: [], pendingMediaCount: 0 });
		expect(transaction).toHaveBeenCalledOnce();
		expect(transaction.mock.calls[0][0]).toHaveLength(1);
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

describe('appendMomentMedia', () => {
	it('atomically persists an uploaded image and publishes after the expected count', async () => {
		const transaction = vi.fn().mockResolvedValue([[{ id: 'moment-1' }], [{ moment_id: 'moment-1' }], [{ id: 'moment-1' }]]);
		const sql = Object.assign(vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ sql: strings.join(''), values })), { transaction });
		vi.mocked(getDb).mockResolvedValue({ $client: sql } as never);
		await expect(appendMomentMedia({ momentId: 'moment-1', authorId: 'user-1', key: 'images/moments/a/1080.jpg', url: 'https://cdn.example/images/moments/a/1080.jpg' })).resolves.toBe(true);
		expect(transaction).toHaveBeenCalledOnce();
		expect(transaction.mock.calls[0][0]).toHaveLength(3);
		const [lock, insert, publish] = transaction.mock.calls[0][0];
		expect(lock.sql).toContain('FOR UPDATE');
		expect(lock.sql).not.toContain('INSERT INTO');
		expect(insert.sql).toContain("source_type = 'UPLOAD'");
		expect(insert.sql).toContain("source_type, storage_key, external_url, sort_order");
		expect(insert.sql).toContain('media_count < 4');
		expect(insert.sql).toContain('c.upload_count < m.pending_media_count');
		expect(insert.sql).toContain('ON CONFLICT (moment_id, sort_order) DO NOTHING');
		expect(publish.sql).toContain("source_type = 'UPLOAD'");
		expect(publish.sql).toContain('= m.pending_media_count');
		expect(insert.values).toEqual(expect.arrayContaining(['moment-1', 'user-1', 'images/moments/a/1080.jpg', 'https://cdn.example/images/moments/a/1080.jpg']));
	});

});
