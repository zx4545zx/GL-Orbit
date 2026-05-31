# GL-Orbit Code Style

> Coding conventions, patterns, and guidelines for the GL-Orbit codebase.

---

## Naming Conventions

### Files & Directories

| Category | Convention | Examples |
|----------|-----------|----------|
| Svelte components | `PascalCase.svelte` | `Navigation.svelte`, `PasswordInput.svelte` |
| Server modules | `camelCase.ts` | `session.ts`, `user.ts`, `password.ts` |
| Route directories | `kebab-case/` | `episode-schedules/`, `series-artists/` |
| Route groups | `(parentheses)/` | `(app)/` |
| SvelteKit files | SvelteKit conventions | `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+server.ts` |
| App config files | `lower-case.*` | `app.html`, `app.css`, `app.d.ts` |

### TypeScript / JavaScript

| Construct | Convention | Examples |
|-----------|-----------|----------|
| Interfaces | `PascalCase` | `SessionPayload`, `Props` |
| Exported functions | `camelCase`, verb+noun | `createSession`, `getUserByEmail`, `hashPassword` |
| Private functions | `camelCase` | `hashToken`, `toggle`, `goTo` |
| Module constants | `SCREAMING_SNAKE_CASE` | `SECRET`, `SESSION_DURATION_MS` |
| Module-private vars | `_` prefix | `_db`, `_sql` |
| DB table exports | `camelCase`, plural | `users`, `series`, `studios` |
| Enum exports | `PascalCase` + `Enum` suffix | `userRoleEnum`, `seriesStatusEnum` |
| Component props interface | Always `Props` | `interface Props { ... }` |

### Database Schema (`src/lib/server/db/schema.ts`)

| Pattern | Convention | Examples |
|---------|-----------|----------|
| Table names | plural, `snake_case` | `users`, `series`, `episode_schedules` |
| Join tables | `table1_table2` | `series_artists`, `artist_socials` |
| Foreign keys | `{table}_id` | `user_id`, `series_id`, `platform_id` |
| Boolean columns | `is_` prefix | `is_active`, `is_uncut` |
| Timestamp columns | `_at` suffix | `created_at`, `updated_at`, `deleted_at` |
| URL columns | `_url` suffix | `avatar_url`, `poster_url`, `logo_url` |
| Enum values (DB) | `UPPER_SNAKE_CASE` | `'ADMIN'`, `'USER'`, `'UPCOMING'`, `'ONGOING'`, `'ENDED'` |
| TS column names | `camelCase` | `displayName`, `passwordHash`, `createdAt` |

### CSS Classes (`src/app.css`)

| Pattern | Convention | Examples |
|---------|-----------|----------|
| Glassmorphism | `glass-card*` | `glass-card`, `glass-card-strong` |
| Text gradients | `text-gradient*` | `text-gradient`, `text-gradient-coral` |
| Animations | `animate-*` | `animate-float`, `animate-orbit`, `animate-pulse-glow` |
| Utilities | `kebab-case` | `touch-target`, `bg-gradient-mesh` |

---

## File Organization

### SvelteKit Route Files

Each route typically has these files (use all that apply):

```
route-name/
├── +page.svelte        # Page component
├── +page.ts            # Client-side load (optional)
├── +page.server.ts     # Server load + form actions (optional)
├── +layout.svelte      # Layout wrapper (optional)
└── +layout.server.ts   # Layout server data (optional)
```

### Server-Only Code

All server-only code lives under `src/lib/server/`:

```
src/lib/server/
├── auth/               # Authentication (JWT, password, user queries)
├── db/                 # Database (schema, connection)
└── cache.ts            # Server cache utilities
```

> **Rule**: Never import from `$lib/server/*` in client-side code. SvelteKit enforces this at build time.

---

## Import Style

### Module Resolution

`NodeNext` is configured — **all relative imports in server files must include `.js` extension**:

```typescript
// ✅ Correct
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';

// ❌ Wrong
import { getDb } from '../db/index';
import * as schema from '../db/schema';
```

### Import Grouping

Order imports as follows:

1. External packages (bare specifiers)
2. SvelteKit utilities (`$app/*`, `@sveltejs/kit`)
3. `$lib/*` aliases
4. Relative imports (with `.js`)
5. Type imports from `./$types.js`

```typescript
// 1. External
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';

// 2. SvelteKit
import { fail, redirect } from '@sveltejs/kit';

// 3. $lib aliases
import { validateSession } from '$lib/server/auth/session.js';

// 4. Relative
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';

// 5. Route types
import type { Actions, PageServerLoad } from './$types.js';
```

### Schema Import Pattern

Always import schema as a namespace:

```typescript
import * as schema from '../db/schema.js';
// Usage: schema.users, schema.sessions
```

---

## Code Patterns

### Svelte 5 Runes (Mandatory)

This project uses **Svelte 5 Runes only**. Do **not** use legacy Svelte 4 syntax.

```svelte
<script lang="ts">
  interface Props {
    id?: string;
    value?: string;
    label?: string;
  }

  // Props with destructuring
  let { id = 'default', value = $bindable(''), label }: Props = $props();

  // Local reactive state
  let show = $state(false);
  let loading = $state(false);

  // Derived values
  const fullLabel = $derived(`${label} (${id})`);

  // Effects
  $effect(() => {
    if (show) console.log('visible');
  });

  // Event handlers
  function toggle() {
    show = !show;
  }
</script>
```

**Never use** `export let` — use `$props()` with destructuring instead.

### Server Load Functions

```typescript
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
  // locals.user and locals.session are available from hooks.server.ts
  return { data: ... };
};
```

