# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Commands

```bash
# Development server (Vite dev, http://localhost:5173)
npm run dev

# Production build
npm run build

# Type check (Svelte + TypeScript)
npm run check
npm run check:watch

# Database (Drizzle Kit)
npm run db:generate   # Generate migration files
npm run db:push       # Push schema changes to Neon DB
npm run db:studio     # Open Drizzle Studio GUI

# Seed scripts (run via npx tsx)
npx tsx scripts/seed-admin.ts --email=admin@example.com --password=SECRET --username=admin
npx tsx scripts/seed-data.ts    # Wipes and re-seeds mock data (preserves ADMIN users)
```

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5 (Runes syntax: `$props`, `$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS 4.x (`@tailwindcss/vite` plugin, no `tailwind.config.js`)
- **Database**: PostgreSQL on Neon (serverless), accessed via `@neondatabase/serverless`
- **ORM**: Drizzle ORM (`src/lib/server/db/schema.ts` for schema, `drizzle/` for migrations)
- **Auth**: Custom JWT (`jose` + `bcryptjs`), not OAuth or an auth library
- **Build**: Vite 6

## Design System — Orbit Editorial Grid

- Use grid as quiet structure: rectangular surfaces, thin semantic borders, measured spacing, and the existing coral/lavender/mint/plum palette.
- Do not introduce rounded corners for containers, cards, inputs, buttons, menus, modals, or image frames. Prefer no `rounded-*` utility or `rounded-none`.
- Circles are reserved for inherently circular data such as status dots or avatars, never decorative container framing; opt in explicitly with `.orbit-round-data` because the global migration guard removes legacy radii.
- Avoid pill-heavy UI, repeated soft cards, gradient blobs, and heavy shadows. Use `--orbit-line` and `--orbit-line-strong` for grouping and hierarchy.
- Keep keyboard focus visibility, 44×44px minimum touch targets, responsive reflow, and all loading/disabled/error states intact.

## Auth System

- **Session**: JWT signed with HS256, 30-day expiry, stored in `httpOnly` cookie named `session`
- **Passwords**: bcrypt with 12 rounds (`src/lib/server/auth/password.ts`)
- **Token storage**: SHA-256 hash stored in DB (`sessions` table), not the raw token
- **Validation**: `hooks.server.ts` → `validateSession()` checks JWT signature + DB session row + `isActive`
- **Roles**: `USER` or `ADMIN` (`userRoleEnum` in schema). Admin routes check `locals.user.role !== 'ADMIN'`
- **Logout**: `POST /logout` clears the session cookie and deletes the DB session row

## Pending Shells

Skeleton UI components for instant navigation feedback. Located in `src/lib/components/`.

- **Base shells**: `PublicBaseShell.svelte`, `AdminBaseShell.svelte` — provide layout + animations
- **Page shells**: `SeriesPendingShell.svelte`, `CalendarPendingShell.svelte`, `ProfilePendingShell.svelte`, `SeriesDetailPendingShell.svelte`, and 9 admin shells
- **Pattern**: Page shells compose base shells using `{#snippet content()}` (Svelte 5)
- **Detection**: Layouts use `$derived` with `$app/state` (not `$app/stores`) to detect navigation
- **SSR-safe**: Shells never render server-side
- **Accessible**: `aria-busy="true"`, `aria-live="polite"`, respects `prefers-reduced-motion`

## Route Structure

```
src/routes/
├── (app)/              # Public pages with Navigation + BottomNav layout
│   ├── +page.svelte    # Home
│   ├── series/         # Series list (load-more pagination) + detail
│   ├── calendar/       # Release calendar
│   ├── login/          # User login
│   └── register/       # User registration
├── profile/            # User profile (authed)
├── admin/              # Admin dashboard (ADMIN only)
│   ├── login/          # Admin login page
│   ├── series/         # CRUD with pagination
│   ├── episodes/
│   ├── studios/
│   ├── platforms/
│   ├── artists/
│   ├── artist-socials/
│   ├── series-artists/
│   ├── schedules/
│   └── episode-schedules/
├── api/                # API endpoints
│   ├── series/         # Public series list (cached, 30s TTL)
│   ├── series/[id]/    # Public series detail
│   ├── calendar/       # Public calendar data
│   ├── home/           # Public home page data
│   └── admin/          # Admin CRUD APIs (all enforce ADMIN role)
└── logout/+server.ts   # Logout handler
```

## Database Patterns

- **Soft deletes**: Most tables have `deletedAt` (timestamp, nullable). Queries filter with `isNull(table.deletedAt)`.
- **Enums**: `userRoleEnum` (`ADMIN`, `USER`), `seriesStatusEnum` (`UPCOMING`, `ONGOING`, `ENDED`).
- **Connection**: Lazy singleton in `src/lib/server/db/index.ts`. Use `await getDb()` in server code. The `db` proxy object exists but prefer `getDb()` for clarity.
- **Schema location**: `src/lib/server/db/schema.ts` — single source of truth for all Drizzle table definitions.

## API Patterns

- **Public APIs**: REST endpoints under `/api/*`. Some use an in-memory Map cache (`src/lib/server/cache.ts`) with short TTL (30s).
- **Admin APIs**: Mirror the admin page structure under `/api/admin/*`. Every endpoint validates `locals.user.role !== 'ADMIN'` and returns 403 with Thai error messages (`ไม่มีสิทธิ์เข้าถึง`).
- **Pagination**: `page` and `limit` query params. Default limit varies (public APIs often 20, admin APIs configurable up to 100).
- **Response shape**: Public APIs return `{ items, total, page, limit }`. Admin APIs return `{ data, page, limit, total, totalPages }`.

## State & Data Flow

- **Auth state**: `hooks.server.ts` populates `event.locals.user` and `event.locals.session`. `+layout.server.ts` exposes `user` to all pages. Svelte components read it from `page.data.user` or check `$page.data.user?.role === 'ADMIN'`.
- **Admin guard**: `admin/+layout.server.ts` redirects unauthenticated users to `/admin/login` and non-admins to `/profile`.
- **Form actions**: Login/register use SvelteKit form actions (`+page.server.ts` with `actions`). Admin CRUD pages use both load functions and API endpoints (pages fetch from their corresponding `/api/admin/*` endpoints).
