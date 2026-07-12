import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './csp.js';

describe('contentSecurityPolicy', () => {
	it('allows only the external origins required by Moment embeds and images', () => {
		const policy = contentSecurityPolicy(false);

		expect(policy).toContain("default-src 'self'");
		expect(policy).toContain('frame-src https://www.youtube-nocookie.com');
		expect(policy).toContain('img-src \'self\' https: data:');
		expect(policy).not.toContain('https://*.youtube.com');
		expect(policy).not.toContain('frame-src *');
	});

	it('permits Vite development client injection only in development', () => {
		expect(contentSecurityPolicy(true)).toContain("script-src 'self' 'unsafe-inline'");
		expect(contentSecurityPolicy(true)).toContain("style-src 'self' 'unsafe-inline'");
		expect(contentSecurityPolicy(false)).not.toContain("'unsafe-inline'");
	});
});
