import { availableLanguageTags } from '$lib/i18n/paraglide.js';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return availableLanguageTags.includes(param as 'th' | 'en');
};
