# Pending Shells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement pending shells for all pages to provide instant visual feedback during navigation while maintaining SSR compatibility and SEO.

**Architecture:** Hybrid approach using base shell components (PublicBaseShell, AdminBaseShell) that provide common layout, extended by page-specific shells using Svelte composition. Navigation detection uses `$derived` with `$app/state` in layout files to show shells only when navigating TO a route FROM a different route.

**Tech Stack:** SvelteKit 2.x, Svelte 5 (Runes), TypeScript, Tailwind CSS 4.x

---

## File Structure

### New Files (14 components)

**Base Shells:**
- `src/lib/components/PublicBaseShell.svelte` - Base layout for public pages
- `src/lib/components/AdminBaseShell.svelte` - Base layout for admin pages

**Public Page Shells:**
- `src/lib/components/CalendarPendingShell.svelte` - Calendar page skeleton
- `src/lib/components/ProfilePendingShell.svelte` - Profile page skeleton
- `src/lib/components/SeriesDetailPendingShell.svelte` - Series detail page skeleton

**Admin Page Shells:**
- `src/lib/components/AdminSeriesPendingShell.svelte` - Admin series skeleton
- `src/lib/components/AdminArtistsPendingShell.svelte` - Admin artists skeleton
- `src/lib/components/AdminStudiosPendingShell.svelte` - Admin studios skeleton
- `src/lib/components/AdminPlatformsPendingShell.svelte` - Admin platforms skeleton
- `src/lib/components/AdminEpisodesPendingShell.svelte` - Admin episodes skeleton
- `src/lib/components/AdminSchedulesPendingShell.svelte` - Admin schedules skeleton
- `src/lib/components/AdminArtistSocialsPendingShell.svelte` - Admin artist socials skeleton
- `src/lib/components/AdminSeriesArtistsPendingShell.svelte` - Admin series artists skeleton
- `src/lib/components/AdminEpisodeSchedulesPendingShell.svelte` - Admin episode schedules skeleton

### Modified Files (7 files)

**Layout Files:**
- `src/routes/(app)/+layout.svelte` - Add navigation detection for public pages
- `src/routes/admin/+layout.svelte` - Add navigation detection for admin pages

**Documentation:**
- `AGENTS.md` - Add pending shells section
- `README.md` - Add navigation UX feature
- `ARCHITECTURE.md` - Add pending shells architecture
- `CODE_STYLE.md` - Add pending shell pattern
- `CLAUDE.md` - Add pending shells reference

---

## Phase 1: Base Shell Components

### Task 1: Create PublicBaseShell Component

**Files:**
- Create: `src/lib/components/PublicBaseShell.svelte`

- [ ] **Step 1: Create PublicBaseShell with props and slot**

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
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="h-20 glass-card rounded-2xl"></div>
        {/each}
      </div>
    </slot>
  </div>
</section>
```

- [ ] **Step 2: Verify component structure**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/PublicBaseShell.svelte
git commit -m "feat(components): add PublicBaseShell for pending navigation"
```

---

### Task 2: Create AdminBaseShell Component

**Files:**
- Create: `src/lib/components/AdminBaseShell.svelte`

