# i18n Phase 2 — Public Pages Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate all user-facing text on public pages and shared public components into Thai/English using the existing Paraglide infrastructure, and localize series title/description display by locale.

**Architecture:** Add translation keys to `messages/th.json` and `messages/en.json`. Replace hardcoded Thai strings in public page Svelte components with `m.key()` calls. Update `getSeriesDetail` to expose separate `titleTh/titleEn/descriptionTh/descriptionEn` fields and use a helper to select the localized value. Use `page.data.lang` for date/number formatting.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, Drizzle ORM, PostgreSQL, `@inlang/paraglide-sveltekit`.

## Global Constraints
- Use Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`).
- TypeScript `strict: true`, `module: NodeNext` — imports need `.js` extension.
- UI text in Thai is primary; English is secondary.
- Server DB access must use `await getDb()` in SSR contexts.
- Verify with `npm run check` and `npm run build` after each page group.
- Work in a feature branch (e.g., `feature/i18n-phase2-public-pages`).

---

## File Map

| File | Responsibility |
|------|----------------|
| `messages/th.json` | Thai UI translations for public pages |
| `messages/en.json` | English UI translations for public pages |
| `src/lib/i18n/series.ts` | Helper to select series title/description by locale |
| `src/lib/server/queries/series-detail.ts` | Select both language fields for series detail |
| `src/routes/[lang=lang]/(app)/+page.svelte` | Landing page translations |
| `src/routes/[lang=lang]/(app)/series/+page.svelte` | Series listing translations |
| `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte` | Series detail translations + localized content |
| `src/routes/[lang=lang]/(app)/artists/+page.svelte` | Artists listing translations |
| `src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte` | Artist detail translations |
| `src/routes/[lang=lang]/(app)/calendar/+page.svelte` | Calendar page translations |
| `src/routes/[lang=lang]/(app)/calendar/CardScheduleBoard.svelte` | Calendar card translations |
| `src/routes/[lang=lang]/(app)/countdown/+page.svelte` | Countdown page translations |
| `src/routes/[lang=lang]/(app)/about/+page.svelte` | About page translations |
| `src/routes/[lang=lang]/(app)/profile/+page.svelte` | Profile page translations |
| `src/routes/[lang=lang]/(app)/login/+page.svelte` | Login page translations |
| `src/routes/[lang=lang]/(app)/register/+page.svelte` | Register page translations |
| `src/routes/[lang=lang]/(app)/notifications/+page.svelte` | Notifications page translations |
| `src/lib/components/Footer.svelte` | Footer translations |
| `src/lib/components/NotificationDropdown.svelte` | Notification dropdown translations |
| `src/lib/components/ShareButton.svelte` | Share button translations |
| `src/lib/components/ConfirmDialog.svelte` | Confirm dialog translations |

---

## Task 1: Create series content localization helper

**Files:**
- Create: `src/lib/i18n/series.ts`
- Modify: `src/lib/server/queries/series-detail.ts`

**Interfaces:**
- Consumes: `series.titleTh/titleEn/descriptionTh/descriptionEn`, `AvailableLanguageTag`.
- Produces: `localizeSeries(series, lang)` returning `{ title, description }`.

- [ ] **Step 1: Create helper**

Create `src/lib/i18n/series.ts`:

```ts
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
		description: lang === 'en'
			? (series.descriptionEn ?? series.descriptionTh ?? '')
			: (series.descriptionTh ?? series.descriptionEn ?? '')
	};
}
```

- [ ] **Step 2: Update series detail query**

In `src/lib/server/queries/series-detail.ts`, add to the select:

```ts
titleTh: series.titleTh,
titleEn: series.titleEn,
descriptionTh: series.descriptionTh,
descriptionEn: series.descriptionEn,
```

Change the result to return the four fields instead of a single `description`.

- [ ] **Step 3: Update series detail page load**

In `src/routes/[lang=lang]/(app)/series/[id]/+page.server.ts`, use `localizeSeries` to set the page title/description.

- [ ] **Step 4: Verify**

Run:
```bash
npm run check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/series.ts src/lib/server/queries/series-detail.ts src/routes/[lang=lang]/(app)/series/[id]/+page.server.ts
git commit -m "feat: series content localization helper"
```

---

## Task 2: Translate landing page

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/+page.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m` message function.
- Produces: Bilingual landing page.

