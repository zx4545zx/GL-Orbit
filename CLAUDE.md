# CLAUDE.md

Guidance for Claude Code when working in GL-Orbit. Read `AGENTS.md` for the full project contract; this file keeps the highest-impact commands and invariants.

## Optional graphify workflow

If `graphify-out/graph.json` exists:

- Use `graphify query "<question>"` for scoped codebase questions.
- Use `graphify path "<A>" "<B>"` for relationships.
- Use `graphify explain "<concept>"` for focused concepts.
- Prefer `graphify-out/wiki/index.md` for broad navigation.
- Run `graphify update .` after code changes.

Do not assume graph artifacts exist; use normal repository tools when absent.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run check
npm run i18n:compile
npm run db:generate
npm run db:push
npm run db:studio

npx tsx scripts/seed-admin.ts --email=admin@example.com --password=SECRET --username=admin
npx tsx scripts/seed-data.ts
```

`seed-data.ts` is destructive to seeded application data. Database pushes and seed commands require verified target and explicit approval.

## Current Architecture

- SvelteKit 2 + Svelte 5 Runes + TypeScript 5.8 (`strict`, `NodeNext`)
- Tailwind CSS 4 with tokens/utilities in `src/app.css`
- Neon PostgreSQL + Drizzle ORM; schema at `src/lib/server/db/schema.ts`
- Custom JWT/bcrypt auth in `src/lib/server/auth/`
- Paraglide Thai/English i18n (`messages/`, `src/lib/i18n/`)
- Vitest + Testing Library Svelte
- PWA/Web Push via `src/service-worker.ts`
- R2/Sharp media pipeline and Vercel deployment in `sin1`

All major product areas are code-backed, not mock-only: catalog, calendar/countdown, admin CRUD, Orbit Halo, notifications, AI Chat and Subscription Tracker.

## Routes

```txt
src/routes/
├── [lang=lang]/
│   ├── (app)/            # Home, catalog, calendar, subscriptions, auth/profile
│   ├── (orbit-halo)/     # Community feed, compose, moments, saved, profiles
│   ├── (chat)/           # Chat list and conversation
│   ├── admin/            # ADMIN-only UI
│   └── logout/
├── api/                  # Public/member/admin APIs
├── robots.txt/ · sitemap.xml/ · llms.txt/
└── og-image/
```

User-facing pages use `/th/*` or `/en/*`. `src/hooks.server.ts` validates session, detects locale and redirects non-localized browser routes. Build links with localized helpers.

## Critical Patterns

### Database

- In server code always use `const db = await getDb()` from `src/lib/server/db/index.ts`.
- Do not use the async `db` proxy in SvelteKit SSR handlers.
- Filter soft-deleted rows where applicable.
- Use Drizzle parameters; never interpolate untrusted SQL.
- Schema changes: generate and review migration before approved push.

### Auth and ownership

- JWT: HS256, 30-day expiry; DB stores SHA-256 token hash.
- Passwords: bcrypt 12 rounds.
- Roles: `USER`, `ADMIN`; disabled users are rejected.
- Admin layout guards pages, but every `/api/admin/*` endpoint must enforce ADMIN independently.
- Scope subscription/chat/Halo resources by `locals.user.id`.
- AI Chat database context must use `READONLY_DATABASE_URL` and existing SQL-safety code.

### Svelte and i18n

- Use Svelte 5 Runes; never add legacy `export let`.
- Local TS imports include `.js`; route types come from `./$types.js`.
- Add/update both `messages/th.json` and `messages/en.json`, then run `npm run i18n:compile`.
- Do not hand-edit generated files under `src/lib/i18n/paraglide/`.
- Keep browser-only APIs behind client-safe execution.

### Orbit Editorial UI

- Rectangular surfaces and controls; no decorative rounded cards/pills.
- Reuse `--orbit-*` tokens and structural borders from `src/app.css`.
- No gradient blobs, rainbow dividers, heavy shadows or repeated generic cards.
- Minimum 44×44px touch targets, visible keyboard focus, responsive reflow, light/dark support and reduced-motion behavior.
- Pending Shell components were intentionally removed; layouts render children directly.

## Key Domains

- `src/lib/server/series/`, `ships/`, `queries/` — catalog/calendar
- `src/lib/server/subscriptions/` + `src/lib/subscriptions/` — subscriptions, payments, budgets, calculations
- `src/lib/server/moments/` + `src/lib/components/moments/` — Orbit Halo
- `src/lib/server/chat/` + `src/lib/components/chat/` — AI Chat/history/safety
- `src/lib/server/notifications.ts`, `push-notifications.ts` — notifications
- `src/lib/server/embeds/`, `images/`, `r2.ts` — external media
- `src/lib/server/rate-limit/`, `security/` — abuse/security controls

## Validation

Use smallest credible evidence path:

1. Nearest `*.test.ts` file(s)
2. `npm run check`
3. `git diff --check`
4. Full `npm test` or `npm run build` only when scope warrants
5. Browser verification for UI across relevant widths and light/dark themes

Never expose `.env` secrets. Never run destructive database, seed, branch-delete or reset operations without explicit approval.
