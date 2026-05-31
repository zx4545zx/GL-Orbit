# Pending Shells Design Specification

**Date:** 2026-05-31  
**Status:** Draft  
**Author:** AI Assistant

---

## Overview

Pending shells solve the perceived slowness of SvelteKit navigation by displaying skeleton UI immediately when navigation starts, while data fetching continues in the background.

### Problem Statement

SvelteKit navigation with `+page.server.ts` waits for `__data.json` before committing the route, causing perceived slowness when navigating between pages. Users experience a delay between clicking a navigation link and seeing the new page content.

### Solution

Display skeleton UI (pending shell) immediately when navigation starts, providing instant visual feedback while SvelteKit continues fetching data in the background.

### Scope

**Public Pages:**
- `/calendar` - CalendarPendingShell
- `/profile` - ProfilePendingShell
- `/series/[id]` - SeriesDetailPendingShell
- `/series` - SeriesPendingShell (already implemented)

**Admin Pages:**
- `/admin/series` - AdminSeriesPendingShell
- `/admin/artists` - AdminArtistsPendingShell
- `/admin/studios` - AdminStudiosPendingShell
- `/admin/platforms` - AdminPlatformsPendingShell
- `/admin/episodes` - AdminEpisodesPendingShell
- `/admin/schedules` - AdminSchedulesPendingShell
- `/admin/artist-socials` - AdminArtistSocialsPendingShell
- `/admin/series-artists` - AdminSeriesArtistsPendingShell
- `/admin/episode-schedules` - AdminEpisodeSchedulesPendingShell

---

## Architecture

### Approach: Hybrid - Base Shell + Composition

Create base shell components that provide common layout and styling, then extend them with page-specific content using Svelte slots.

**Benefits:**
- Balance between reusability and customization
- Reduced code duplication
- Easy maintenance
- Consistent with Svelte 5 patterns

### Component Hierarchy

```
PublicBaseShell.svelte (base layout)
├── CalendarPendingShell.svelte
├── ProfilePendingShell.svelte
├── SeriesDetailPendingShell.svelte
└── SeriesPendingShell.svelte

AdminBaseShell.svelte (base layout)
├── AdminSeriesPendingShell.svelte
├── AdminArtistsPendingShell.svelte
├── AdminStudiosPendingShell.svelte
├── AdminPlatformsPendingShell.svelte
├── AdminEpisodesPendingShell.svelte
├── AdminSchedulesPendingShell.svelte
├── AdminArtistSocialsPendingShell.svelte
├── AdminSeriesArtistsPendingShell.svelte
└── AdminEpisodeSchedulesPendingShell.svelte
```

---

## Base Shell Components

### PublicBaseShell.svelte

**Purpose:** Base layout for public pages with centered container, title, and content slot.

**Props:**
```typescript
interface Props {
  title: string;
  subtitle?: string;
}
```

**Structure:**
```svelte
<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
  }
  
  let { title, subtitle }: Props = $props();
</script>

<section aria-busy="true" aria-live="polite" class="container mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-4xl font-display font-bold text-plum mb-2">
      {title}
    </h1>
    {#if subtitle}
      <p class="text-lg text-gray-600">{subtitle}</p>
    {/if}
  </header>
  
  <div class="animate-pulse">
    <slot name="content">
      <!-- Default skeleton if no content provided -->
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="h-20 glass-card rounded-2xl"></div>
        {/each}
      </div>
    </slot>
  </div>
</section>
```

**Styling:**
- Glassmorphism containers
- Coral/lavender/mint colors with opacity
- Respects `prefers-reduced-motion`

---

### AdminBaseShell.svelte

**Purpose:** Base layout for admin pages with header, breadcrumbs, action buttons, and table skeleton.

**Props:**
```typescript
interface Props {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  tableColumns: string[];
  rowCount?: number; // default: 5
}
```