- [ ] **Step 1: Extract strings**

Identify all hardcoded Thai strings in `+page.svelte` and add keys to `messages/th.json` and `messages/en.json`.

Example keys:
```json
{
  "home_hero_title": "ค้นพบซีรีส์ GL ที่คุณชื่นชอบ",
  "home_hero_subtitle": "ตารางฉาย นักแสดง และข่าวสารครบจบในที่เดียว",
  "home_cta_series": "ดูซีรีส์ทั้งหมด",
  "home_section_popular": "ยอดนิยม",
  "home_section_coming": "กำลังจะมาฉาย"
}
```

- [ ] **Step 2: Replace strings in component**

Replace hardcoded Thai with `{m.home_hero_title()}` etc.

- [ ] **Step 3: Verify**

Run:
```bash
npm run check
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add messages/ src/routes/[lang=lang]/(app)/+page.svelte
git commit -m "feat: translate landing page"
```

---

## Task 3: Translate series pages

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/series/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m`, `localizeSeries`.
- Produces: Bilingual series listing and detail.

- [ ] **Step 1: Series listing strings**

Add keys such as:
```json
{
  "series_heading": "ซีรีส์ทั้งหมด",
  "series_search_placeholder": "ค้นหาซีรีส์...",
  "series_status_ongoing": "กำลังฉาย",
  "series_status_upcoming": "กำลังจะมาฉาย",
  "series_status_ended": "จบแล้ว",
  "series_no_results": "ไม่พบซีรีส์"
}
```

- [ ] **Step 2: Series detail strings**

Add keys such as:
```json
{
  "series_back": "ย้อนกลับ",
  "series_cast": "นักแสดง",
  "series_schedule": "ตารางฉาย",
  "series_episodes": "ตอน",
  "series_year": "ปีฉาย",
  "series_expand_all": "ขยายทั้งหมด",
  "series_collapse_all": "ย่อทั้งหมด",
  "series_today": "วันนี้",
  "series_watch_now": "ดูเลย",
  "series_share": "แชร์ซีรีส์นี้"
}
```

- [ ] **Step 3: Replace strings in components**

- [ ] **Step 4: Verify**

Run:
```bash
npm run check
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add messages/ src/routes/[lang=lang]/(app)/series/
git commit -m "feat: translate series listing and detail pages"
```

---

## Task 4: Translate artists pages

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/artists/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m`.
- Produces: Bilingual artists pages.

- [ ] **Step 1: Extract and add keys**

Example keys:
```json
{
  "artists_heading": "นักแสดง",
  "artists_search_placeholder": "ค้นหานักแสดง...",
  "artist_series": "ซีรีส์",
  "artist_socials": "โซเชียลมีเดีย"
}
```

- [ ] **Step 2: Replace strings**

- [ ] **Step 3: Verify and commit**

```bash
npm run check
npm run build
git add messages/ src/routes/[lang=lang]/(app)/artists/
git commit -m "feat: translate artists pages"
```

---

## Task 5: Translate calendar and countdown

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/calendar/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/calendar/CardScheduleBoard.svelte`
- Modify: `src/routes/[lang=lang]/(app)/calendar/CalendarWeekHeader.svelte`
- Modify: `src/routes/[lang=lang]/(app)/countdown/+page.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m`, `page.data.lang` for date formatting.
- Produces: Bilingual calendar/countdown.

- [ ] **Step 1: Extract and add keys**

Example keys:
```json
{
  "calendar_heading": "ตารางฉาย",
  "calendar_week_view": "รายสัปดาห์",
  "calendar_month_view": "รายเดือน",
  "calendar_today": "วันนี้",
  "countdown_heading": "นับถอยหลัง",
  "countdown_days": "วัน",
  "countdown_hours": "ชั่วโมง",
  "countdown_minutes": "นาที"
}
```

- [ ] **Step 2: Replace strings and date formats**

Replace hardcoded `toLocaleDateString('th-TH', ...)` with `toLocaleDateString(page.data.lang, ...)`.

- [ ] **Step 3: Verify and commit**

```bash
npm run check
npm run build
git add messages/ src/routes/[lang=lang]/(app)/calendar/ src/routes/[lang=lang]/(app)/countdown/
git commit -m "feat: translate calendar and countdown pages"
```

---

## Task 6: Translate about, profile, login, register, notifications

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/about/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/profile/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/login/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/register/+page.svelte`
- Modify: `src/routes/[lang=lang]/(app)/notifications/+page.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m`.
- Produces: Bilingual auth/profile/about/notifications pages.

