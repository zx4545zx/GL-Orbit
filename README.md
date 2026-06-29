# GL-Orbit 🌸

> ศูนย์กลางข้อมูลและตารางฉายซีรีส์ GL (Girls' Love) จากทั่วโลก

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)

---

## ✨ จุดเด่น

- **ตารางฉายแม่นยำ** — รองรับ Timezone พร้อมระบุ Uncut version
- **ข้อมูลซีรีส์ครบถ้วน** — สตูดิโอ นักแสดง แพลตฟอร์มสตรีมมิ่ง
- **Countdown สด** — นับถอยหลังตอนใหม่แบบเรียลไทม์ (24 ชม.)
- **AI Chat** — ผู้ช่วยตอบคำถามเกี่ยวกับซีรีส์และตารางฉาย
- **ระบบสมาชิก** — โปรไฟล์ + Favorite/Watched + การแจ้งเตือน
- **แผงผู้ดูแลระบบ** — CRUD ซีรีส์ ตอน ตารางฉาย นักแสดง สตูดิโอ
- **SEO & PWA** — robots/sitemap/llms.txt, Open Graph, JSON-LD, ติดตั้งเป็นแอปได้
- **ดีไซน์โมเดิร์น** — Glassmorphism + สีพาสเทล + อนิเมชั่นลื่นไหล
- **Pending Shells** — Skeleton UI ระหว่างโหลดหน้า ลด perceived latency

---

## 🛠️ เทคโนโลยี

| ชั้น | เทคโนโลยี |
|------|-----------|
| Framework | [SvelteKit 2.x](https://kit.svelte.dev) |
| UI | [Svelte 5](https://svelte.dev) (Runes) + [Tailwind CSS 4](https://tailwindcss.com) |
| Language | [TypeScript 5.8](https://www.typescriptlang.org) |
| Database | [PostgreSQL](https://neon.tech) (Serverless) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | Custom JWT (jose + bcryptjs) |
| Build | [Vite 6](https://vitejs.dev) |
| PWA | [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/) |
| Deploy | [Vercel](https://vercel.com) (adapter-auto) |

---

## 🚀 เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` จาก `.env.example`:

```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
AUTH_SECRET=your-secret-key-at-least-32-chars
```

### 3. สร้างตารางฐานข้อมูล

```bash
npm run db:push
```

### 4. รัน development server

```bash
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173)

---

## 📜 คำสั่งที่ใช้บ่อย

```bash
# Development
npm run dev

# Production build
npm run build

# Type check
npm run check

# Database
npm run db:generate   # สร้าง migration
npm run db:push       # push schema ไปยัง DB
npm run db:studio     # เปิด Drizzle Studio GUI
```

---

## 🗄️ โครงสร้างฐานข้อมูล

| ตาราง | รายละเอียด |
|-------|------------|
| `users` | ผู้ใช้งาน (ADMIN / USER) |
| `series` | ซีรีส์ (UPCOMING / ONGOING / ENDED) |
| `episodes` | ตอนของซีรีส์ |
| `studios` | สตูดิโอผลิต |
| `platforms` | แพลตฟอร์มสตรีมมิ่ง |
| `artists` | นักแสดง/ศิลปิน |
| `episode_schedules` | ตารางฉายรายตอน |
| `series_schedules` | ตารางฉายประจำ (วัน+เวลา) |

---

## 🏗️ โครงสร้างโปรเจกต์

```
src/
├── routes/
│   ├── (app)/                # หน้า Public
│   │   ├── +page.svelte           # หน้าแรก (Hero + Countdown + Featured + SEO content)
│   │   ├── series/                # รายการ + รายละเอียดซีรีส์
│   │   ├── artists/               # รายการ + รายละเอียดนักแสดง
│   │   ├── calendar/              # ตารางฉายรายเดือน
│   │   ├── countdown/             # นับถอยหลังตอนใหม่
│   │   ├── explore/               # สำรวจซีรีส์/นักแสดง
│   │   ├── notifications/         # การแจ้งเตือน
│   │   ├── login/ · register/     # ยืนยันตัวตน
│   │   └── profile/               # โปรไฟล์ + Favorite/Watched
│   ├── (chat)/chat/             # AI Chat
│   ├── admin/                  # แผงผู้ดูแลระบบ (CRUD ทุกตาราง)
│   ├── api/                    # REST API (public + admin + chat)
│   ├── robots.txt/             # SEO: robots.txt
│   ├── sitemap.xml/            # SEO: sitemap (ดึงจาก DB)
│   ├── llms.txt/               # SEO: llms.txt สำหรับ LLM crawler
│   ├── og-image/               # SEO: dynamic Open Graph image
│   └── +error.svelte           # หน้า Error
├── lib/
│   ├── components/             # Svelte Components + Pending Shells
│   ├── server/
│   │   ├── db/                     # Schema + Connection (Neon HTTP)
│   │   └── auth/                   # JWT Session
│   ├── seo.ts                  # Open Graph + JSON-LD helpers
│   └── types/                  # TypeScript type definitions
├── app.css                     # Tailwind Theme + Animations + Utilities
└── app.html                    # HTML Template
```

---

## 🔍 SEO & PWA

- **Crawler files** — `/robots.txt`, `/sitemap.xml` (ดึงซีรีส์/นักแสดงจาก DB), `/llms.txt`
- **Open Graph** — ภาพ OG สร้างแบบ dynamic ที่ `/og-image`
- **JSON-LD** — `WebPage`, `WebSite`, `Organization`, `Person`, `BreadcrumbList`
- **PWA** — `manifest.webmanifest`, service worker, ติดตั้งเป็นแอป + รองรับ iOS standalone mode

## 🔐 การยืนยันตัวตน

- **Session** — JWT (HS256, 30 วัน) เก็บใน cookie `httpOnly`
- **Password** — bcrypt 12 rounds
- **Token** — เก็บ SHA-256 hash ในฐานข้อมูล (ไม่ใช่ token ดิบ)
- **Role** — `ADMIN` เข้า `/admin/*` ได้, `USER` เข้าหน้า public + `/profile`

---

## 📝 License

[MIT](LICENSE)

---

<p align="center">
  สร้างด้วย 💖 สำหรับชุมชนแฟนคลับ GL
</p>
