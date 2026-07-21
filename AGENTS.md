<!-- From: /Users/syaco/workspace/private/AGENTS.md -->
# AGENTS.md — GL-Orbit

คู่มือทำงานสำหรับ AI coding agents ใน repository นี้ ข้อมูลในไฟล์นี้ต้องสอดคล้องกับ source code ปัจจุบัน

## Project Snapshot

GL-Orbit เป็น SvelteKit web app สำหรับแฟนซีรีส์ GL ครอบคลุมฐานข้อมูลซีรีส์/ศิลปิน/คู่จิ้น ตารางฉาย ชุมชน Orbit Halo, AI Chat, การแจ้งเตือน และ Subscription Tracker

สถานะปัจจุบัน:

- Public catalog, calendar/countdown, profile, favorites/watched ใช้ฐานข้อมูลจริง
- Orbit Halo, notifications, AI Chat และ Subscription Tracker มี server/API/database implementation แล้ว
- Admin ใช้ protected live CRUD APIs ไม่ใช่ mock data
- UI รองรับภาษาไทย/อังกฤษ, light/dark theme, PWA และ responsive layout
- มี Vitest suite สำหรับ components, routes, APIs, server utilities, schema, SEO และ PWA

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2.x, Svelte 5 Runes |
| Language | TypeScript 5.8, `strict`, `NodeNext` |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Database | Neon PostgreSQL via `@neondatabase/serverless` |
| ORM | Drizzle ORM 0.43 / Drizzle Kit |
| Auth | Custom JWT HS256 (`jose`) + bcrypt |
| i18n | Paraglide SvelteKit, Thai + English |
| Testing | Vitest 4 + Testing Library Svelte |
| PWA | `@vite-pwa/sveltekit`, injectManifest service worker |
| Media | Cloudflare R2 + Sharp |
| Deployment | Vercel adapter, region `sin1` |

