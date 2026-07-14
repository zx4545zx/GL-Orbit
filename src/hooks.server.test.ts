import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./hooks.server.ts', import.meta.url), 'utf8');

describe('authenticated request locale lookup', () => {
	it('reuses preferredLanguage from the validated session user', () => {
		expect(source).toContain('const userLocale = event.locals.user?.preferredLanguage ?? undefined;');
		expect(source).not.toContain("import { getDb }");
		expect(source).not.toContain('.select({ preferredLanguage:');
	});
});
