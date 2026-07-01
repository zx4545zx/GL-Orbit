import { availableLanguageTags, type AvailableLanguageTag } from './paraglide.js';

function stripLanguagePrefix(path: string): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	const currentLang = availableLanguageTags.find(
		(tag) => normalized === `/${tag}` || normalized.startsWith(`/${tag}/`)
	);

	if (!currentLang) return normalized;
	const stripped = normalized.slice(currentLang.length + 1);
	return stripped || '/';
}

export function switchLanguageHref(currentPath: string, toLang: AvailableLanguageTag): string {
	const strippedPath = stripLanguagePrefix(currentPath);
	return strippedPath === '/' ? `/${toLang}` : `/${toLang}${strippedPath}`;
}

export function localizedHref(href: string, lang: AvailableLanguageTag): string {
	// External links, anchors, mailto, tel
	if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
		return href;
	}

	const strippedPath = stripLanguagePrefix(href);
	return strippedPath === '/' ? `/${lang}` : `/${lang}${strippedPath}`;
}
