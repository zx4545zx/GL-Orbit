import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function source(path: string) {
	return readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
}

describe('public page SEO head contracts', () => {
	it('root layout publishes hreflang alternates for localized routes', async () => {
		const content = await source('src/routes/+layout.svelte');

		expect(content).toContain('buildLanguageAlternates');
		expect(content).toContain('stripLanguageFromPath');
		expect(content).toContain('rel="alternate"');
		expect(content).toContain('hreflang={alternate.hreflang}');
	});

	it('explore pages publish canonical, robots, social metadata, and JSON-LD', async () => {
		const pages = [
			'src/routes/[lang=lang]/(app)/explore/series/+page.svelte',
			'src/routes/[lang=lang]/(app)/explore/artists/+page.svelte'
		];

		for (const path of pages) {
			const content = await source(path);
			expect(content).toContain('buildCanonicalUrl');
			expect(content).toContain('<meta name="robots" content="index, follow" />');
			expect(content).toContain('<link rel="canonical" href={canonicalUrl} />');
			expect(content).toContain('<meta property="og:url" content={canonicalUrl} />');
			expect(content).toContain('jsonLdScript');
		}
	});

	it('core public pages use localized canonical helpers', async () => {
		const pages = [
			'src/routes/[lang=lang]/(app)/+page.svelte',
			'src/routes/[lang=lang]/(app)/calendar/+page.svelte',
			'src/routes/[lang=lang]/(app)/series/+page.svelte',
			'src/routes/[lang=lang]/(app)/artists/+page.svelte',
			'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte',
			'src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte'
		];

		for (const path of pages) {
			const content = await source(path);
			expect(content).toContain('buildCanonicalUrl');
			expect(content).toContain('localizedPath');
			expect(content).toContain('<link rel="canonical" href={canonicalUrl} />');
		}
	});

	it('about page avoids rich-result schema types Google no longer recommends broadly', async () => {
		const content = await source('src/routes/[lang=lang]/(app)/about/+page.svelte');

		expect(content).not.toContain("'@type': 'FAQPage'");
		expect(content).not.toContain("'@type': 'HowTo'");
		expect(content).toContain('buildCanonicalUrl');
	});

	it('countdown page uses localized canonical URLs and structured data', async () => {
		const content = await source('src/routes/[lang=lang]/(app)/countdown/+page.svelte');

		expect(content).toContain("const canonicalPath = '/countdown'");
		expect(content).toContain('buildCanonicalUrl');
		expect(content).toContain('buildWebPageJsonLd');
		expect(content).toContain('jsonLdScript');
	});
});
