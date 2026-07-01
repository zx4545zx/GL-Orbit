import { availableLanguageTags, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';

export const DEFAULT_LOCALE: AvailableLanguageTag = 'th';

export function detectLocale(options: {
	urlLocale?: string | null;
	cookieLocale?: string | null;
	userLocale?: string | null;
	acceptLanguage?: string | null;
}): AvailableLanguageTag {
	const { urlLocale, cookieLocale, userLocale, acceptLanguage } = options;

	if (urlLocale && isAvailable(urlLocale)) return urlLocale;
	if (userLocale && isAvailable(userLocale)) return userLocale as AvailableLanguageTag;
	if (cookieLocale && isAvailable(cookieLocale)) return cookieLocale as AvailableLanguageTag;

	if (acceptLanguage) {
		const primary = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
		if (primary && isAvailable(primary)) return primary as AvailableLanguageTag;
	}

	return DEFAULT_LOCALE;
}

function isAvailable(tag: string): tag is AvailableLanguageTag {
	return availableLanguageTags.includes(tag as AvailableLanguageTag);
}