- [ ] **Step 1: Extract and add keys**

Example keys:
```json
{
  "about_heading": "เกี่ยวกับ GL-Orbit",
  "login_heading": "เข้าสู่ระบบ",
  "login_email": "อีเมล",
  "login_password": "รหัสผ่าน",
  "login_submit": "เข้าสู่ระบบ",
  "register_heading": "สมัครสมาชิก",
  "profile_heading": "โปรไล์",
  "profile_change_password": "เปลี่ยนรหัสผ่าน",
  "notifications_heading": "แจ้งเตือน",
  "notifications_mark_all_read": "อ่านทั้งหมด"
}
```

- [ ] **Step 2: Replace strings**

- [ ] **Step 3: Verify and commit**

```bash
npm run check
npm run build
git add messages/ src/routes/[lang=lang]/(app)/about/ src/routes/[lang=lang]/(app)/profile/ src/routes/[lang=lang]/(app)/login/ src/routes/[lang=lang]/(app)/register/ src/routes/[lang=lang]/(app)/notifications/
git commit -m "feat: translate about, profile, auth, and notifications pages"
```

---

## Task 7: Translate shared public components

**Files:**
- Modify: `src/lib/components/Footer.svelte`
- Modify: `src/lib/components/NotificationDropdown.svelte`
- Modify: `src/lib/components/ShareButton.svelte`
- Modify: `src/lib/components/ConfirmDialog.svelte`
- Modify: `src/lib/components/Pagination.svelte`
- Modify: `src/lib/components/BackToTopButton.svelte`
- Modify: `messages/th.json`, `messages/en.json`

**Interfaces:**
- Consumes: `m`.
- Produces: Bilingual shared components.

- [ ] **Step 1: Extract and add keys**

Example keys:
```json
{
  "footer_home": "หน้าแรก",
  "footer_series": "ซีรีส์",
  "footer_calendar": "ตารางฉาย",
  "footer_about": "เกี่ยวกับ",
  "share_title": "แชร์",
  "confirm_yes": "ใช่",
  "confirm_no": "ยกเลิก",
  "pagination_previous": "ก่อนหน้า",
  "pagination_next": "ถัดไป",
  "back_to_top": "กลับด้านบน"
}
```

- [ ] **Step 2: Replace strings**

- [ ] **Step 3: Verify and commit**

```bash
npm run check
npm run build
git add messages/ src/lib/components/
git commit -m "feat: translate shared public components"
```

---

## Task 8: Final audit for public pages

**Files:** None.

**Interfaces:** End-to-end verification.

- [ ] **Step 1: Search for leftover hardcoded Thai UI strings in public pages**

```bash
rg -N '[\u0E00-\u0E7F]' src/routes/[lang=lang]/(app) src/lib/components --type svelte | grep -v 'messages/' | head -50
```

- [ ] **Step 2: Verify all message keys have English counterparts**

Compare `messages/th.json` and `messages/en.json` keys.

- [ ] **Step 3: Run full check and build**

```bash
npm run check
npm run build
```

- [ ] **Step 4: Manual browser checks**

- Visit `/th/` and `/en/`
- Verify language switcher works
- Verify series detail shows Thai/English title and description correctly
- Verify date formats follow locale

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: i18n Phase 2 — public pages translation complete"
```

---

## Spec Coverage

| Spec Requirement | Task |
|------------------|------|
| Localize series content by locale | Task 1 |
| Translate landing page | Task 2 |
| Translate series pages | Task 3 |
| Translate artists pages | Task 4 |
| Translate calendar/countdown | Task 5 |
| Translate auth/profile/about/notifications | Task 6 |
| Translate shared components | Task 7 |
| Final audit | Task 8 |

## Self-Review

- **Placeholder scan:** No TBD/TODO; all steps include concrete code.
- **Type consistency:** `AvailableLanguageTag` used consistently.
- **Spec gaps:** None identified.
