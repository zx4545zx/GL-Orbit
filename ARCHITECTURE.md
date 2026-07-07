# GL-Orbit Architecture

> Central hub and broadcast schedule for GL (Girls' Love) series worldwide. GL-Orbit is a SvelteKit full-stack app backed by Neon PostgreSQL, with live schedule data, member features, admin CRUD, SEO/PWA support, notifications, and AI-assisted series Q&A.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 2 |
| UI | Svelte 5 (Runes) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Build Tool | Vite 6 |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| DB Driver | `@neondatabase/serverless` |
| Auth | Custom JWT with `jose` + `bcryptjs` |
| PWA | `@vite-pwa/sveltekit` |
| Tests | Vitest |
| Deploy | Vercel |

---

## Product Scope

GL-Orbit provides:

- Public GL series catalog and detail pages
- Live episode and weekly broadcast schedules
- Calendar views powered by database data
- Artist, studio, platform, genre, and ship/couple metadata
- Member profile, favorite/watched tracking, notifications, and push subscriptions
- Admin CRUD for core content and schedule management
- AI Chat that answers series-related questions from safe database context
- SEO/PWA surfaces such as sitemap, robots, llms.txt, Open Graph, JSON-LD, and manifest

---

## Directory Structure

```txt
src/
├── app.html
├── app.css
├── app.d.ts
├── hooks.server.ts
├── lib/
│   ├── admin/                 # Admin helpers, editor types, API helpers
│   ├── components/            # Reusable UI, admin UI, pending shells, Picture
│   ├── i18n/                  # Paraglide-generated i18n output
│   ├── server/
│   │   ├── auth/              # Password hashing, JWT session, user queries
│   │   ├── chat/              # AI chat prompt, safety, history, catalog context
│   │   ├── db/                # Drizzle schema + Neon connection
│   │   ├── images/            # Image optimization/backfill utilities
│   │   ├── queries/           # Feature query layer, e.g. calendar and editor data
│   │   ├── series/            # Series listing/filter/SEO helpers
│   │   ├── cache.ts
│   │   ├── push-notifications.ts
│   │   └── timezone.ts
│   ├── seo.ts
│   └── types/
└── routes/
    ├── [lang=lang]/           # Localized public/admin routes
    │   ├── (app)/             # Public pages
    │   └── admin/             # ADMIN-only pages
    ├── api/
    │   ├── admin/             # Admin CRUD endpoints
    │   ├── calendar/          # Public calendar API
    │   ├── chat/              # Conversation/message APIs
    │   ├── chat-series/       # Series-aware AI chat endpoint
    │   ├── home/
    │   ├── profile/
    │   └── series/
    ├── llms.txt/
    ├── og-image/
    ├── robots.txt/
    └── sitemap.xml/
```

---

## Database Model

The canonical Drizzle schema lives in `src/lib/server/db/schema.ts`.

| Area | Tables |
|------|--------|
| Auth/users | `users`, `sessions` |
| Series catalog | `series`, `episodes`, `series_gallery_images` |
| Metadata | `studios`, `studio_socials`, `platforms`, `artists`, `artist_socials`, `genres` |
| Relations | `series_artists`, `series_genres`, `ships`, `ship_series` |
| Schedules | `series_schedules`, `episode_schedules` |
| Member activity | `favorites`, `watched` |
| Notifications | `notifications`, `push_subscriptions` |
| Chat | `chat_conversations`, `chat_conversation_messages`, `chat_messages` |

Core enums:

- `user_role`: `ADMIN`, `USER`
- `series_status`: `UPCOMING`, `ONGOING`, `ENDED`

---

## Data Access Pattern

`src/lib/server/db/index.ts` lazily initializes the Neon HTTP driver and wraps it with Drizzle. Server code should prefer `await getDb()`.

Feature-specific query logic is kept in helper modules instead of being embedded directly in UI components:

| Area | Location | Notes |
|------|----------|-------|
| Series listing | `src/lib/server/series/listing.ts` | Search, status filter, pagination, SEO metadata |
| Series editor/detail | `src/lib/server/queries.ts` | Full editor payload with studio, genres, artists, episodes, schedules, gallery |
| Calendar | `src/lib/server/queries/calendar.ts` | Month/week/all schedule queries, timezone formatting, short cache |
| Chat | `src/lib/server/chat/*` | Catalog context, prompt builders, safety checks, history |

---

## Route Architecture

| Route Group | Purpose | Auth |
|-------------|---------|------|
| `[lang=lang]/(app)` | Public localized pages | Public, optional user data |
| `[lang=lang]/admin` | Admin dashboard and editors | `ADMIN` only |
| `api/admin/*` | Admin JSON CRUD endpoints | `ADMIN` only |
| `api/series/*` | Public series list/detail APIs | Public |
| `api/calendar` | Public calendar API backed by DB | Public |
| `api/chat-series` | Series-aware AI chat | Logged-in user |
| `api/profile` | Profile APIs | Logged-in user |
| `robots.txt`, `sitemap.xml`, `llms.txt`, `og-image` | SEO/crawler surfaces | Public |

---

## Request Lifecycle

```txt
Browser request
  ↓
hooks.server.ts
  - Reads session cookie
  - Validates session
  - Populates event.locals.user / event.locals.session
  ↓
+layout.server.ts
  - Exposes user/session state to route data
  ↓
Route load or API handler
  - Reads DB through getDb() or feature query layer
  - Applies route-specific auth guard
  ↓
Svelte components
  - Render typed data with Svelte 5 runes
```

---

## Core Feature Flows

### Public series listing

- Parses search, status, and page params
- Queries `series`, `studios`, `episodes`, `episode_schedules`, and `genres`
- Returns paginated items with short cache and SEO metadata helpers

### Series detail and admin editor

- Loads a full series payload by ID
- Aggregates series fields, studio, genres, artists, gallery, episodes, episode schedules, and weekly schedules
- Loads reference data for editor dropdowns

### Calendar

The calendar is live DB-backed.

- Page server load parses week/month params
- `getCalendarData()` queries `episode_schedules`
- Joins through `episodes`, `series`, and `platforms`
- Converts UTC storage into Thailand-facing date/time display
- Returns grouped events, series posters, platforms, and schedule-by-day data

### Admin schedules

- `/api/admin/schedules` manages recurring weekly rows in `series_schedules`
- `/api/admin/episode-schedules` manages concrete air dates in `episode_schedules`
- Both are DB-backed and guarded by `ADMIN` role checks

### AI Chat

`api/chat-series` is a logged-in-user endpoint for series-specific Q&A.

Flow:

1. Validate user and message length
2. Build catalog/context from series data
3. Ask the model for a safe read-only query
4. Validate the generated query before execution
5. Execute against read-only database access
6. Generate a friendly answer and store chat history/context

---

## Security Model

| Concern | Implementation |
|---------|----------------|
| Session | JWT in `httpOnly` cookie |
| Token storage | SHA-256 hash stored in `sessions`, not raw token |
| Passwords | bcrypt with 12 rounds |
| Roles | `ADMIN` / `USER` enum |
| Admin guard | Admin layouts and APIs reject non-admin users |
| SQL injection | Drizzle parameterization for app queries |
| AI SQL safety | Generated query is validated and read-only before execution |
| XSS | Svelte escaping by default |

---

## SEO and PWA

| Surface | Purpose |
|---------|---------|
| `/robots.txt` | Crawler policy |
| `/sitemap.xml` | Dynamic sitemap from DB-backed content |
| `/llms.txt` | LLM crawler-friendly project/content summary |
| `/og-image` | Dynamic Open Graph image endpoint |
| JSON-LD helpers | Structured data for pages, people, organizations, breadcrumbs, and series lists |
| PWA manifest/service worker | Installable app support |

---

## Current Development Status

| Feature | Status | Data Source |
|---------|--------|-------------|
| Series listing | Live | Neon PostgreSQL + Drizzle |
| Series detail | Live | Neon PostgreSQL + Drizzle |
| Series admin editor | Live | Neon PostgreSQL + Drizzle |
| Calendar / schedules | Live | `episode_schedules` joined with `episodes`, `series`, `platforms` |
| Admin weekly schedules | Live CRUD | `series_schedules` |
| Admin episode schedules | Live CRUD | `episode_schedules` |
| Artists / studios / platforms / genres | Live CRUD | Respective DB tables |
| Authentication | Live | JWT + `sessions` table |
| User profile | Live | `users` table |
| Favorite / watched | Live | `favorites`, `watched` |
| Notifications / push | Live | `notifications`, `push_subscriptions` |
| AI Chat | Live | Safe read-only DB context + chat history |
| Tests | Partial | Vitest coverage for selected API/admin utilities |
| Lint/format config | Not fully standardized | Prettier/ESLint setup can be added later |

---

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run check:watch
npm run test
npm run test:watch
npm run db:generate
npm run db:push
npm run db:studio
```

---

## Notes for Future Contributors

- Prefer `getDb()` inside server code.
- Keep DB-backed feature logic in query/helper modules where possible.
- Avoid documenting pages as mock unless they are intentionally mock-only.
- Keep schedule displays timezone-aware.
- Keep AI chat query execution read-only and validated.
- Update this file and `README.md` whenever route/data-source architecture changes.
