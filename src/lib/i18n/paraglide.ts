import { setLocale } from './paraglide/runtime.js';

export * as m from './paraglide/messages.js';
export {
	getLocale as languageTag,
	locales as availableLanguageTags
} from './paraglide/runtime.js';
export type AvailableLanguageTag = (typeof import('./paraglide/runtime.js').locales)[number];

export const setLanguageTag = setLocale as (
	newLocale: AvailableLanguageTag,
	options?: { reload?: boolean }
) => void | Promise<void>;