**Structure:**
```svelte
<script lang="ts">
  interface Props {
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
    tableColumns: string[];
    rowCount?: number;
  }
  
  let { title, breadcrumbs, tableColumns, rowCount = 5 }: Props = $props();
</script>

<section aria-busy="true" aria-live="polite" class="min-h-screen bg-gray-50">
  <!-- Admin Header -->
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <!-- Breadcrumbs -->
        <nav class="flex gap-2 text-sm text-gray-500 mb-1">
          {#each breadcrumbs as crumb, i}
            {#if crumb.href}
              <a href={crumb.href} class="hover:text-coral">{crumb.label}</a>
            {:else}
              <span>{crumb.label}</span>
            {/if}
            {#if i < breadcrumbs.length - 1}
              <span>/</span>
            {/if}
          {/each}
        </nav>
        <h1 class="text-2xl font-display font-bold text-plum">{title}</h1>
      </div>
      
      <!-- Action Buttons Skeleton -->
      <div class="flex gap-2">
        <slot name="actions">
          <div class="h-10 w-24 glass-card rounded-xl animate-pulse"></div>
          <div class="h-10 w-24 glass-card rounded-xl animate-pulse"></div>
        </slot>
      </div>
    </div>
  </header>
  
  <!-- Table Skeleton -->
  <div class="p-6">
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <!-- Table Header -->
      <div class="grid gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200"
           style="grid-template-columns: repeat({tableColumns.length}, minmax(0, 1fr))">
        {#each tableColumns as col}
          <div class="h-4 bg-lavender/30 rounded w-3/4"></div>
        {/each}
      </div>
      
      <!-- Table Rows -->
      {#each Array(rowCount) as _, i}
        <div class="grid gap-4 px-6 py-4 border-b border-gray-100 animate-pulse"
             style="grid-template-columns: repeat({tableColumns.length}, minmax(0, 1fr))">
          {#each tableColumns as _, j}
            <div class="h-4 bg-gray-200 rounded"
                 class:w-3/4={j === 0}
                 class:w-1/2={j > 0}></div>
          {/each}
        </div>
      {/each}
    </div>
    
    <!-- Pagination Skeleton -->
    <div class="flex justify-center gap-2 mt-6">
      {#each Array(5) as _}
        <div class="h-10 w-10 glass-card rounded-xl animate-pulse"></div>
      {/each}
    </div>
  </div>
</section>
```

**Styling:**
- Gray background (admin theme)
- White table container with shadow
- Lavender/gray skeleton colors
- Respects `prefers-reduced-motion`

---

## Public Page Shells

### CalendarPendingShell.svelte

**Layout:** Week view navigation + episode cards grid

**Implementation:**
```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="ตารางฉาย" subtitle="ดูตารางฉายซีรีส์ GL">
  <div slot="content">
    <!-- Week navigation skeleton -->
    <div class="flex gap-2 mb-6">
      {#each Array(7) as _}
        <div class="h-10 w-20 glass-card rounded-xl animate-pulse"></div>
      {/each}
    </div>
    
    <!-- Episode cards grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(6) as _}
        <div class="glass-card rounded-2xl p-4 animate-pulse">
          <div class="h-4 bg-lavender/30 rounded mb-2"></div>
          <div class="h-6 bg-coral/30 rounded mb-3"></div>
          <div class="h-3 bg-mint/30 rounded"></div>
        </div>
      {/each}
    </div>
  </div>
</PublicBaseShell>
```

---

### ProfilePendingShell.svelte

**Layout:** User info + edit form

