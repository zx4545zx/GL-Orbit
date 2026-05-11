GL-Orbit: Technology Stack

Frontend & Backend (SSR)

Framework: SvelteKit 2.x (SSR + File-based routing)

UI Framework: Svelte 5 (Runes: $state, $derived, $effect, $props)

Language: TypeScript 5.8 (strict: true, module: NodeNext)

Styling: Tailwind CSS 4.x (@tailwindcss/vite)

Build Tool: Vite 6.x

Database & Persistence

Database: PostgreSQL (Neon.tech) — Serverless Postgres

ORM: Drizzle ORM 0.43 + drizzle-kit (migration)

DB Driver: @neondatabase/serverless (HTTP proxy สำหรับ Edge/Serverless)

Auth & Security

Session: Custom JWT (jose — HS256) + bcryptjs (password hashing)

Cookie: httpOnly, secure (production), sameSite: lax

Env: dotenv สำหรับโหลดตัวแปรสภาพแวดล้อม

Infrastructure

Hosting: Vercel (adapter-auto)

CI/CD: GitHub Actions (Vercel Integration)

Env Management: Vercel Environment Variables
