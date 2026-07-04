import { describe, expect, it } from 'vitest';
import {
	buildCanonicalUrl,
	buildLanguageAlternates,
	buildWebPageJsonLd,
	localizedPath,
	schemaLanguage,
	stripLanguageFromPath
} from './seo.js';

describe('localized SEO URL helpers', () => {
	it('builds stable localized paths for language-prefixed routes', () => {
		expect(localizedPath('th', '')).toBe('/th');
		expect(localizedPath('en', '/')).toBe('/en');
		expect(localizedPath('th', '/about')).toBe('/th/about');
		expect(localizedPath('en', 'series/abc')).toBe('/en/series/abc');
	});

	it('strips supported language prefixes from current route paths', () => {
		expect(stripLanguageFromPath('/th')).toBe('');
		expect(stripLanguageFromPath('/en/series')).toBe('/series');
		expect(stripLanguageFromPath('/calendar')).toBe('/calendar');
	});

	it('builds canonical and hreflang alternates for Google language discovery', () => {
		expect(buildCanonicalUrl('https://www.gl-orbit.com', 'th', '/calendar')).toBe(
			'https://www.gl-orbit.com/th/calendar'
		);
		expect(buildLanguageAlternates('https://www.gl-orbit.com', '/calendar')).toEqual([
			{ hreflang: 'th', href: 'https://www.gl-orbit.com/th/calendar' },
			{ hreflang: 'en', href: 'https://www.gl-orbit.com/en/calendar' },
			{ hreflang: 'x-default', href: 'https://www.gl-orbit.com/th/calendar' }
		]);
	});

	it('uses valid BCP 47 language tags in JSON-LD', () => {
		expect(schemaLanguage('th')).toBe('th-TH');
		expect(schemaLanguage('en')).toBe('en-US');
		expect(buildWebPageJsonLd('https://www.gl-orbit.com', '/en/about', 'About', 'Guide', 'en'))
			.toMatchObject({ inLanguage: 'en-US', url: 'https://www.gl-orbit.com/en/about' });
	});
});
