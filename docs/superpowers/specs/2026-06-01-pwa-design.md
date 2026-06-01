# PWA (Basic — Installable) — Design Spec

**Date:** 2026-06-01
**Status:** validated
**Scope:** เพิ่ม PWA support ระดับ Basic — ให้ GL-Orbit ติดตั้งเป็นแอปได้ (Add to Home Screen)

---

## Problem Statement

ปัจจุบัน GL-Orbit เป็นเว็บแอปธรรมดา — ผู้ใช้ไม่สามารถติดตั้งลงหน้าจอมือถือได้ ไม่มีไอคอนแอป ไม่มี splash screen แฟนคลับที่เข้าเว็บบ่อยๆ ต้องเปิด browser ทุกครั้ง สูญเสียความเป็น "แอป" ไป

**เป้าหมาย:** ทำให้ GL-Orbit เป็น installable PWA โดยใช้เวลาน้อยที่สุด ไม่กระทบฟีเจอร์ที่มีอยู่

---

## Constraints

- **ห้ามกระทบฟีเจอร์ที่มีอยู่** — Auth, DB, หน้า series/calendar/admin ต้องทำงานปกติ
- **ไม่มี offline caching** — ข้อมูลทุกอย่างยังโหลดจาก server เหมือนเดิม
- **ใช้ plugin สำเร็จรูป** — `@vite-pwa/sveltekit` จัดการทุกอย่าง ลดโอกาส bug
- **UI ภาษาไทย** — manifest ใช้ภาษาไทย
- **สีตาม theme เดิม** — coral (#FF6B9D), cream (#FFF5F7)

---

## Approach

ใช้ `@vite-pwa/sveltekit` — plugin ทางการสำหรับ SvelteKit + Vite 6:

- **ข้อดี:** config น้อย, auto-generate manifest + icons + meta tags, มี service worker ให้เลย
- **เทียบกับ manual:** manual ต้องเขียน manifest.json, service worker, icon resize มือเอง — งานเยอะ โอกาสพลาดสูง ไม่คุ้มกับ scope นี้

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│  src/app.html                                │
│  └─ <link rel="manifest">  (plugin inject)   │
│  └─ <meta name="theme-color"> (plugin inject) │
├─────────────────────────────────────────────┤
│  vite.config.ts                              │
│  └─ SvelteKitPWA({                           │
│       manifest: { name, theme_color, ... },  │
│       workbox: { globPatterns: [...] }       │
│     })                                       │
├─────────────────────────────────────────────┤
│  src/service-worker.ts  (NEW)                │
│  └─ precache shell assets (HTML/CSS/JS)      │
│  └─ ไม่แคช API/DB data                       │
├─────────────────────────────────────────────┤
│  static/icons/                               │
│  ├─ gl-orbit-icon.png  (600x600, source)     │
│  └─ gl-orbit-icon.ico                        │
│  (plugin สร้าง 192, 512, apple-touch-icon)    │
└─────────────────────────────────────────────┘
```

---

## Components

### 1. PWA Plugin Config (`vite.config.ts`)

เพิ่ม `SvelteKitPWA` plugin เข้าไปใน array `plugins:` ต่อท้าย `sveltekit()`:

| Config Key              | Value                                              |
| ---------------------- | -------------------------------------------------- |
| `registerType`         | `autoUpdate`                                       |
| `manifest.name`        | GL-Orbit                                           |
| `manifest.short_name`  | GL-Orbit                                           |
| `manifest.description` | ศูนย์กลางข้อมูลและตารางฉายซีรีส์ GL                  |
| `manifest.theme_color` | #FF6B9D                                            |
| `manifest.background_color` | #FFF5F7                                        |
| `manifest.display`     | standalone                                         |
| `manifest.lang`        | th                                                 |
| `manifest.icons`       | สร้างจาก `static/icons/gl-orbit-icon.png` (600x600) |
| `workbox.globPatterns` | `['**/*.{html,css,js,woff2}']` — precache เท่านี้    |

### 2. Service Worker (`src/service-worker.ts`)

สร้างเฉพาะไฟล์เปล่า (หรือใช้ auto-generated จาก plugin)

- Plugin จัดการ registration + update lifecycle ให้อัตโนมัติ
- Precache shell assets (HTML, CSS, JS, fonts)
- **ไม่แคช:** API responses, DB queries, `/admin/*`

### 3. App Icons (`static/icons/`)

| ไฟล์                    | แหล่งที่มา         |
| --------------------- | -------------- |
| `gl-orbit-icon.png`   | ผู้ใช้ upload    |
| `gl-orbit-icon.ico`   | ผู้ใช้ upload    |
| `pwa-192x192.png`     | plugin สร้างให้  |
| `pwa-512x512.png`     | plugin สร้างให้  |
| `apple-touch-icon.png`| plugin สร้างให้  |

### 4. Meta Tags (plugin inject ให้อัตโนมัติ)

Plugin เพิ่ม tags เหล่านี้ใน `<head>` อัตโนมัติ:

- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color" content="#FF6B9D">`
- `<link rel="apple-touch-icon" href="...">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`

---

## Data Flow

1. User visits GL-Orbit → browser loads page as normal
2. Browser detects `<link rel="manifest">` + registered service worker → shows "Install" prompt
3. User taps Install → browser creates standalone app window with GL-Orbit icon
4. Subsequent visits → opens as standalone app, splash screen with coral background
5. Service worker precaches shell assets on first load → faster subsequent loads
6. **All data (series, schedules, auth) still fetched from server** — no offline mode

---

## Error Handling

- **Plugin loads icon source:** ถ้า `gl-orbit-icon.png` ไม่มี → build ล้มเหลว (catch at build time)
- **Service worker registration fails:** browser silently falls back to normal page — no user impact
- **Icon resize ผิดพลาด:** plugin แจ้ง warning ใน build log → ตรวจสอบก่อน deploy

---

## Testing Strategy

| Test                              | วิธีตรวจสอบ                                                         |
| --------------------------------- | ---------------------------------------------------------------- |
| Build passes                      | `npm run build` ต้องสำเร็จ ไม่มี error                           |
| Manifest ใช้งานได้                 | เปิด Chrome DevTools > Application > Manifest — ต้องแสดงข้อมูลถูกต้อง |
| Service worker registered         | Chrome DevTools > Application > Service Workers — ต้อง active     |
| Install prompt แสดงผล             | Chrome DevTools > Application > Manifest → "Install" button       |
| App icon ถูกต้อง                   | ติดตั้งแล้วดู icon บนหน้าจอ — ต้องเป็นรูป GL-Orbit                 |
| Auth + หน้าเดิมยังทำงาน            | Manual test: login, ดู series, calendar — ทุกอย่างปกติ             |
| Lighthouse PWA score              | Lighthouse audit → PWA score ควร ≥ 90                            |

---

## Dependencies

เพิ่มใน `package.json` (devDependencies):

- `@vite-pwa/sveltekit` — PWA plugin สำหรับ SvelteKit
- `vite-plugin-pwa` — dependency ของข้างบน (อาจ auto-install)

---

## Open Questions

ไม่มี — scope ชัดเจนแล้ว

