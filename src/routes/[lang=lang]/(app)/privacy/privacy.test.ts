import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const policyPage = readFileSync('src/routes/[lang=lang]/(app)/privacy/+page.svelte', 'utf8');
const footer = readFileSync('src/lib/components/Footer.svelte', 'utf8');
const thaiMessages = JSON.parse(readFileSync('messages/th.json', 'utf8')) as Record<string, string>;
const englishMessages = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<string, string>;

describe('privacy policy page', () => {
	it('publishes a localized, indexable policy from the site footer', () => {
		expect(policyPage).toContain("const canonicalPath = '/privacy'");
		expect(policyPage).toContain('<meta name="robots" content="index, follow" />');
		expect(policyPage).toContain('m.privacy_section_data()');
		expect(policyPage).toContain('m.privacy_section_controls()');
		expect(policyPage).toContain('/{page.data.lang}/security/session');
		expect(footer).toContain('/{page.data.lang}/privacy');
	});

	it('keeps every privacy message available in Thai and English', () => {
		const thaiKeys = Object.keys(thaiMessages).filter((key) => key.startsWith('privacy_')).sort();
		const englishKeys = Object.keys(englishMessages).filter((key) => key.startsWith('privacy_')).sort();

		expect(thaiKeys).toEqual(englishKeys);
		expect(thaiKeys.length).toBeGreaterThan(40);
	});
});
