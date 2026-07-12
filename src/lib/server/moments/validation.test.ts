import { describe, expect, it } from 'vitest';

import { parseCreateMoment } from './validation.js';

describe('parseCreateMoment', () => {
	it('accepts a text-only Moment', () => {
		expect(parseCreateMoment({ body: 'hello' })).toMatchObject({
			ok: true,
			value: { body: 'hello', sourceUrl: null, imageUrls: [], pendingMediaCount: 0 }
		});
	});

	it('accepts an image-only Moment intent and rejects an empty Moment', () => {
		expect(parseCreateMoment({ pendingMediaCount: 1 }).ok).toBe(true);
		expect(parseCreateMoment({}).ok).toBe(false);
	});

	it('rejects more than four image URLs', () => {
		expect(parseCreateMoment({ sourceUrl: 'https://example.com', imageUrls: Array(5).fill('https://images.example/a') }).ok).toBe(false);
	});

	it('normalizes empty body to null', () => {
		expect(parseCreateMoment({ sourceUrl: 'https://example.com', body: '   ' })).toMatchObject({ ok: true, value: { body: null } });
	});

	it('normalizes blank source URLs and validates pending media count', () => {
		expect(parseCreateMoment({ body: 'hello', sourceUrl: '   ', pendingMediaCount: 0 })).toMatchObject({
			ok: true,
			value: { sourceUrl: null, pendingMediaCount: 0 }
		});
		expect(parseCreateMoment({ body: 'hello', pendingMediaCount: 4 }).ok).toBe(true);
		expect(parseCreateMoment({ body: 'hello', pendingMediaCount: 5 }).ok).toBe(false);
		expect(parseCreateMoment({ body: 'hello', pendingMediaCount: -1 }).ok).toBe(false);
		expect(parseCreateMoment({ body: 'hello', pendingMediaCount: 1.5 }).ok).toBe(false);
	});

	it('limits combined external URLs and pending uploads to four images', () => {
		expect(parseCreateMoment({ imageUrls: Array(3).fill('https://images.example/a'), pendingMediaCount: 1 }).ok).toBe(true);
		expect(parseCreateMoment({ imageUrls: Array(3).fill('https://images.example/a'), pendingMediaCount: 2 }).ok).toBe(false);
	});
});
