# GL-Orbit 🌸

> แพลตฟอร์มข้อมูล ตารางฉาย ชุมชน และเครื่องมือติดตามค่าใช้จ่ายสำหรับแฟนซีรีส์ GL (Girls' Love)

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?logo=svelte)](https://kit.svelte.dev)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)

## จุดเด่น

- **ฐานข้อมูล GL** — ซีรีส์ ตอน นักแสดง คู่จิ้น สตูดิโอ แพลตฟอร์ม แนว และแกลเลอรี
- **ตารางฉายและ Countdown** — ข้อมูลจากฐานข้อมูลจริง รองรับ timezone, stream link และ Uncut version
- **Orbit Halo** — ฟีดชุมชน โพสต์รูป/ลิงก์ ไลก์ บันทึก แสดงความคิดเห็น รายงาน และ moderation
- **Subscription Tracker** — ติดตามบริการสตรีมมิ่ง รอบบิล การต่ออายุ ประวัติการจ่าย และงบแยกสกุลเงิน
- **AI Chat** — ผู้ช่วยค้นข้อมูลซีรีส์และตารางฉาย พร้อมประวัติการสนทนา
- **สมาชิกและการแจ้งเตือน** — โปรไฟล์ Favorite/Watched, in-app notifications และ Web Push
- **ไทย/อังกฤษ** — URL localized ด้วย Paraglide (`/th/*`, `/en/*`) และตรวจภาษาจาก user/cookie/browser
- **Admin CRUD** — จัดการข้อมูลหลัก ตารางฉาย รูปภาพ การแจ้งเตือน และ moderation
- **SEO + PWA** — sitemap, robots.txt, llms.txt, dynamic Open Graph, JSON-LD, installable app และ share target
- **Orbit Editorial UI** — โครงสร้าง grid เหลี่ยม รองรับ light/dark theme, responsive และ accessibility

## เทคโนโลยี

| ชั้น | เทคโนโลยี |
|---|---|
| Framework | SvelteKit 2.x + Svelte 5 Runes |
| Language | TypeScript 5.8 (`strict`, `NodeNext`) |
| Styling | Tailwind CSS 4 + project design tokens |
| Database | PostgreSQL บน Neon Serverless |
| ORM | Drizzle ORM 0.43 + Drizzle Kit |
| Auth | Custom JWT (`jose`) + bcrypt |
| i18n | Paraglide SvelteKit (TH/EN) |
| Testing | Vitest 4 + Testing Library Svelte |
| PWA | `@vite-pwa/sveltekit` + custom service worker |
| Media | Cloudflare R2 + Sharp |
| Deploy | Vercel (`sin1`) |

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

คัดลอก `.env.example` เป็น `.env` แล้วกำหนดค่าที่ใช้จริง:

| กลุ่ม | ตัวแปร |
|---|---|
| จำเป็น | `DATABASE_URL`, `AUTH_SECRET` |
| AI Chat | `READONLY_DATABASE_URL`, `MINIMAX_API_KEY`, `MINIMAX_API_BASE_URL`, `MINIMAX_MODEL` |
| Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY` |
| Media upload | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |

อย่า commit `.env` หรือค่าความลับจริงลง repository

### 3. สร้าง/อัปเดต schema

```bash
npm run db:push
```

### 4. รัน development server

```bash
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173) ระบบจะ redirect ไปภาษาที่ตรวจพบ เช่น `/th`

## คำสั่งหลัก

```bash
npm run dev             # Development server
npm run build           # Production build
npm run preview         # Preview production build
npm test                # Vitest test suite
npm run test:watch      # Vitest watch mode
npm run check           # Compile i18n + Svelte/TypeScript checks
npm run check:watch     # Check watch mode
npm run i18n:compile    # Compile Paraglide messages
npm run db:generate     # Generate Drizzle migration
npm run db:push         # Push schema to database
npm run db:studio       # Open Drizzle Studio
```

Seed scripts:

```bash
npx tsx scripts/seed-admin.ts --email=admin@example.com --password=SECRET --username=admin
npx tsx scripts/seed-data.ts
```

> `seed-data.ts` ล้างและ seed ข้อมูลตัวอย่างใหม่ แต่คงผู้ใช้ ADMIN ไว้ ใช้กับฐานข้อมูลที่ตั้งใจให้แก้ไขเท่านั้น

