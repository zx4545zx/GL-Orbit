import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/index.js', () => ({ getDb: vi.fn() }));

import { getDb } from '../db/index.js';
import { checkRateLimit } from './index.js';

describe('checkRateLimit', () => {
	it('allows an atomic database result below the limit', async () => {
		vi.mocked(getDb).mockResolvedValue({ execute: vi.fn().mockResolvedValue({ rows: [{ request_count: 2, window_started_at: new Date() }] }) } as never);
		await expect(checkRateLimit('moment:create:user-1', 10, 600)).resolves.toMatchObject({ allowed: true, retryAfterSeconds: 0 });
	});
});
