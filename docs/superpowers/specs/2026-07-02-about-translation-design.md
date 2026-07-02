# About Page Full i18n Translation — Design Spec

**Date:** 2026-07-02  
**Author:** AI Agent  
**Status:** Pending implementation review

## Problem Statement

The `/about` page (`src/routes/[lang=lang]/(app)/about/+page.svelte`) already uses Paraglide i18n for headings, badges, and CTA labels, but the main content blocks are still hardcoded in Thai. As a result, switching the site language to English (`/en/about`) leaves the page body in Thai.

Additionally, there is a rendering bug in the AI answer block where the question is literally `'{m.about_guide_title()}?'` instead of calling the message function.

## Goal

Make `/about` fully bilingual (Thai/English) by moving all hardcoded Thai content into Paraglide message files and calling the message functions in the Svelte component. Fix the string-literal bug in the AI answer block.

## Files to Modify

1. `src/routes/[lang=lang]/(app)/about/+page.svelte` — replace hardcoded strings with `m.*()` calls.
2. `src/lib/i18n/paraglide/messages/th.js` — keep Thai strings (moved from component).
3. `src/lib/i18n/paraglide/messages/en.js` — add English translations.

## Out of Scope

- No visual or layout changes.
- No new languages other than `th` and `en`.
- No refactor of the global i18n plumbing (language tag detection, routing, etc.).

## Detailed Design

### 1. Message Key Naming Convention

All new keys are prefixed with `about_` and grouped by section.

| Section | Key Pattern | Count |
|---------|-------------|-------|
| Hero lede | `about_hero_lede_1` … `about_hero_lede_4`, `about_pullquote` | 5 |
| Guide cards | `about_guide_card_{n}_title`, `about_guide_card_{n}_desc` | 6 |
| How-to steps | `about_howto_step_{n}_name`, `about_howto_step_{n}_text` | 8 |
| GL 101 | `about_gl101_card_{n}_title`, `about_gl101_card_{n}_desc` | 8 |
| Platforms | `about_platform_{n}_name`, `about_platform_{n}_desc` | 10 |
| AI answers | `about_ai_q_{n}`, `about_ai_a_{n}` | 8 |
| FAQ | `about_faq_q_{n}`, `about_faq_a_{n}` | 14 |
| SEO / JSON-LD | `about_seo_description` | 1 |

### 2. Component Changes

- Replace Thai strings in `homepageGuideCards`, `homepageFaqs`, `glKnowledgeCards`, `platformCards`, `aiAnswerBlocks`, `howToSteps`, and the editorial lede with `m.*()` calls.
- Replace hardcoded CTA text with existing `m.about_cta_schedule()` and `m.about_cta_home()`.
- Fix `aiAnswerBlocks[0].question` from `'{m.about_guide_title()}?'` to `m.about_ai_q_1()` (new key: `about_ai_q_1`).
- Use `m.about_seo_description()` for `ABOUT_SEO_DESCRIPTION` and remove the hardcoded Thai string.
- Keep `LAST_UPDATED` as ISO date (`2026-06-30`) for JSON-LD.
- Use `m.about_last_updated({ date: m.about_last_updated_date() })` for the hero last-updated line. Add `about_last_updated_date` key with value `30 มิถุนายน 2026` in Thai and `June 30, 2026` in English. This preserves the existing i18n pattern and lets both language and date format switch together.

### 3. Translation Strategy

- Thai messages are the existing content, moved verbatim into `messages/th.js` to preserve current behavior for `/th/about`.
- English messages are natural, fluent translations that fit the GL-Orbit tone and SEO intent for `/en/about`.
- Brand/platform names (YouTube, iQIYI, GagaOOLala, WeTV, GL-Orbit, Girls' Love) stay as-is.

### 4. JSON-LD / SEO

- `ABOUT_SEO_DESCRIPTION` will use `m.about_seo_description()`.
- JSON-LD `inLanguage` already switches based on route; the strings inside `articleSection` and `keywords` will be translated via message keys so English pages emit English keywords.

### 5. Validation

- `npm run check` must pass.
- Build must succeed.
- Visual spot-check: `/th/about` displays Thai, `/en/about` displays English.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Many new keys make the message files long. | Group keys by section and keep consistent naming. |
| Typos in message keys break the build. | Run `npm run check` immediately after editing. |
| Escaped quotes in strings cause syntax issues. | Use backtick template literals in message files. |

## Approval

Implementation proceeds after this design spec is approved by the user.
