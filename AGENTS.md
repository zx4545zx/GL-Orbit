<!-- From: /Users/syaco/workspace/private/AGENTS.md -->
# AGENTS.md — GL-Orbit

> ไฟล์นี้เขียนขึ้นสำหรับ AI Coding Agent ที่ต้องการทำความเข้าใจโปรเจกต์

---

## Project Overview

**GL-Orbit** เป็นเว็บแอปพลิเคชันที่ออกแบบมาเพื่อเป็นศูนย์กลางข้อมูลและตารางฉายสำหรับแฟนคลับซีรีส์ GL (Girls' Love) ทั่วโลก

จุดเด่นของแอป:
- แสดงตารางฉายซีรีส์ที่รองรับ Timezone และระบุ Uncut version
- ระบบจัดการซีรีส์ ตอน สตูดิโอ นักแสดง และแพลตฟอร์มสตรีมมิ่ง (สำหรับ Admin)
- ระบบสมาชิกพร้อมโปรไฟล์ผู้ใช้
- ออกแบบให้เข้าถึงง่าย ไม่ซับซ้อน เน้นชุมชนแฟนคลับเป็นหลัก

**สถานะปัจจุบัน:** โปรเจกต์อยู่ในขั้นตอนการพัฒนา UI/Frontend เป็นหลัก — ส่วนระบบ Authentication และฐานข้อมูลเชื่อมต่อจริงแล้ว หน้า **ซีรีส์ (รายการ + รายละเอียด)** ดึงจากฐานข้อมูลจริงแล้ว แต่หน้า **ตารางฉาย (calendar)** และ **หน้า Admin** ยังใช้ Mock Data อยู่

---

## Technology Stack

| ชั้น | เทคโนโลยี | รายละเอียด |
|------|-----------|-----------|
| Framework | SvelteKit 2.x | SSR + File-based routing |
| UI Framework | Svelte 5 | ใช้ Runes (`$state`, `$derived`, `$effect`, `$props`) |
| Language | TypeScript 5.8 | `strict: true`, `module: NodeNext` |
| Styling | Tailwind CSS 4.x | ผ่าน `@tailwindcss/vite` plugin |
| Build Tool | Vite 6.x | — |
| Database | PostgreSQL (Neon.tech) | Serverless Postgres |
| ORM | Drizzle ORM 0.43 | พร้อม `drizzle-kit` สำหรับ migration |
| DB Driver | `@neondatabase/serverless` | HTTP proxy สำหรับ Edge/Serverless |
| Auth | Custom JWT Session | ใช้ `jose` (HS256) + `bcryptjs` |
| Env | `dotenv` | โหลดจาก `.env` |

---

## Build and Development Commands

คำสั่งหลักทั้งหมดอยู่ใน `package.json`:

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type check (Svelte + TypeScript)
npm run check
npm run check:watch

# Database
npm run db:generate   # สร้างไฟล์ migration
npm run db:push       # push schema ไปยัง database
npm run db:studio     # เปิด Drizzle Studio GUI
```

---

## Environment Variables

ตัวแปรที่จำเป็นต้องมีใน `.env`:

| ตัวแปร | คำอธิบาย |
|--------|---------|
| `DATABASE_URL` | Connection string ของ Neon PostgreSQL |
| `AUTH_SECRET` | Secret string สำหรับ sign JWT session |

ตัวอย่างดูได้จาก `.env.example`

---

## Database Architecture

Schema หลักอยู่ใน `src/lib/server/db/schema.ts` ออกแบบตามหลัก Normalization:

### ตารางหลัก
- `users` — ผู้ใช้งานระบบ (`role`: ADMIN, USER)
- `sessions` — JWT session tokens (เก็บ SHA-256 hash)
- `studios` — สตูดิโอผลิตซีรีส์
- `platforms` — แพลตฟอร์มสตรีมมิ่ง
- `artists` — นักแสดง/ศิลปิน
- `artist_socials` — โซเชียลมีเดียของศิลปิน
- `series` — ซีรีส์ (`status`: UPCOMING, ONGOING, ENDED)
- `series_artists` — ความสัมพันธ์ many-to-many
- `series_schedules` — ตารางฉายประจำ (วันในสัปดาห์ + เวลา)
- `episodes` — ตอนของซีรีส์
- `episode_schedules` — ตารางฉายรายตอน (วันที่ + ลิงก์สตรีม)

### หลักการออกแบบฐานข้อมูล
- **ID Strategy:** UUID v4 (`defaultRandom()`) ทุกตาราง
- **Audit Fields:** ทุกตารางหลักมี `created_at`, `updated_at`, `deleted_at` (Soft Delete)
- **Time Strategy:** ใช้ `timestamptz` สำหรับวันที่ฉายจริง เพื่อรองรับ Timezone
- **Session Security:** เก็บ token hash (SHA-256) ไม่ใช่ token ดิบ

### DB Connection
- ไฟล์ `src/lib/server/db/index.ts` ใช้ lazy initialization + Proxy pattern
- **ใน Server Files (`+page.server.ts`, `+server.ts`, `hooks.server.ts`) ต้องใช้ `getDb()` เท่านั้น** — `db` proxy ไม่ทำงานใน SSR context (`TypeError: db.select is not a function`)
- ตัวอย่าง: `const db = await getDb(); const result = await db.select(...)`
- `db` proxy ใช้ได้เฉพาะบริบทที่รองรับ async property access (ไม่รองรับ Vite SSR)

---

## Code Organization

```
src/
├── app.html                 # HTML template (โหลดฟอนต์ Google Fonts)
├── app.css                  # Global styles + Tailwind theme + animations
├── app.d.ts                 # Type declarations (App.Locals)
├── hooks.server.ts          # Session validation middleware
├── lib/
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts    # Drizzle schema definitions
│   │   │   └── index.ts     # DB connection (Neon HTTP)
│   │   └── auth/
│   │       ├── session.ts   # JWT create/validate/destroy
│   │       ├── user.ts      # User DB queries
│   │       └── password.ts  # bcrypt hash/verify
│   └── components/
│       ├── Navigation.svelte    # Desktop nav (md:block)
│       ├── BottomNav.svelte     # Mobile nav (md:hidden)
│       ├── Footer.svelte
│       └── PasswordInput.svelte # Reusable password with toggle
└── routes/
    ├── +layout.svelte       # Root layout (Nav + BottomNav + Footer)
    ├── +layout.server.ts    # Expose user to all pages
    ├── (app)/               # Public pages group
    │   ├── +layout.svelte   # Centered container
    │   ├── +page.svelte     # Landing / Hero page
    │   ├── series/
    │   │   ├── +page.svelte     # Series listing (DB)
    │   │   └── [id]/
    │   │       └── +page.svelte # Series detail (DB)
    │   ├── calendar/
    │   │   └── +page.svelte     # Schedule views (mock data)
    │   ├── login/
    │   │   ├── +page.svelte
    │   │   └── +page.server.ts  # Auth actions
    │   └── register/
    │       ├── +page.svelte
    │       └── +page.server.ts
    ├── profile/
    │   ├── +page.svelte         # User profile UI
    │   └── +page.server.ts      # updateProfile + changePassword
    ├── logout/
    │   └── +server.ts           # POST endpoint to clear session
    └── admin/                   # Admin panel (protected)
        ├── +layout.svelte       # Admin layout (gray bg, header)
        ├── +layout.server.ts    # Auth guard (must be ADMIN)
        ├── login/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── series/
        │   └── +page.svelte     # Series CRUD UI (mock data)
        └── schedules/
            └── +page.svelte     # Schedule management (mock data)
```

---

## Authentication & Authorization

### Session Flow
1. `hooks.server.ts` อ่าน cookie `session` → เรียก `validateSession()`
2. `validateSession()` verify JWT (jose) → ตรวจ token hash ในฐานข้อมูล → ตรวจว่าไม่หมดอายุ
3. ผลลัพธ์อยู่ใน `locals.user` และ `locals.session`
4. `+layout.server.ts` ส่ง `user` ลงไปยัง client ผ่าน `page.data.user`

### Role-based Access
- **USER** — เข้าถึงหน้า public และ `/profile` ได้
- **ADMIN** — เข้าถึง `/admin/*` ได้
- `admin/+layout.server.ts` redirect ไป `/admin/login` ถ้าไม่มี session หรือไม่ใช่ ADMIN

### Security Practices
- Cookie: `httpOnly`, `secure` (production only), `sameSite: 'lax'`, `path: '/'`
- Password: bcrypt 12 rounds
- JWT: HS256, 30 days expiry, clock tolerance 60s
- Token storage: เก็บ SHA-256 hash ไม่ใช่ token ดิบ

---

## Styling & Design System

### Tailwind v4 Custom Theme (`app.css`)
- **Colors:** `coral` (#FF6B9D), `lavender` (#C4B5FD), `mint` (#6EE7B7), `plum` (#2D1B2E), `cream` (#FFF5F7)
- **Fonts:** Syne (display), DM Sans (body), Mali (Thai)
- **Fluid Type & Spacing:** ใช้ `clamp()` สำหรับ responsive โดยไม่ต้องพึ่ง breakpoint

### Key CSS Utilities
- `.glass-card` / `.glass-card-strong` — Glassmorphism cards
- `.text-gradient` / `.text-gradient-coral` — Gradient text
- `.touch-target` — Min 44×44px (accessibility)
- `.animate-float`, `.animate-orbit`, `.animate-pulse-glow` — Motion effects
- `@media (prefers-reduced-motion: reduce)` — Respect user preference

### Responsive Strategy
- Mobile-first: ใช้ `sm:`, `md:`, `lg:` breakpoints
- Navigation: Desktop (`md:block`) / Mobile Bottom Nav (`md:hidden`)
- **Sticky Search Bar & Bottom Nav ใช้ `glass-card` เหมือนกัน** — เพื่อความสอดคล้องของดีไซน์ (bg ขาว 70% + blur 20px + border ขาว 50% + shadow สี lavender)
- ทุกหน้ามี responsive padding, text size, และ touch targets

---

## Code Style Guidelines

### Svelte / TypeScript
- ใช้ `<script lang="ts">` ทุกไฟล์
- Svelte 5 Runes เท่านั้น (`$state`, `$derived`, `$effect`, `$props`)
- **ไม่ใช้** `export let` (legacy Svelte 4)
- `$bindable()` สำหรับ two-way binding ใน component

### Module Resolution
- ใช้ `NodeNext` → import ทุกไฟล์ต้องมีนามสกุล `.js` (แม้เป็น `.ts`)
- ตัวอย่าง: `import { getDb } from '../db/index.js'`

### Server Load / Actions
- ใช้ `export const load` และ `export const actions`
- Type imports จาก `'./$types.js'`
- Form errors แสดงเป็นภาษาไทยเสมอ

### Naming Conventions
- Components: PascalCase (e.g., `PasswordInput.svelte`)
- Server files: camelCase (e.g., `page.server.ts`)
- DB tables: snake_case ใน schema, camelCase ใน TypeScript

---

## Testing Instructions

**ณ ปัจจุบันยังไม่มี Test Suite ในโปรเจกต์**

หากต้องการเพิ่ม tests แนะนำ:
- Unit tests: `vitest` (เข้ากันได้กับ Vite/SvelteKit)
- E2E tests: `Playwright`
- DB tests: ใช้ `pglite` หรือ setup test database บน Neon

---

## Security Considerations

1. **Never expose `AUTH_SECRET`** — ใช้สำหรับ sign JWT เท่านั้น
2. **Never expose `DATABASE_URL`** — มี credentials ของ PostgreSQL
3. **SQL Injection** — ปลอดภัยเนื่องจากใช้ Drizzle ORM ทั้งหมด
4. **XSS** — Svelte มี escaping  built-in, แต่ต้องระวัง `@html` directive
5. **CSRF** — SvelteKit form actions มี CSRF protection โดย default
6. **Session Hijacking** — เก็บ token hash ไม่ใช่ token ดิบในฐานข้อมูล, สามารถ revoke ได้

---

## Deployment

1. **Database:** Neon.tech project พร้อม `DATABASE_URL`
2. **Environment:** ตั้งค่า `DATABASE_URL` และ `AUTH_SECRET`
3. **Migration:** `npm run db:push` ก่อน deploy ครั้งแรก
4. **Platform:** รองรับ Vercel (adapter-auto จะ detect เอง)

---

## Key Notes for Agents

- **ภาษาหลักของ UI คือภาษาไทย** — ข้อความใน component, error message, label ต่างๆ เป็นภาษาไทย
- **หน้า Series (รายการ + รายละเอียด) ดึงจาก DB จริงแล้ว** — หน้า Calendar และ Admin ยังใช้ Mock Data อยู่ หากต้องการเชื่อมต่อกับฐานข้อมูลจริง ต้องเขียน `+page.server.ts` สำหรับ load data
- **Auth ทำงานจริงแล้ว** — สามารถสมัครสมาชิก เข้าสู่ระบบ แก้ไขโปรไฟล์ และเปลี่ยนรหัสผ่านได้
- **สร้าง Admin คนแรก:** ต้อง insert ผ่าน database โดยตรง (ยังไม่มีหน้าสร้าง admin) หรือเปลี่ยน role ใน DB
- **ถ้าแก้ไข schema อย่าลืม:** `npm run db:generate` แล้ว `npm run db:push`
- **Drizzle Studio:** ใช้ `npm run db:studio` สำหรับดู/แก้ไขข้อมูลในฐานข้อมูลได้สะดวก
