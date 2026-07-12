import { describe, expect, it } from 'vitest';

import { parseCreateMoment } from './validation.js';

describe('parseCreateMoment', () => {
	it('rejects more than four image URLs', () => {
		expect(parseCreateMoment({ sourceUrl: 'https://example.com', imageUrls: Array(5).fill('https://images.example/a') }).ok).toBe(false);
	});

	it('normalizes empty body to null', () => {
		expect(parseCreateMoment({ sourceUrl: 'https://example.com', body: '   ' })).toMatchObject({ ok: true, value: { body: null } });
	});
});
