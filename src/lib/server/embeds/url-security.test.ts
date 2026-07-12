import { describe, expect, it } from 'vitest';

import { parseSafeExternalUrl } from './url-security.js';

describe('parseSafeExternalUrl', () => {
	it.each([
		'http://example.com',
		'https://localhost:3000',
		'https://127.0.0.1',
		'https://10.0.0.4',
		'https://169.254.169.254',
		'https://internal.local'
	])('rejects unsafe URL %s', (rawUrl) => {
		expect(() => parseSafeExternalUrl(rawUrl)).toThrow();
	});

	it('accepts a public HTTPS URL', () => {
		expect(parseSafeExternalUrl('https://www.youtube.com/watch?v=abc123').hostname).toBe('www.youtube.com');
	});
});
