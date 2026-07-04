import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';

export const SITE_NAME = 'GL-Orbit';
export const SITE_LOCALE = 'th_TH';
export const DEFAULT_SEO_TITLE = 'GL-Orbit | ตารางฉายซีรีส์ GL ครบทุกแพลตฟอร์ม ข้อมูลนักแสดง';
export const DEFAULT_SEO_DESCRIPTION = 'ศูนย์กลางข้อมูลซีรีส์ Girls\' Love อัปเดตใหม่ล่าสุด พร้อมตารางฉาย เวลาออกอากาศตามเขตเวลาไทย แพลตฟอร์มรับชม และข้อมูลนักแสดงสำหรับแฟนคลับ GL';
export const DEFAULT_OG_IMAGE = '/og-image';
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_TYPE = 'image/svg+xml';

const SEO_LANGUAGE_TAGS: AvailableLanguageTag[] = ['th', 'en'];

export function absoluteUrl(origin: string, path: string): string {
	return new URL(path, origin).toString();
}

export function localizedPath(lang: AvailableLanguageTag, path: string): string {
	const normalizedPath = path === '' || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
	return `/${lang}${normalizedPath}`;
}

export function stripLanguageFromPath(pathname: string): string {
	const segments = pathname.split('/').filter(Boolean);
	const [firstSegment, ...rest] = segments;

	if (SEO_LANGUAGE_TAGS.includes(firstSegment as AvailableLanguageTag)) {
		return rest.length > 0 ? `/${rest.join('/')}` : '';
	}

	return pathname === '/' ? '' : pathname;
}

export function buildCanonicalUrl(origin: string, lang: AvailableLanguageTag, path: string): string {
	return absoluteUrl(origin, localizedPath(lang, path));
}

export function buildLanguageAlternates(origin: string, path: string): Array<{ hreflang: string; href: string }> {
	return [
		...SEO_LANGUAGE_TAGS.map((lang) => ({
			hreflang: lang,
			href: buildCanonicalUrl(origin, lang, path)
		})),
		{
			hreflang: 'x-default',
			href: buildCanonicalUrl(origin, 'th', path)
		}
	];
}

export function schemaLanguage(lang: AvailableLanguageTag): string {
	return lang === 'en' ? 'en-US' : 'th-TH';
}

export function safeJsonLd(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

/**
 * Wrap an already-escaped JSON-LD string (output of `safeJsonLd`) in a
 * `<script type="application/ld+json">` tag, ready for `{@html ...}`.
 *
 * Svelte treats `<script>` element bodies as raw text and does NOT evaluate
 * `{...}` expressions inside them, so `<script>{json}</script>` emits the
 * literal string `{json}`. Rendering the entire tag via `{@html}` is the
 * correct approach. Input MUST be pre-escaped (e.g. via `safeJsonLd`) so a
 * `</script>` sequence in the data cannot break out of the element.
 */
export function jsonLdScript(jsonLdString: string): string {
	return `<script type="application/ld+json">${jsonLdString}<\/script>`;
}

export function truncateSeo(text: string, maxLength = 155): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildBreadcrumbJsonLd(origin: string, items: Array<{ name: string; path: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(origin, item.path)
		}))
	};
}

export function buildWebPageJsonLd(
	origin: string,
	path: string,
	name: string,
	description: string,
	lang: AvailableLanguageTag = 'th'
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name,
		description,
		url: absoluteUrl(origin, path),
		inLanguage: schemaLanguage(lang),
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: absoluteUrl(origin, '/')
		}
	};
}

// i18n helpers
export function siteLocale(lang: AvailableLanguageTag): string {
	return lang === 'en' ? 'en_US' : 'th_TH';
}

export function defaultSeoTitle(lang: AvailableLanguageTag): string {
	return lang === 'en'
		? 'GL-Orbit | GL Series Schedule, Cast & Streaming Platforms'
		: DEFAULT_SEO_TITLE;
}

export function defaultSeoDescription(lang: AvailableLanguageTag): string {
	return lang === 'en'
		? 'Your hub for Girls\' Love series schedules, cast info, airing times, and streaming platforms for GL fans worldwide.'
		: DEFAULT_SEO_DESCRIPTION;
}