## สถานะฟีเจอร์

| Feature | Status | Data source |
|---|---|---|
| Series / Artists / Ships / Explore | Live | Neon + Drizzle |
| Calendar / Countdown | Live | Episodes + schedules + platforms |
| Orbit Halo / Moments | Live | Moments, media, interactions, moderation |
| Subscription Tracker | Live | Subscriptions, payments, budgets, currencies |
| Authentication / Profile | Live | JWT sessions + users |
| Favorite / Watched | Live | User relation tables |
| Notifications / Web Push | Live | Notifications + push subscriptions |
| AI Chat | Live when configured | Read-only DB context + Minimax + chat history |
| Admin management | Live CRUD | Protected admin APIs |
| SEO / PWA | Live | Dynamic routes + service worker |
| Automated tests | Active | Vitest unit/component/server/API tests |

“Live” หมายถึงมี implementation เชื่อม server/database แล้ว ไม่ได้ยืนยันว่าบริการภายนอกหรือ production environment ถูกตั้งค่าครบ

## โครงสร้างโปรเจกต์

```txt
src/
├── routes/
│   ├── [lang=lang]/
│   │   ├── (app)/            # Home, catalog, calendar, subscriptions, profile, auth
│   │   ├── (orbit-halo)/     # Community feed, compose, moments, saved, profiles
│   │   ├── (chat)/           # AI chat list and conversation
│   │   ├── admin/            # ADMIN-only pages
│   │   └── logout/
│   ├── api/                  # Public, member, Halo, chat, subscription, admin APIs
│   ├── robots.txt/ · sitemap.xml/ · llms.txt/
│   └── og-image/
├── lib/
│   ├── components/           # Shared, admin, chat, moments, subscription UI
│   ├── i18n/                 # Locale detection + generated Paraglide runtime
│   ├── server/
│   │   ├── auth/ · db/ · queries/
│   │   ├── chat/ · moments/ · subscriptions/
│   │   ├── embeds/ · images/ · rate-limit/ · security/
│   │   └── notifications.ts · push-notifications.ts · r2.ts
│   ├── subscriptions/        # Shared subscription calculations/client helpers
│   └── seo.ts
├── hooks.server.ts           # Session validation + locale detection/redirect
├── service-worker.ts         # PWA cache and push handling
├── app.css                   # Tailwind theme, design tokens, utilities
└── app.html

messages/                     # Thai/English source messages
drizzle/                      # Generated migrations
scripts/                      # Seed and maintenance scripts
```

## ฐานข้อมูล

Schema source of truth: `src/lib/server/db/schema.ts`

- **Identity:** `users`, `sessions`
- **Catalog:** `series`, `episodes`, `artists`, `ships`, `studios`, `platforms`, `genres` และ relation/social/gallery tables
- **Schedules:** `series_schedules`, `episode_schedules`
- **Library:** `favorites`, `watched`
- **Subscriptions:** `currencies`, `user_subscriptions`, `subscription_payments`, `subscription_budgets`
- **Orbit Halo:** `moments`, media, likes, bookmarks, comments, entity links, reports, moderation actions
- **Notifications:** `notifications`, `push_subscriptions`
- **Chat:** `chat_conversations`, `chat_messages`, `chat_conversation_messages`
- **Safety:** `rate_limit_windows`

Server code ต้องเรียก `await getDb()` จาก `src/lib/server/db/index.ts`; อย่าใช้ async proxy ใน SvelteKit SSR handlers

## Security

- JWT HS256 อายุ 30 วันใน cookie `httpOnly`, token ถูกเก็บเป็น SHA-256 hash
- Password hash ด้วย bcrypt 12 rounds
- Admin pages และ `/api/admin/*` ตรวจ role `ADMIN`
- AI database access ใช้ `READONLY_DATABASE_URL` และมี SQL safety layer
- Upload ใช้ R2; URL embeds ผ่าน validation/normalization
- CSP กำหนดใน `svelte.config.js`; rate limiting เก็บใน PostgreSQL
- ห้ามเปิดเผย `DATABASE_URL`, `READONLY_DATABASE_URL`, `AUTH_SECRET`, API keys, VAPID private key หรือ R2 credentials

## License

[MIT](LICENSE)

<p align="center">สร้างด้วย 💖 สำหรับชุมชนแฟนคลับ GL</p>
