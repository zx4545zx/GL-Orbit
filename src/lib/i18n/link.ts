import type { AvailableLanguageTag } from './paraglide.js';

export function localizedHref(href: string, lang: AvailableLanguageTag): string {
	// External links, anchors, mailto, tel
	if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
		return href;
	}

	// Already localized
	if (href.startsWith(`/${lang}/`) || href === `/${lang}`) {
		return href;
	}

	// Root path
	if (href === '/') {
		return `/${lang}`;
	}

	// Add locale prefix
	return `/${lang}${href.startsWith('/') ? href : `/${href}`}`;
}
