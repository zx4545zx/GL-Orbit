export * as m from './paraglide/messages.js';
export {
	getLocale as languageTag,
	locales as availableLanguageTags,
	setLocale as setLanguageTag
} from './paraglide/runtime.js';
export type AvailableLanguageTag = (typeof import('./paraglide/runtime.js').locales)[number];