### Form Actions

```typescript
import type { Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    // ... validate ...
    return fail(400, { error: 'ข้อความภาษาไทย' });
    // or: redirect(302, '/target');
  }
};
```

### API Endpoints

```typescript
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  // ... query DB ...
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

### Database Queries

```typescript
import { getDb } from '$lib/server/db/index.js';
import * as schema from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

// ✅ Always use getDb() in server files
const db = await getDb();

const [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.id, userId))
  .limit(1);
```

> **Critical**: The `db` Proxy export does not work in SSR context. Always call `getDb()` in `+page.server.ts`, `+server.ts`, and `hooks.server.ts`.

---

## Pending Shell Patterns

### Component Structure

Pending shells follow a composition pattern with base shells:

```svelte
<!-- AdminSeriesPendingShell.svelte -->
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการซีรีส์"
  breadcrumbLabel="ซีรีส์"
  actionLabel="เพิ่มซีรีส์ใหม่"
>
  {#snippet content()}
    <!-- Page-specific skeleton -->
    <div class="animate-pulse">...</div>
  {/snippet}
</AdminBaseShell>
```

### Navigation Detection

Layouts detect navigation using `$derived` with `$app/state`:

```svelte
<script lang="ts">
  import { navigating, page } from '$app/state';
  
  const pendingShell = $derived.by(() => {
    const to = navigating.to?.url.pathname;
    const from = page.url.pathname;
    if (!to || to === from) return null;
    if (to.startsWith('/calendar') && !from.startsWith('/calendar')) return 'calendar';
    // ... more routes
    return null;
  });
</script>

{#if pendingShell === 'calendar'}
  <CalendarPendingShell />
{:else}
  {@render children()}
{/if}
```

### Key Rules

- **Use `$app/state`** (not `$app/stores`) for navigation detection
- **Check both TO and FROM** — only show shell when navigating TO a route FROM a different route
- **SSR-safe** — shells never render on the server (client-side only)
- **Accessibility** — include `aria-busy="true"` and `aria-live="polite"`
- **Thai UI** — all shell text in Thai
- **Respect motion preferences** — check `prefers-reduced-motion`

---

## Error Handling

### Server-Side Errors

Use SvelteKit's `fail()` for form validation errors:

```typescript
import { fail } from '@sveltejs/kit';

return fail(400, { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
```

Return Thai-language error messages for all user-facing errors.

### Auth Session Errors

The `validateSession()` function returns `null` on any failure (invalid token, expired, missing in DB, inactive user). Callers check for null:

```typescript
const result = await validateSession(token);
if (!result) {
  // Session invalid — clear cookie, redirect to login
}
```

### Database Connection Errors

`getDb()` throws if `DATABASE_URL` is not set. This is a startup-level error that should fail fast.

---

## Logging

No centralized logging system is currently configured. Use `console.log` / `console.error` sparingly for debugging only. Remove before committing.

---

## Testing

**No test suite exists.** If adding tests in the future, the `AGENTS.md` suggests:

| Type | Tool |
|------|------|
| Unit tests | Vitest |
| E2E tests | Playwright |
| DB tests | `pglite` or dedicated Neon test DB |

---

## UI Language

**Primary UI language is Thai.** All user-facing text, labels, error messages, and form placeholders should be in Thai.

```svelte
<!-- ✅ Correct -->
<label>รหัสผ่าน</label>
<button>เข้าสู่ระบบ</button>

<!-- ❌ Wrong -->
<label>Password</label>
<button>Login</button>
```

---

## Do's and Don'ts

### ✅ Do

- Use `<script lang="ts">` in every Svelte file
- Use Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- Add `.js` extension to all server-side relative imports
- Use `getDb()` (not the `db` proxy) in server files
- Use `$lib/` alias for imports from `src/lib/`
- Use Thai for all user-facing strings
- Include `deleted_at` (soft delete) on new main tables
- Use UUID v4 (`defaultRandom()`) for primary keys
- Use `timestamptz` for all datetime columns

### ❌ Don't

- Use `export let` (legacy Svelte 4 props)
- Import from `$lib/server/*` in client code
- Use the `db` proxy export in `+page.server.ts` or `hooks.server.ts`
- Omit `.js` extension in server file imports
- Store raw JWT tokens in the database (always hash with SHA-256)
- Expose `AUTH_SECRET` or `DATABASE_URL` in client code
- Use `@html` directive without sanitizing input
- Add new tables without `created_at`, `updated_at`, `deleted_at`

---

## Quick Reference

### Creating a New Page

1. Create directory under `src/routes/(app)/` or `src/routes/admin/`
2. Add `+page.svelte` (and `+page.server.ts` if server data needed)
3. Import types from `./$types.js`
4. Use Thai labels and error messages

### Creating a New Component

1. Create `PascalCase.svelte` in `src/lib/components/`
2. Define `interface Props` at top of `<script>`
3. Use `$props()` with destructuring
4. Use `$state()` for reactive local state
5. Use Tailwind utility classes for styling

### Adding a DB Table

1. Add table definition in `src/lib/server/db/schema.ts`
2. Include: `id` (UUID PK), `created_at`, `updated_at`, `deleted_at`
3. Use `pgEnum()` for enumerated types
4. Run `npm run db:generate` then `npm run db:push`

### Adding an API Endpoint

1. Create `+server.ts` in appropriate `src/routes/api/` subdirectory
2. Export `GET`, `POST`, `PUT`, `DELETE` as `RequestHandler`
3. Use `getDb()` for database access
4. Return `Response` with JSON body
