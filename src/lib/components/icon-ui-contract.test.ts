import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const localeKeys = [
	'home_zine_tagline',
	'series_detail_seo_title',
	'series_detail_seo_fallback',
	'series_share_title',
	'series_share_text',
	'artist_detail_seo_title',
	'artist_detail_seo_description',
	'artist_share_title',
	'artist_share_text',
	'artist_ship_featured',
	'login_subtitle',
	'register_subtitle',
	'footer_made_with'
] as const;

describe('UI icon contract', () => {
	it('uses accessible shared SVG icon primitives', () => {
		for (const path of [
			'src/lib/components/OrbitIcon.svelte',
			'src/lib/components/moments/HaloIcon.svelte'
		]) {
			const source = readFileSync(path, 'utf8');
			expect(source).toContain('aria-hidden="true"');
			expect(source).toContain('focusable="false"');
		}
	});

	it('keeps decorative emoji out of localized UI and share copy', () => {
		for (const locale of ['en', 'th']) {
			const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<string, string>;

			for (const key of localeKeys) {
				expect(messages[key], `${locale}.${key}`).not.toMatch(/[♡★🌸🌷💕💖👋]/u);
			}
		}
	});

	it('preserves the intentional moment emoji picker', () => {
		const composer = readFileSync('src/lib/components/moments/MomentComposer.svelte', 'utf8');
		expect(composer).toContain('const emojiOptions');
		expect(composer).toContain("'✨'");
		expect(composer).toContain("'🎬'");
	});
});
