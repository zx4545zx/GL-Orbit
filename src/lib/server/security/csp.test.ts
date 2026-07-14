import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const config = readFileSync('svelte.config.js', 'utf8');
const hooks = readFileSync('src/hooks.server.ts', 'utf8');

describe('SvelteKit content security policy', () => {
	it('lets SvelteKit authorize hydration and service-worker bootstrap scripts', () => {
		expect(config).toContain("mode: 'auto'");
		expect(config).toContain("'script-src': ['self', 'https://platform.x.com', 'https://platform.twitter.com']");
		expect(config).not.toMatch(/'script-src':[^\n]*unsafe-inline/);
		expect(config).toContain("serviceWorker: { register: true }");
	});

	it('keeps the embed allowlist narrow and permits only inline style attributes', () => {
		expect(config).toContain("'style-src': ['self']");
		expect(config).toContain("'style-src-attr': ['unsafe-inline']");
		expect(config).toContain("'frame-src': [");
		expect(config).toContain("'https://www.youtube-nocookie.com'");
		expect(config).not.toContain('https://*.youtube.com');
		expect(config).not.toContain("'frame-src': ['*']");
	});

	it('does not override SvelteKit nonces with a second response policy', () => {
		expect(hooks).not.toContain('contentSecurityPolicy');
		expect(hooks).not.toContain("headers.set('content-security-policy'");
	});
});