**Implementation:**
```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="โปรไฟล์" subtitle="จัดการบัญชีของคุณ">
  <div slot="content">
    <!-- Avatar + name skeleton -->
    <div class="flex items-center gap-4 mb-8">
      <div class="w-20 h-20 rounded-full bg-lavender/30 animate-pulse"></div>
      <div class="flex-1">
        <div class="h-6 bg-coral/30 rounded w-48 mb-2"></div>
        <div class="h-4 bg-mint/30 rounded w-32"></div>
      </div>
    </div>
    
    <!-- Form fields skeleton -->
    <div class="space-y-4">
      {#each Array(4) as _}
        <div>
          <div class="h-4 bg-lavender/30 rounded w-24 mb-2"></div>
          <div class="h-12 glass-card rounded-xl animate-pulse"></div>
        </div>
      {/each}
    </div>
  </div>
</PublicBaseShell>
```

---

### SeriesDetailPendingShell.svelte

**Layout:** Poster + info + episodes list

**Implementation:**
```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="รายละเอียดซีรีส์">
  <div slot="content">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Poster skeleton -->
      <div class="aspect-[3/4] glass-card rounded-2xl animate-pulse"></div>
      
      <!-- Info skeleton -->
      <div class="md:col-span-2 space-y-4">
        <div class="h-8 bg-coral/30 rounded w-3/4"></div>
        <div class="h-4 bg-lavender/30 rounded w-1/2"></div>
        <div class="h-4 bg-mint/30 rounded w-2/3"></div>
        
        <!-- Tags skeleton -->
        <div class="flex gap-2 mt-4">
          {#each Array(3) as _}
            <div class="h-8 w-20 glass-card rounded-full animate-pulse"></div>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Episodes list skeleton -->
    <div class="mt-8 space-y-3">
      {#each Array(5) as _}
        <div class="glass-card rounded-xl p-4 animate-pulse">
          <div class="h-5 bg-lavender/30 rounded w-32 mb-2"></div>
          <div class="h-3 bg-mint/30 rounded w-48"></div>
        </div>
      {/each}
    </div>
  </div>
</PublicBaseShell>
```

---

### SeriesPendingShell.svelte

**Status:** Already implemented in commit `319172f`

**Layout:** Search bar + filter buttons + series cards grid

---

## Admin Page Shells

All admin shells follow the same pattern using `AdminBaseShell` with page-specific props.

### AdminSeriesPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการซีรีส์"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ซีรีส์' }
  ]}
  tableColumns={['ชื่อเรื่อง', 'สตูดิโอ', 'สถานะ', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminArtistsPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการนักแสดง"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'นักแสดง' }
  ]}
  tableColumns={['ชื่อ', 'ชื่อภาษาอังกฤษ', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminStudiosPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการสตูดิโอ"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'สตูดิโอ' }
  ]}
  tableColumns={['ชื่อสตูดิโอ', 'ประเทศ', 'ซีรีส์', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminPlatformsPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการแพลตฟอร์ม"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'แพลตฟอร์ม' }
  ]}
  tableColumns={['ชื่อแพลตฟอร์ม', 'URL', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminEpisodesPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตอน"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตอน' }
  ]}
  tableColumns={['ซีรีส์', 'ตอนที่', 'ชื่อตอน', 'วันที่ออกอากาศ', 'Actions']}
/>
```

### AdminSchedulesPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตารางฉาย"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตารางฉาย' }
  ]}
  tableColumns={['ซีรีส์', 'วัน', 'เวลา', 'แพลตฟอร์ม', 'Actions']}
/>
```

### AdminArtistSocialsPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการโซเชียลนักแสดง"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'โซเชียลนักแสดง' }
  ]}
  tableColumns={['นักแสดง', 'แพลตฟอร์ม', 'URL', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminSeriesArtistsPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการนักแสดงซีรีส์"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'นักแสดงซีรีส์' }
  ]}
  tableColumns={['ซีรีส์', 'นักแสดง', 'บทบาท', 'วันที่สร้าง', 'Actions']}
/>
```

### AdminEpisodeSchedulesPendingShell.svelte

```svelte
<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตารางฉายตอน"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตารางฉายตอน' }
  ]}
  tableColumns={['ตอน', 'วันที่', 'เวลา', 'แพลตฟอร์ม', 'Actions']}