- [ ] **Step 1: Create AdminBaseShell with table skeleton**

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
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
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
      
      <div class="flex gap-2">
        <slot name="actions">
          <div class="h-10 w-24 glass-card rounded-xl animate-pulse"></div>
          <div class="h-10 w-24 glass-card rounded-xl animate-pulse"></div>
        </slot>
      </div>
    </div>
  </header>
  
  <div class="p-6">
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="grid gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200"
           style="grid-template-columns: repeat({tableColumns.length}, minmax(0, 1fr))">
        {#each tableColumns as col}
          <div class="h-4 bg-lavender/30 rounded w-3/4"></div>
        {/each}
      </div>
      
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
    
    <div class="flex justify-center gap-2 mt-6">
      {#each Array(5) as _}
        <div class="h-10 w-10 glass-card rounded-xl animate-pulse"></div>
      {/each}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify component structure**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminBaseShell.svelte
git commit -m "feat(components): add AdminBaseShell for pending navigation"
```

---

## Phase 2: Public Page Shells

### Task 3: Create CalendarPendingShell

**Files:**
- Create: `src/lib/components/CalendarPendingShell.svelte`

- [ ] **Step 1: Create CalendarPendingShell with week view skeleton**

```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="ตารางฉาย" subtitle="ดูตารางฉายซีรีส์ GL">
  <div slot="content">
    <div class="flex gap-2 mb-6">
      {#each Array(7) as _}
        <div class="h-10 w-20 glass-card rounded-xl animate-pulse"></div>
      {/each}
    </div>
    
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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/CalendarPendingShell.svelte
git commit -m "feat(components): add CalendarPendingShell"
```

---

### Task 4: Create ProfilePendingShell

**Files:**
- Create: `src/lib/components/ProfilePendingShell.svelte`

- [ ] **Step 1: Create ProfilePendingShell with form skeleton**

```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="โปรไฟล์" subtitle="จัดการบัญชีของคุณ">
  <div slot="content">
    <div class="flex items-center gap-4 mb-8">
      <div class="w-20 h-20 rounded-full bg-lavender/30 animate-pulse"></div>
      <div class="flex-1">
        <div class="h-6 bg-coral/30 rounded w-48 mb-2"></div>
        <div class="h-4 bg-mint/30 rounded w-32"></div>
      </div>
    </div>
    
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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ProfilePendingShell.svelte
git commit -m "feat(components): add ProfilePendingShell"
```

---

### Task 5: Create SeriesDetailPendingShell

**Files:**
- Create: `src/lib/components/SeriesDetailPendingShell.svelte`

- [ ] **Step 1: Create SeriesDetailPendingShell with poster and episodes skeleton**

```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="รายละเอียดซีรีส์">
  <div slot="content">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="aspect-[3/4] glass-card rounded-2xl animate-pulse"></div>
      
      <div class="md:col-span-2 space-y-4">
        <div class="h-8 bg-coral/30 rounded w-3/4"></div>
        <div class="h-4 bg-lavender/30 rounded w-1/2"></div>
        <div class="h-4 bg-mint/30 rounded w-2/3"></div>
        
        <div class="flex gap-2 mt-4">
          {#each Array(3) as _}
            <div class="h-8 w-20 glass-card rounded-full animate-pulse"></div>
          {/each}
        </div>
      </div>
    </div>
    
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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/SeriesDetailPendingShell.svelte
git commit -m "feat(components): add SeriesDetailPendingShell"
```

---

### Task 6: Update (app)/+layout.svelte with Navigation Detection

**Files:**
- Modify: `src/routes/(app)/+layout.svelte`

- [ ] **Step 1: Add navigation detection logic**

Add to `<script>` section:

```typescript
import { navigating, page } from '$app/state';
import CalendarPendingShell from '$lib/components/CalendarPendingShell.svelte';
import ProfilePendingShell from '$lib/components/ProfilePendingShell.svelte';
import SeriesDetailPendingShell from '$lib/components/SeriesDetailPendingShell.svelte';
import SeriesPendingShell from '$lib/components/SeriesPendingShell.svelte';

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

- [ ] **Step 2: Update template to show shells**

Replace `{@render children()}` with:

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

- [ ] **Step 3: Verify layout**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(app\)/+layout.svelte
git commit -m "feat(layout): add pending shell navigation for public pages"
```

---

## Phase 3: Admin Page Shells

### Task 7: Create AdminSeriesPendingShell

**Files:**
- Create: `src/lib/components/AdminSeriesPendingShell.svelte`

- [ ] **Step 1: Create AdminSeriesPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminSeriesPendingShell.svelte
git commit -m "feat(components): add AdminSeriesPendingShell"
```

---

### Task 8: Create AdminArtistsPendingShell

**Files:**
- Create: `src/lib/components/AdminArtistsPendingShell.svelte`

- [ ] **Step 1: Create AdminArtistsPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminArtistsPendingShell.svelte
git commit -m "feat(components): add AdminArtistsPendingShell"
```

---

### Task 9: Create AdminStudiosPendingShell

**Files:**
- Create: `src/lib/components/AdminStudiosPendingShell.svelte`

- [ ] **Step 1: Create AdminStudiosPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminStudiosPendingShell.svelte
git commit -m "feat(components): add AdminStudiosPendingShell"
```

---

### Task 10: Create AdminPlatformsPendingShell

**Files:**
- Create: `src/lib/components/AdminPlatformsPendingShell.svelte`

- [ ] **Step 1: Create AdminPlatformsPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminPlatformsPendingShell.svelte
git commit -m "feat(components): add AdminPlatformsPendingShell"
```

---

### Task 11: Create AdminEpisodesPendingShell

**Files:**
- Create: `src/lib/components/AdminEpisodesPendingShell.svelte`

- [ ] **Step 1: Create AdminEpisodesPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminEpisodesPendingShell.svelte
git commit -m "feat(components): add AdminEpisodesPendingShell"
```

---

### Task 12: Create AdminSchedulesPendingShell

**Files:**
- Create: `src/lib/components/AdminSchedulesPendingShell.svelte`

- [ ] **Step 1: Create AdminSchedulesPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminSchedulesPendingShell.svelte
git commit -m "feat(components): add AdminSchedulesPendingShell"
```

---

### Task 13: Create AdminArtistSocialsPendingShell

**Files:**
- Create: `src/lib/components/AdminArtistSocialsPendingShell.svelte`

- [ ] **Step 1: Create AdminArtistSocialsPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminArtistSocialsPendingShell.svelte
git commit -m "feat(components): add AdminArtistSocialsPendingShell"
```

---

### Task 14: Create AdminSeriesArtistsPendingShell

**Files:**
- Create: `src/lib/components/AdminSeriesArtistsPendingShell.svelte`

- [ ] **Step 1: Create AdminSeriesArtistsPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminSeriesArtistsPendingShell.svelte
git commit -m "feat(components): add AdminSeriesArtistsPendingShell"
```

---

### Task 15: Create AdminEpisodeSchedulesPendingShell

**Files:**
- Create: `src/lib/components/AdminEpisodeSchedulesPendingShell.svelte`

- [ ] **Step 1: Create AdminEpisodeSchedulesPendingShell**

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

- [ ] **Step 2: Verify component**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminEpisodeSchedulesPendingShell.svelte
git commit -m "feat(components): add AdminEpisodeSchedulesPendingShell"
```

---

### Task 16: Update admin/+layout.svelte with Navigation Detection

**Files:**
- Modify: `src/routes/admin/+layout.svelte`

- [ ] **Step 1: Add navigation detection logic**

Add to `<script>` section:

```typescript
import { navigating, page } from '$app/state';
import AdminSeriesPendingShell from '$lib/components/AdminSeriesPendingShell.svelte';
import AdminArtistsPendingShell from '$lib/components/AdminArtistsPendingShell.svelte';
import AdminStudiosPendingShell from '$lib/components/AdminStudiosPendingShell.svelte';
import AdminPlatformsPendingShell from '$lib/components/AdminPlatformsPendingShell.svelte';
import AdminEpisodesPendingShell from '$lib/components/AdminEpisodesPendingShell.svelte';
import AdminSchedulesPendingShell from '$lib/components/AdminSchedulesPendingShell.svelte';
import AdminArtistSocialsPendingShell from '$lib/components/AdminArtistSocialsPendingShell.svelte';
import AdminSeriesArtistsPendingShell from '$lib/components/AdminSeriesArtistsPendingShell.svelte';
import AdminEpisodeSchedulesPendingShell from '$lib/components/AdminEpisodeSchedulesPendingShell.svelte';

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

- [ ] **Step 2: Update template to show shells**

Replace `{@render children()}` with:

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

- [ ] **Step 3: Verify layout**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/+layout.svelte
git commit -m "feat(layout): add pending shell navigation for admin pages"
```

---

## Phase 4: Documentation Updates

### Task 17: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add Navigation UX & Pending Shells section**

Add after "## Styling & Design System" section:

```markdown
## Navigation UX & Pending Shells

### Problem
SvelteKit navigation with `+page.server.ts` waits for `__data.json` before committing the route, causing perceived slowness when navigating between pages.

### Solution: Pending Shells
Display skeleton UI immediately when navigation starts, while SvelteKit continues fetching data in the background.

### Architecture

**Base Shell Components:**
- `PublicBaseShell.svelte` - Base layout for public pages (centered container + title + content slot)
- `AdminBaseShell.svelte` - Base layout for admin pages (header + breadcrumbs + table skeleton)

**Page-Specific Shells:**
Each page extends base shell with composition:

```svelte
<!-- CalendarPendingShell.svelte -->
<PublicBaseShell title="ตารางฉาย" subtitle="ดูตารางฉายซีรีส์ GL">
  <div slot="content">
    <!-- Calendar-specific skeleton -->
  </div>
</PublicBaseShell>
```

### Navigation Detection

Use `$derived` with `$app/state` to detect pending navigation:

```typescript
// (app)/+layout.svelte
const pendingShell = $derived(() => {
  const to = navigating.to?.url.pathname;
  const from = page.url.pathname;
  
  if (!to || to === from) return null;
  
  if (to.startsWith('/calendar') && !from.startsWith('/calendar')) {
    return 'calendar';
  }
  // ... other routes
  
  return null;
})();
```

### Key Principles

1. **SSR-safe**: Shells never render server-side (`navigating` is undefined during SSR)
2. **Precise activation**: Only show shell when navigating TO a route FROM a different route
3. **No bypass**: SvelteKit navigation continues normally; shells are purely visual
4. **Accessibility**: Use `aria-busy="true"` and `aria-live="polite"`
5. **Thai UI**: All shell text in Thai ("กำลังโหลด...", "กำลังเตรียมข้อมูล...")

### Files

- `src/lib/components/PublicBaseShell.svelte`
- `src/lib/components/AdminBaseShell.svelte`
- `src/lib/components/*PendingShell.svelte` (page-specific shells)
- `src/routes/(app)/+layout.svelte` (public navigation detection)
- `src/routes/admin/+layout.svelte` (admin navigation detection)
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add Navigation UX & Pending Shells section to AGENTS.md"
```

---

### Task 18: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add navigation UX features**

Add to "## ✨ จุดเด่น" section:

```markdown
- **Navigation ทันใจ** — แสดง skeleton UI ทันทีเมื่อกดเมนู ไม่ต้องรอโหลดข้อมูล
- **SEO-friendly** — รองรับ SSR, JSON-LD, canonical URLs, robots meta
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add navigation UX and SEO features to README.md"
```

---

### Task 19: Update ARCHITECTURE.md

**Files:**
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: Add Pending Shells Architecture section**

Add after "## Data Flow" section:

```markdown
## Pending Shells Architecture

### Overview
Pending shells solve the perceived slowness of SvelteKit navigation by displaying skeleton UI immediately when navigation starts, while data fetching continues in the background.

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

### Navigation State Management

**Detection Logic:**
- Import `navigating` and `page` from `$app/state`
- Use `$derived` to compute pending shell type
- Check `navigating.to?.url.pathname` against current `page.url.pathname`
- Only activate when navigating TO a route FROM a different route

**Layout Integration:**
```svelte
<!-- (app)/+layout.svelte -->
{#if pendingShell === 'calendar'}
  <CalendarPendingShell />
{:else if pendingShell === 'profile'}
  <ProfilePendingShell />
{:else}
  {@render children()}
{/if}
```

### SSR Compatibility

Pending shells are client-side only:
- During SSR, `navigating` is `undefined`
- `navigating.to?.url.pathname` evaluates to `undefined`
- Shell never renders server-side
- Direct visits get real SSR content (SEO preserved)

### Accessibility

All shells include:
- `aria-busy="true"` on container
- `aria-live="polite"` for screen readers
- Respects `prefers-reduced-motion` (via global CSS)
```

- [ ] **Step 2: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs: add Pending Shells Architecture section to ARCHITECTURE.md"
```

---

### Task 20: Update CODE_STYLE.md

**Files:**
- Modify: `CODE_STYLE.md`

- [ ] **Step 1: Add Pending Shell Components section**

Add after "## Code Patterns" section:

```markdown
## Pending Shell Components

### Pattern

Pending shells use composition with base shell components:

```svelte
<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="หน้าของฉัน" subtitle="คำอธิบาย">
  <div slot="content">
    <!-- Page-specific skeleton -->
  </div>
</PublicBaseShell>
```

### Naming Convention

- Base shells: `{Scope}BaseShell.svelte` (e.g., `PublicBaseShell.svelte`, `AdminBaseShell.svelte`)
- Page shells: `{PageName}PendingShell.svelte` (e.g., `CalendarPendingShell.svelte`)

### Skeleton Styling

Use project colors with opacity:
- `bg-coral/30` for primary elements
- `bg-lavender/30` for secondary elements
- `bg-mint/30` for tertiary elements
- `glass-card` for containers
- `animate-pulse` for animation

### Navigation Detection

Use `$derived` with `$app/state`:

```typescript
const pendingShell = $derived(() => {
  const to = navigating.to?.url.pathname;
  const from = page.url.pathname;
  
  if (!to || to === from) return null;
  
  // Route-specific logic
  if (to.startsWith('/calendar') && !from.startsWith('/calendar')) {
    return 'calendar';
  }
  
  return null;
})();
```

**Important:**
- Import from `$app/state`, not `$app/stores`
- Use `=== true` for explicit boolean checks
- Only activate when navigating TO a route FROM a different route
```

- [ ] **Step 2: Commit**

```bash
git add CODE_STYLE.md
git commit -m "docs: add Pending Shell Components section to CODE_STYLE.md"
```

---

### Task 21: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Pending Shells section**

Add after "## State & Data Flow" section:

```markdown
## Pending Shells

Pending shells display skeleton UI immediately when navigation starts, solving perceived slowness of SvelteKit navigation.

### Architecture

- **Base shells**: `PublicBaseShell.svelte`, `AdminBaseShell.svelte`
- **Page shells**: Extend base shells with composition
- **Detection**: `$derived` with `$app/state` in layout files

### Key Files

- `src/lib/components/*PendingShell.svelte`
- `src/routes/(app)/+layout.svelte` (public detection)
- `src/routes/admin/+layout.svelte` (admin detection)

### SSR Safety

Shells never render server-side (`navigating` is undefined during SSR), preserving SEO for direct visits.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Pending Shells section to CLAUDE.md"
```

---

## Phase 5: Final Verification

### Task 22: Final Verification and Testing

**Files:**
- All created and modified files

- [ ] **Step 1: Run type checking**

Run: `npm run check`
Expected: 0 errors, 0 warnings

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds without errors

- [ ] **Step 3: Verify all shell components exist**

Run: `ls -1 src/lib/components/*PendingShell.svelte | wc -l`
Expected: 13 (3 public + 9 admin + 1 existing SeriesPendingShell)

- [ ] **Step 4: Verify base shell components exist**

Run: `ls -1 src/lib/components/*BaseShell.svelte | wc -l`
Expected: 2 (PublicBaseShell + AdminBaseShell)

- [ ] **Step 5: Verify navigation detection in layouts**

Run: `grep -l "pendingShell\|pendingAdminShell" src/routes/**/+layout.svelte`
Expected: 2 files (app layout + admin layout)

- [ ] **Step 6: Verify documentation updates**

Run: `grep -l "Pending Shell" AGENTS.md README.md ARCHITECTURE.md CODE_STYLE.md CLAUDE.md`
Expected: 5 files

- [ ] **Step 7: Manual testing (if dev server available)**

Start dev server: `npm run dev`

Test navigation paths:
- Home → /calendar (should show CalendarPendingShell)
- Home → /profile (should show ProfilePendingShell)
- Home → /series (should show SeriesPendingShell)
- /series → /series/123 (should show SeriesDetailPendingShell)
- /admin → /admin/series (should show AdminSeriesPendingShell)
- /admin/series → /admin/artists (should show AdminArtistsPendingShell)

Verify:
- Shells appear immediately on navigation
- No visual flicker or layout shift
- Real content replaces shell when navigation completes
- Direct visits (SSR) show real content, not shells

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete pending shells implementation with documentation"
```

---

## Success Criteria

- [ ] All 14 shell components created and working
- [ ] Navigation detection implemented in both layouts
- [ ] All 5 documentation files updated
- [ ] `npm run check` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] Manual testing confirms smooth UX across all routes
- [ ] SSR works correctly (direct visits get real content)
- [ ] Accessibility requirements met (aria attributes, reduced motion)

---

## Notes

- **No test suite**: Project currently has no test suite, so verification relies on `npm run check`, `npm run build`, and manual testing
- **Existing SeriesPendingShell**: Already implemented in commit `319172f`, no changes needed
- **Thai UI**: All shell text should be in Thai
- **SSR compatibility**: Shells must never render server-side
- **Accessibility**: All shells must include `aria-busy="true"` and `aria-live="polite"`