## Commands

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run check
npm run check:watch
npm run i18n:compile
npm run db:generate
npm run db:push
npm run db:studio
```

Seed commands:

```bash
npx tsx scripts/seed-admin.ts --email=admin@example.com --password=SECRET --username=admin
npx tsx scripts/seed-data.ts
```

`seed-data.ts` ทำลายข้อมูลตัวอย่างเดิมก่อน seed ใหม่ แม้จะคง ADMIN users ไว้ ห้ามรันโดยไม่ตรวจ target database

## Environment

ดูรูปแบบทั้งหมดใน `.env.example`

- Core: `DATABASE_URL`, `AUTH_SECRET`
- AI Chat: `READONLY_DATABASE_URL`, `MINIMAX_API_KEY`, `MINIMAX_API_BASE_URL`, `MINIMAX_MODEL`
- Web Push: VAPID server keys + `VITE_VAPID_PUBLIC_KEY`
- Media: Cloudflare R2 endpoint, credentials, bucket และ public URL

ห้ามอ่าน แสดง log หรือ commit ค่าจาก `.env` จริง ใช้เครื่องมือที่ไม่เปิดเผย secret เมื่อจำเป็นต้องตรวจ env

## Routes and Data Flow

ทุกหน้า user-facing อยู่ใต้ `src/routes/[lang=lang]/` และใช้ URL `/th/*` หรือ `/en/*`

```txt
[lang=lang]/
├── (app)/
│   ├── home, about, menus
│   ├── series/[id], artists/[id], ships/[id], explore/*
│   ├── calendar, countdown, notifications
│   ├── subscriptions, subscriptions/new, subscriptions/[id]/edit
│   └── login, register, profile
├── (orbit-halo)/halo/
│   ├── feed, explore, compose, saved, notifications
│   ├── moments/[id], moments/[id]/edit
│   └── u/[username], profile/moments
├── (chat)/chat/[id]
├── admin/
└── logout/
```

Top-level routes:

- `src/routes/api/` — auth, catalog, member, subscription, chat, moments, notification และ admin APIs
- `src/routes/robots.txt/`, `sitemap.xml/`, `llms.txt/`, `og-image/` — SEO/crawler assets

Request flow:

1. `src/hooks.server.ts` validates `session` cookie.
2. Locale comes from URL → user preference → cookie → `Accept-Language` fallback.
3. Non-localized browser routes redirect to `/{lang}/*`; API and special routes are excluded.
4. Page server load or API handler calls query/service layer.
5. Server code obtains Drizzle through `await getDb()`.

## Database Architecture

Source of truth: `src/lib/server/db/schema.ts` (39 tables)

- Identity: users, sessions
- Catalog: studios/socials, platforms, artists/socials, ships, series, galleries, genres และ joins
- Scheduling: series schedules, episodes, episode schedules
- User library: favorites, watched
- Subscriptions: currencies, user subscriptions, payments, budgets
- Orbit Halo: moments, media, likes, bookmarks, comments, entity joins, reports, moderation actions
- Notifications: notifications, push subscriptions
- Chat: conversations, messages, conversation-message history
- Safety: PostgreSQL-backed rate-limit windows

Conventions:

- UUID primary keys via `defaultRandom()`
- Soft-delete queries ต้อง filter `deletedAt` เมื่อ table รองรับ
- Actual air times use timezone-aware timestamps
- Use Drizzle expressions/parameters; never interpolate untrusted SQL
- Server files must use `const db = await getDb()`; the async `db` proxy is unsafe in Vite SSR
- Schema change requires `npm run db:generate`, review migration, then explicit approval before `npm run db:push`

## Authentication and Authorization

- Session JWT: HS256, 30 days, 60-second clock tolerance
- Cookie: `session`, `httpOnly`, production-secure, `sameSite=lax`, root path
- Session DB row stores SHA-256 token hash, not raw JWT
- Passwords use bcrypt 12 rounds
- Roles: `USER`, `ADMIN`; disabled users fail validation
- `src/routes/[lang=lang]/admin/+layout.server.ts` guards admin pages
- Every `/api/admin/*` endpoint must independently enforce ADMIN role
- Member-owned resources (subscriptions, conversations, moments) must scope reads/mutations by `locals.user.id`

## Major Server Modules

- `src/lib/server/auth/` — password, user, session
- `src/lib/server/db/` — connection and schema
- `src/lib/server/queries/` — calendar/listing page queries
- `src/lib/server/series/`, `ships/` — catalog domain logic
- `src/lib/server/subscriptions/` — validation, queries, mutations, summary
- `src/lib/server/moments/` — Halo queries, mutations, permissions, serializers
- `src/lib/server/chat/` — deterministic answers, history, context, SQL safety
- `src/lib/server/embeds/` — external URL normalization/security/resolution
- `src/lib/server/images/`, `r2.ts` — image processing/storage
- `src/lib/server/rate-limit/`, `security/` — abuse prevention and CSP helpers
- `src/lib/server/notifications.ts`, `push-notifications.ts` — in-app/Web Push

## i18n

- Source messages: `messages/th.json`, `messages/en.json`
- Generated output: `src/lib/i18n/paraglide/`; do not hand-edit generated files
- After message changes run `npm run i18n:compile` or `npm run check`
- User-facing copy and errors need both Thai and English keys unless intentionally language-specific
- Build localized links with project helpers; do not hardcode non-localized public URLs

## Svelte and TypeScript Conventions

- Use `<script lang="ts">` and Svelte 5 Runes (`$props`, `$state`, `$derived`, `$effect`)
- Do not add legacy `export let`
- Use `$bindable()` only for intentional two-way bindings
- NodeNext imports include `.js` for local TypeScript modules
- Import generated route types from `./$types.js`
- Prefer typed server loads/actions and explicit API response shapes
- Preserve SSR/client boundaries; browser globals require client-safe execution

## Orbit Editorial Design System

- Reuse tokens from `src/app.css`: `--orbit-paper`, `--orbit-surface`, `--orbit-line`, `--orbit-line-strong`, semantic coral/lavender/mint/plum colors
- Edited/new cards, controls, menus, modals and image frames remain rectangular; no decorative `rounded-*`
- Circles only for inherently circular data such as avatars/status dots, marked `.orbit-round-data`
- Avoid generic card soup, pills, gradient blobs, rainbow dividers and heavy shadows
- Use shared grids/borders for information hierarchy; no decorative `<hr>`
- Buttons and icon actions need visible focus, disabled/loading states and minimum 44×44px touch target
- Verify mobile at narrow width, desktop, light/dark theme, keyboard focus and reduced motion

Pending Shell components were intentionally removed. Layouts render children directly. Do not restore navigation skeleton switching without a new explicit requirement.

## Testing and Validation

Tests are colocated as `*.test.ts` across `src/`.

For focused changes:

1. Run nearest Vitest file(s), e.g. `npm test -- path/to/file.test.ts`.
2. Run `npm run check` for Svelte/TypeScript/i18n validation.
3. Run `git diff --check`.
4. Use full `npm test` and/or `npm run build` when blast radius justifies it.
5. UI work should be browser-checked at relevant mobile/desktop widths and themes.

Do not claim success from intent; report command result and distinguish pre-existing warnings from new failures.

## Security Rules

- Never expose `DATABASE_URL`, `READONLY_DATABASE_URL`, `AUTH_SECRET`, API keys, VAPID private key or R2 credentials
- Preserve ownership checks, ADMIN guards, CSRF-safe SvelteKit patterns and URL validation
- Treat `@html`, external embeds, uploads, redirects and SQL generation as security-sensitive
- AI Chat must use the read-only database connection and existing SQL safety layer
- Destructive DB/seed/migration operations require explicit user approval and verified target
- CSP lives in `svelte.config.js`; new external origins require narrow, justified directives

## Agent Notes

- Start from current source, not old assumptions. Calendar and Admin are live, not mocks.
- Thai and English are both supported; Thai remains primary product voice.
- Keep changes scoped. No unrelated refactors, dependencies or visual churn.
- Preserve user-owned data boundaries in subscriptions, chat and Halo.
- Do not commit generated screenshots or local debug artifacts unless explicitly requested.
- Update README.md, AGENTS.md and CLAUDE.md when architecture, commands, env requirements or major feature status changes.