/>
```

---

## Navigation Detection

### Public Pages: (app)/+layout.svelte

**Detection Logic:**
```typescript
import { navigating, page } from '$app/state';

const pendingShell = $derived(() => {
  const to = navigating.to?.url.pathname;
  const from = page.url.pathname;
  
  if (!to || to === from) return null;
  
  if (to.startsWith('/calendar') && !from.startsWith('/calendar')) {
    return 'calendar';
  }
  if (to.startsWith('/profile') && !from.startsWith('/profile')) {
    return 'profile';
  }
  if (to.match(/^\/series\/[^/]+$/) && !from.startsWith('/series/')) {
    return 'series-detail';
  }
  if (to === '/series' && !from.startsWith('/series')) {
    return 'series';
  }
  
  return null;
})();
```

**Layout Integration:**
```svelte
{#if pendingShell === 'calendar'}
  <CalendarPendingShell />
{:else if pendingShell === 'profile'}
  <ProfilePendingShell />
{:else if pendingShell === 'series-detail'}
  <SeriesDetailPendingShell />
{:else if pendingShell === 'series'}
  <SeriesPendingShell />
{:else}
  {@render children()}
{/if}
```

---

### Admin Pages: admin/+layout.svelte

**Detection Logic:**
```typescript
import { navigating, page } from '$app/state';

const pendingAdminShell = $derived(() => {
  const to = navigating.to?.url.pathname;
  const from = page.url.pathname;
  
  if (!to || !to.startsWith('/admin/') || to === from) return null;
  
  const shellMap = {
    '/admin/series': 'series',
    '/admin/artists': 'artists',
    '/admin/studios': 'studios',
    '/admin/platforms': 'platforms',
    '/admin/episodes': 'episodes',
    '/admin/schedules': 'schedules',
    '/admin/artist-socials': 'artist-socials',
    '/admin/series-artists': 'series-artists',
    '/admin/episode-schedules': 'episode-schedules'
  };
  
  return shellMap[to] || null;
})();
```

**Layout Integration:**
```svelte
{#if pendingAdminShell === 'series'}
  <AdminSeriesPendingShell />
{:else if pendingAdminShell === 'artists'}
  <AdminArtistsPendingShell />
{:else if pendingAdminShell === 'studios'}
  <AdminStudiosPendingShell />
{:else if pendingAdminShell === 'platforms'}
  <AdminPlatformsPendingShell />
{:else if pendingAdminShell === 'episodes'}
  <AdminEpisodesPendingShell />
{:else if pendingAdminShell === 'schedules'}
  <AdminSchedulesPendingShell />
{:else if pendingAdminShell === 'artist-socials'}
  <AdminArtistSocialsPendingShell />
{:else if pendingAdminShell === 'series-artists'}
  <AdminSeriesArtistsPendingShell />
{:else if pendingAdminShell === 'episode-schedules'}
  <AdminEpisodeSchedulesPendingShell />
{:else}
  {@render children()}
{/if}
```

---

## Key Principles

### 1. SSR-Safe

Pending shells never render server-side:
- During SSR, `navigating` is `undefined`
- `navigating.to?.url.pathname` evaluates to `undefined`
- Shell condition never evaluates to true
- Direct visits get real SSR content (SEO preserved)

### 2. Precise Activation

Only show shell when navigating TO a route FROM a different route:
- Home → /calendar: shell shows ✅
- /calendar → /calendar: no shell (same route) ✅
- /series → /series/123: no shell (already in series section) ✅
- /series/123 → /series/456: no shell (series-to-series) ✅

### 3. No Bypass

SvelteKit navigation continues normally:
- Shells are purely visual replacements
- `+page.server.ts` load functions run unchanged
- `__data.json` fetching continues in background
- Real content replaces shell when navigation completes

### 4. Accessibility

All shells include:
- `aria-busy="true"` on container element
- `aria-live="polite"` for screen reader announcements
- Respects `prefers-reduced-motion` via global CSS
- Semantic HTML structure

### 5. Thai UI

All shell text in Thai:
- "กำลังโหลด..."
- "กำลังเตรียมข้อมูล..."
- "กำลังเปิดหน้า..."

---

## Documentation Updates

### AGENTS.md

Add new section: "Navigation UX & Pending Shells"

### README.md

Add to "✨ จุดเด่น" section:
- Navigation ทันใจ — แสดง skeleton UI ทันทีเมื่อกดเมนู ไม่ต้องรอโหลดข้อมูล
- SEO-friendly — รองรับ SSR, JSON-LD, canonical URLs, robots meta

### ARCHITECTURE.md

Add new section: "Pending Shells Architecture"

### CODE_STYLE.md

Add new section: "Pending Shell Components"

### CLAUDE.md

Add new section: "Pending Shells"

---

## Implementation Plan

### Phase 1: Base Shells
1. Create `PublicBaseShell.svelte`
2. Create `AdminBaseShell.svelte`
3. Test base shells in isolation

### Phase 2: Public Page Shells
1. Create `CalendarPendingShell.svelte`
2. Create `ProfilePendingShell.svelte`
3. Create `SeriesDetailPendingShell.svelte`
4. Update `(app)/+layout.svelte` with navigation detection
5. Test all public shells

### Phase 3: Admin Page Shells
1. Create 9 admin pending shells
2. Update `admin/+layout.svelte` with navigation detection
3. Test all admin shells

### Phase 4: Documentation
1. Update AGENTS.md
2. Update README.md
3. Update ARCHITECTURE.md
4. Update CODE_STYLE.md
5. Update CLAUDE.md

### Phase 5: Verification
1. Run `npm run check` (0 errors)
2. Run `npm run build` (success)
3. Manual testing of all navigation paths
4. Verify SSR behavior (direct visits)
5. Verify accessibility (screen reader, reduced motion)

---

## Success Criteria

- [ ] All pending shells display immediately on navigation
- [ ] No visual flicker or layout shift
- [ ] SSR works correctly (direct visits get real content)
- [ ] Accessibility requirements met
- [ ] All documentation updated
- [ ] `npm run check` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] Manual testing confirms smooth UX across all routes

---

## Files to Create/Modify

### New Files
- `src/lib/components/PublicBaseShell.svelte`
- `src/lib/components/AdminBaseShell.svelte`
- `src/lib/components/CalendarPendingShell.svelte`
- `src/lib/components/ProfilePendingShell.svelte`
- `src/lib/components/SeriesDetailPendingShell.svelte`
- `src/lib/components/AdminSeriesPendingShell.svelte`
- `src/lib/components/AdminArtistsPendingShell.svelte`
- `src/lib/components/AdminStudiosPendingShell.svelte`
- `src/lib/components/AdminPlatformsPendingShell.svelte`
- `src/lib/components/AdminEpisodesPendingShell.svelte`
- `src/lib/components/AdminSchedulesPendingShell.svelte`
- `src/lib/components/AdminArtistSocialsPendingShell.svelte`
- `src/lib/components/AdminSeriesArtistsPendingShell.svelte`
- `src/lib/components/AdminEpisodeSchedulesPendingShell.svelte`

### Modified Files
- `src/routes/(app)/+layout.svelte` (add navigation detection)
- `src/routes/admin/+layout.svelte` (add navigation detection)
- `AGENTS.md` (add pending shells section)
- `README.md` (add navigation UX feature)
- `ARCHITECTURE.md` (add pending shells architecture)
- `CODE_STYLE.md` (add pending shell pattern)
- `CLAUDE.md` (add pending shells reference)

---

## Conclusion

This design provides a comprehensive solution for improving navigation UX across all pages while maintaining SSR compatibility, accessibility, and code maintainability through the hybrid base shell + composition approach.
