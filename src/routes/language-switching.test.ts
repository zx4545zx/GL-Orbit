import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rootLayout = readFileSync(new URL('./+layout.svelte', import.meta.url), 'utf8');

describe('client-side language switching', () => {
	it('syncs Paraglide before the localized subtree is replaced', () => {
		expect(rootLayout).toMatch(
			/const syncLanguageTag = \(\) => \{\s*setLanguageTag\(currentLanguageTag, \{ reload: false \}\);\s*\};\s*syncLanguageTag\(\);/
		);
		expect(rootLayout).toMatch(
			/\$effect\.pre\(\(\) => \{\s*syncLanguageTag\(\);\s*document\.documentElement\.lang = currentLanguageTag;\s*\}\);/
		);
		expect(rootLayout).toContain('{#key currentLanguageTag}');
	});
});
