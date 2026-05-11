GL-Orbit: Folder Structure

โครงสร้างโฟลเดอร์แบบแบ่งแยกส่วน Server-Side อย่างชัดเจน

/
├── src/
│   ├── app.html                 # HTML template (Google Fonts)
│   ├── app.css                  # Global styles + Tailwind theme + animations
│   ├── app.d.ts                 # Type declarations (App.Locals)
│   ├── hooks.server.ts          # Session validation middleware
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle schema definitions
│   │   │   │   └── index.ts     # DB connection (Neon HTTP, lazy init)
│   │   │   └── auth/
│   │   │       ├── session.ts   # JWT create/validate/destroy
│   │   │       ├── user.ts      # User DB queries
│   │   │       └── password.ts  # bcrypt hash/verify
│   │   ├── components/
│   │   │   ├── Navigation.svelte    # Desktop nav (md:block)
│   │   │   ├── BottomNav.svelte     # Mobile nav (md:hidden)
│   │   │   ├── Footer.svelte
│   │   │   └── PasswordInput.svelte # Reusable password + toggle
│   │   └── utils/
│   └── routes/
│       ├── +layout.svelte       # Root layout (Nav + BottomNav + Footer)
│       ├── +layout.server.ts    # Expose user to all pages
│       ├── (app)/               # Public pages
│       │   ├── +layout.svelte
│       │   ├── +page.svelte         # Landing / Hero
│       │   ├── series/
│       │   │   ├── +page.svelte     # Series listing
│       │   │   └── [id]/
│       │   │       └── +page.svelte # Series detail
│       │   ├── calendar/
│       │   │   └── +page.svelte     # Schedule views
│       │   ├── login/
│       │   │   ├── +page.svelte
│       │   │   └── +page.server.ts
│       │   └── register/
│       │       ├── +page.svelte
│       │       └── +page.server.ts
│       ├── profile/
│       │   ├── +page.svelte         # User profile + edit + change password
│       │   └── +page.server.ts
│       ├── logout/
│       │   └── +server.ts           # POST endpoint
│       └── admin/                   # Admin panel (protected)
│           ├── +layout.svelte
│           ├── +layout.server.ts    # Auth guard (ADMIN only)
│           ├── login/
│           │   ├── +page.svelte
│           │   └── +page.server.ts
│           ├── series/
│           │   └── +page.svelte     # Series CRUD UI
│           └── schedules/
│               └── +page.svelte     # Schedule management
├── scripts/
│   ├── seed-admin.ts          # Create initial admin user
│   └── seed-data.ts           # Seed mock data (users, studios, platforms, artists, series, episodes, schedules)
├── drizzle/                   # Auto-generated migrations
│   ├── meta/
│   └── 0000_*.sql
├── static/                    # Static assets
├── .env
├── .env.example
├── drizzle.config.ts
├── package.json
└── svelte.config.js
