import type { AvailableLanguageTag } from './paraglide.js';

interface LocalizableSeries {
	titleTh: string | null;
	titleEn: string | null;
	descriptionTh: string | null;
	descriptionEn: string | null;
}

export function localizeSeries(series: LocalizableSeries, lang: AvailableLanguageTag) {
	return {
		title: lang === 'en' ? (series.titleEn ?? series.titleTh ?? '') : (series.titleTh ?? series.titleEn ?? ''),
		description:
			lang === 'en'
				? (series.descriptionEn ?? series.descriptionTh ?? '')
				: (series.descriptionTh ?? series.descriptionEn ?? '')
	};
}
