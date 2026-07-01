# Design: i18n System for GL-Orbit

**Date:** 2026-07-01  
**Project:** GL-Orbit  
**Status:** Approved

## Goal
Make GL-Orbit fully bilingual (Thai and English) with URL-based locales, persisted user language preference, and type-safe translations across public pages, admin pages, and shared components.

## Decisions

### Language Support
- **Primary:** Thai (`th`)
- **Secondary:** English (`en`)
- **Default locale:** `th`

### URL Strategy
- All routes prefixed with locale: `/th/series`, `/en/series`, `/th/admin/series`, `/en/admin/series`
- Bare routes (e.g., `/series`) redirect to localized route based on detection
- SEO-friendly: each language has its own canonical URL

### Locale Detection Order
1. URL path segment (`/th/...` or `/en/...`)
2. Logged-in user preference from `users.preferred_language`
3. Cookie `locale`
4. Browser `Accept-Language` header
5. Default `th`

### Preference Persistence
- **Guests:** stored in cookie `locale` (1 year, path `/`, sameSite lax)
- **Logged-in users:** stored in `users.preferred_language` column; cookie mirrors DB value
- Language switcher updates both cookie and DB (when logged in)

### Library
- Use `@inlang/paraglide-sveltekit`
- Type-safe message keys and routing integration
- Messages stored in `messages/th.json` and `messages/en.json`

### Content Strategy
- **UI text:** full translation via Paraglide message files
- **Series content:** use existing `titleTh/titleEn` and `descriptionTh/descriptionEn` columns with a locale-based selector helper
- **Dates/numbers:** use `toLocaleDateString` / `toLocaleTimeString` with current locale instead of hardcoded `th-TH`
- **SEO:** `SITE_LOCALE`, `DEFAULT_OG_IMAGE` descriptions, and `<html lang>` become dynamic per locale

### Components
- `LanguageSwitcher.svelte` — placed in `Navigation.svelte`, `BottomNav.svelte`, and admin header
- `LocalizedLink.svelte` — wrapper around `<a>` to preserve current locale
- `localizedSeries(series, locale)` helper — selects title/description by locale

## Schema Change
```sql
ALTER TABLE "users" ADD COLUMN "preferred_language" varchar(10) DEFAULT 'th';
```

## File Map

| File | Responsibility |
|------|----------------|
| `project.inlang/` | Paraglide project settings |
| `messages/th.json` | Thai UI translations |
| `messages/en.json` | English UI translations |
| `src/lib/i18n/paraglide.ts` | Paraglide re-exports and helpers |
| `src/lib/i18n/series.ts` | Content localization helper for series |
| `src/lib/components/LanguageSwitcher.svelte` | Language toggle UI |
| `src/lib/components/LocalizedLink.svelte` | Link that preserves locale |
| `src/hooks.server.ts` / `src/hooks.ts` | Locale detection and redirect |
| `src/routes/+layout.svelte` | Dynamic `<html lang>` and SEO locale |
| `src/routes/+page.server.ts` | Redirect `/` to localized home |
| `src/lib/server/db/schema.ts` | Add `preferredLanguage` to users |
| `src/routes/profile/+page.server.ts` | Save language preference |
| Various `+page.svelte` files | Replace hardcoded Thai with message keys |

## Phased Implementation

### Phase 1 — Foundation
- Install and configure `@inlang/paraglide-sveltekit`
- Set up project languages (`th`, `en`)
- Configure URL routing (`/th/*`, `/en/*`)
- Implement locale detection hook
- Add `users.preferred_language` column and migration
- Create `LanguageSwitcher` component
- Localize navigation, footer, and landing page

### Phase 2 — Public Pages
- Localize series listing and detail pages
- Wire series content (`titleTh/titleEn`, `descriptionTh/descriptionEn`) to locale
- Localize artists, calendar, profile, countdown, about, notifications pages
- Make SEO meta dynamic per locale

### Phase 3 — Admin Pages
- Localize admin login, series list/detail, artists, studios, platforms, schedules, episodes
- Localize admin shared components

### Phase 4 — Polish
- Localize remaining shared components (dialogs, forms, buttons, badges)
- Replace hardcoded `th-TH` date formats with locale-aware formatting
- Audit for leftover hardcoded Thai strings
- Run full `npm run check` and `npm run build`

## Backward Compatibility
- Existing DB fields for series content remain unchanged
- Default locale `th` preserves current behavior
- Users without `preferred_language` default to `th`
- Old bare URLs redirect to localized versions (301)

## Testing Strategy
- No existing test suite
- Verify with `npm run check` and `npm run build` after each phase
- Manual browser checks for `/th/...` and `/en/...` routes
- Verify language switcher updates cookie and DB
- Verify `<html lang>` and SEO meta tags per locale
