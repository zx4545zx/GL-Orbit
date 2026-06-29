# Public Inline Styles Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove source-level inline `style=` attributes from public GL-Orbit pages and shared public-facing components so SEO crawlers see cleaner HTML.

**Architecture:** Replace public inline styles with Tailwind classes where built-in utilities exist and with small named utilities in `src/app.css` where values are custom or repeated. Keep behavior and layout unchanged by moving the same CSS declarations into reusable classes, then map finite dynamic states to class names.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4 via `src/app.css`.

## Global Constraints

- Preserve current visual design and behavior.
- Do not change database, auth, route loading, or SEO endpoint behavior.
- Do not change admin-only inline styles in this pass.
- Keep `src/routes/og-image/+server.ts` SVG string styles out of scope unless an audit targets that SVG endpoint itself.
- Use `<script lang="ts">` and Svelte 5 runes style already present in files.
- Use TypeScript-compatible helper functions for dynamic class maps.
- Verification command for targeted scan: `rg -n 'style=' src/app.html 'src/routes/(app)' src/lib/components`.
- Verification command for project check: `npm run check`.

---

## File Structure

- Modify `src/app.html`: Replace the global SvelteKit wrapper inline style with a class.
- Modify `src/app.css`: Add reusable public CSS utilities for safe-area spacing, content visibility, animation delays, brand colors, and icon sizes.
- Modify `src/routes/(app)/+page.svelte`: Replace home page inline styles with class helpers.
- Modify `src/routes/(app)/artists/[id]/+page.svelte`: Replace dynamic social badge background inline style with class-based social metadata.
- Modify `src/routes/(app)/profile/+page.svelte`: Replace profile animation delay and toggle indicator inline styles.
- Modify `src/routes/(app)/countdown/+page.svelte`: Replace countdown animation delays/durations with utility classes.
- Modify `src/lib/components/ShareButton.svelte`: Replace share brand background and SVG sizing inline styles.
- Modify `src/lib/components/BottomNav.svelte`: Replace bottom safe-area inline padding.
- Modify `src/lib/components/chat/ChatApp.svelte`: Replace chat typing delays and safe-area inline spacing.

---

### Task 1: Add Shared Public Style Utilities

**Files:**
- Modify: `src/app.html`
- Modify: `src/app.css`

**Interfaces:**
- Consumes: Existing app shell and global Tailwind CSS file.
- Produces: Named classes used by later Svelte tasks: `content-visibility-auto`, `mobile-chat-fab`, `safe-area-bottom`, `chat-composer-safe`, `chat-preview-safe-top`, `fill-mode-both`, `stagger-80-*`, `stagger-60-*`, `float-delay-*`, `orbit-delay-*`, `bounce-delay-*`, `pulse-delay-half`, `share-brand-*`, `share-icon-*`, `social-bg-*`, and `library-toggle-indicator`.

- [ ] **Step 1: Replace app shell inline style**

Change `src/app.html` from:

```html
<div style="display: contents">%sveltekit.body%</div>
```

to:

```html
<div class="contents">%sveltekit.body%</div>
```

- [ ] **Step 2: Add global utility classes**

Append this block to `src/app.css` near the existing utility classes, after `.mobile-bottom-safe-space` and before `@supports (container-type: inline-size)`:

```css
.content-visibility-auto {
  content-visibility: auto;
}

.mobile-chat-fab {
  bottom: calc(var(--bottom-nav-reserved-space) + max(1rem, env(safe-area-inset-bottom, 0px)) + 0.75rem);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.chat-composer-safe {
  padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));
}

.chat-preview-safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.fill-mode-both {
  animation-fill-mode: both;
}

.stagger-80-0 { animation-delay: 0ms; }
.stagger-80-1 { animation-delay: 80ms; }
.stagger-80-2 { animation-delay: 160ms; }
.stagger-80-3 { animation-delay: 240ms; }
.stagger-80-4 { animation-delay: 320ms; }
.stagger-80-5 { animation-delay: 400ms; }
.stagger-80-6 { animation-delay: 480ms; }
.stagger-80-7 { animation-delay: 560ms; }
.stagger-80-8 { animation-delay: 640ms; }
.stagger-80-9 { animation-delay: 720ms; }
.stagger-80-10 { animation-delay: 800ms; }
.stagger-80-11 { animation-delay: 880ms; }

.stagger-60-0 { animation-delay: 0ms; }
.stagger-60-1 { animation-delay: 60ms; }
.stagger-60-2 { animation-delay: 120ms; }
.stagger-60-3 { animation-delay: 180ms; }
.stagger-60-4 { animation-delay: 240ms; }
.stagger-60-5 { animation-delay: 300ms; }
.stagger-60-6 { animation-delay: 360ms; }
.stagger-60-7 { animation-delay: 420ms; }
.stagger-60-8 { animation-delay: 480ms; }

.float-delay-neg-1 { animation-delay: -0.5s; }
.float-delay-neg-2 { animation-delay: -1s; }
.float-delay-neg-3 { animation-delay: -1.5s; }
.float-delay-neg-4 { animation-delay: -2s; }
.float-delay-neg-5 { animation-delay: -2.5s; }
.float-delay-neg-6 { animation-delay: -3s; }
.float-delay-neg-7 { animation-delay: -3.5s; }
.float-delay-neg-8 { animation-delay: -4s; }
.float-delay-profile { animation-delay: -1.5s; }
.float-delay-countdown-badge { animation-delay: -2s; }
.float-delay-spin-satellite { animation-delay: -4s; }

.orbit-delay-lavender {
  animation-delay: -6s;
  animation-duration: 14s;
}

.orbit-delay-mint {
  animation-delay: -11s;
  animation-duration: 22s;
}

.bounce-delay-0 { animation-delay: 0ms; }
.bounce-delay-1 { animation-delay: 150ms; }
.bounce-delay-2 { animation-delay: 300ms; }
.pulse-delay-half { animation-delay: 0.5s; }

.share-brand-line { background: #06C755; }
.share-brand-facebook { background: #1877F2; }
.share-icon-line { width: 1.1rem; height: 1.1rem; }
.share-icon-facebook { width: 1.05rem; height: 1.05rem; }
.share-icon-x { width: 0.9rem; height: 0.9rem; }

.social-bg-instagram { background: linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); }
.social-bg-x { background: #000000; }
.social-bg-youtube { background: #FF0000; }
.social-bg-tiktok { background: #010101; }
.social-bg-facebook { background: #1877F2; }
.social-bg-line { background: #06C755; }
.social-bg-default { background: linear-gradient(135deg,#FF6B9D 0%,#C4B5FD 100%); }

.library-toggle-indicator {
  width: calc(50% - 0.25rem);
}
```

- [ ] **Step 3: Run a focused scan for the files changed so far**

Run:

```bash
rg -n 'style=' src/app.html src/app.css
```

Expected output: no matches.

---

### Task 2: Clean Up Home Page Inline Styles

**Files:**
- Modify: `src/routes/(app)/+page.svelte`

**Interfaces:**
- Consumes: `mobile-chat-fab`, `content-visibility-auto`, `fill-mode-both`, `stagger-80-*`, `float-delay-*`, `float-delay-spin-satellite`, and Tailwind `will-change-transform`.
- Produces: Home page with no `style=` attributes.

- [ ] **Step 1: Add helper class maps to the home page script**

Insert this code after the `schedulePalette` constant:

```ts
const stagger80Classes = [
	'stagger-80-0',
	'stagger-80-1',
	'stagger-80-2',
	'stagger-80-3',
	'stagger-80-4',
	'stagger-80-5',
	'stagger-80-6',
	'stagger-80-7',
	'stagger-80-8',
	'stagger-80-9',
	'stagger-80-10',
	'stagger-80-11'
] as const;

const floatDelayClasses = [
	'',
	'float-delay-neg-1',
	'float-delay-neg-2',
	'float-delay-neg-3',
	'float-delay-neg-4',
	'float-delay-neg-5',
	'float-delay-neg-6',
	'float-delay-neg-7',
	'float-delay-neg-8'
] as const;

function stagger80Class(index: number): string {
	return stagger80Classes[Math.min(index, stagger80Classes.length - 1)];
}

function floatDelayClass(index: number): string {
	return floatDelayClasses[Math.min(index, floatDelayClasses.length - 1)];
}
```

- [ ] **Step 2: Replace the mobile chat FAB inline bottom style**

Change the chat link class to include `mobile-chat-fab` and remove the `style=` attribute:

```svelte
class="fixed right-4 z-40 mobile-chat-fab flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-plum to-coral text-white shadow-2xl shadow-coral/30 ring-1 ring-white/70 transition active:scale-95 md:hidden"
```

- [ ] **Step 3: Replace static `will-change` inline styles**

For each home hero glow/orbit element with `style="will-change: transform"`, remove the style attribute and add Tailwind class `will-change-transform` to the existing class list.

Example replacement:

```svelte
<div class="absolute -top-10 -left-10 w-72 h-72 sm:w-96 sm:h-96 bg-coral/20 rounded-full blur-[40px] sm:blur-[80px] animate-float pointer-events-none will-change-transform"></div>
```

- [ ] **Step 4: Replace dynamic 80ms stagger inline styles**

For countdown cards and upcoming schedule links, replace:

```svelte
class="group block animate-slide-up"
style="animation-delay: {i * 80}ms; animation-fill-mode: both;"
```

with:

```svelte
class="group block animate-slide-up fill-mode-both {stagger80Class(i)}"
```

For schedule links, preserve the existing base classes and append `fill-mode-both {stagger80Class(i)}`:

```svelte
class="relative flex items-center gap-4 sm:gap-5 group animate-slide-up fill-mode-both {stagger80Class(i)}"
```

- [ ] **Step 5: Replace content visibility inline styles**

Replace section declarations that currently use `style="content-visibility: auto"` with the `content-visibility-auto` class.

Example:

```svelte
<section class="relative py-12 sm:py-20 -mx-4 px-4 content-visibility-auto">
```

- [ ] **Step 6: Replace spin satellite and rocket badge delays**

Replace:

```svelte
<div class="absolute -inset-2.5 animate-[spin_12s_linear_infinite]" style="animation-delay:-4s;">
```

with:

```svelte
<div class="absolute -inset-2.5 animate-[spin_12s_linear_infinite] float-delay-spin-satellite">
```

Replace the rocket badge wrapper style:

```svelte
class="absolute top-2.5 right-2.5 z-10 animate-float {floatDelayClass(i)}"
```

- [ ] **Step 7: Run focused home scan**

Run:

```bash
rg -n 'style=' 'src/routes/(app)/+page.svelte'
```

Expected output: no matches.

---

### Task 3: Clean Up Public Route Pages

**Files:**
- Modify: `src/routes/(app)/artists/[id]/+page.svelte`
- Modify: `src/routes/(app)/profile/+page.svelte`
- Modify: `src/routes/(app)/countdown/+page.svelte`

**Interfaces:**
- Consumes: social background classes, profile toggle classes, countdown delay classes, and stagger classes from `src/app.css`.
- Produces: Public route pages with no `style=` attributes.

- [ ] **Step 1: Convert artist social metadata from background values to classes**

In `src/routes/(app)/artists/[id]/+page.svelte`, change the `SocialMeta` type from:

```ts
type SocialMeta = {
	label: string;
	bg: string;
	stroke: boolean;
	icon: string;
};
```

to:

```ts
type SocialMeta = {
	label: string;
	bgClass: string;
	stroke: boolean;
	icon: string;
};
```

Then update every `socialMeta()` return to use `bgClass`:

```ts
if (p.includes('instagram')) return { label: 'Instagram', bgClass: 'social-bg-instagram', stroke: false, icon: IG };
if (p.includes('twitter') || p === 'x') return { label: 'X (Twitter)', bgClass: 'social-bg-x', stroke: false, icon: X };
if (p.includes('youtube') || p.includes('yt')) return { label: 'YouTube', bgClass: 'social-bg-youtube', stroke: false, icon: YT };
if (p.includes('tiktok')) return { label: 'TikTok', bgClass: 'social-bg-tiktok', stroke: false, icon: TT };
if (p.includes('facebook') || p.includes('fb')) return { label: 'Facebook', bgClass: 'social-bg-facebook', stroke: false, icon: FB };
if (p.includes('line')) return { label: 'LINE', bgClass: 'social-bg-line', stroke: false, icon: LINE };
return { label: platform, bgClass: 'social-bg-default', stroke: true, icon: GLOBE };
```

Replace the social badge span with:

```svelte
<span
	class="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105 {meta.bgClass}"
>
```

- [ ] **Step 2: Clean up profile animation and toggle indicator**

In `src/routes/(app)/profile/+page.svelte`, replace:

```svelte
<div class="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-mint/20 blur-2xl animate-float" style="animation-delay: -1.5s"></div>
```

with:

```svelte
<div class="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-mint/20 blur-2xl animate-float float-delay-profile"></div>
```

Replace the library toggle indicator with:

```svelte
<div
	class="absolute top-1 bottom-1 left-1 rounded-lg transition-all duration-300 ease-out library-toggle-indicator {libraryView === 'favorite' ? 'bg-coral/15 shadow-sm translate-x-0' : 'bg-mint/20 shadow-sm translate-x-full'}"
></div>
```

- [ ] **Step 3: Add countdown page helper class map**

In `src/routes/(app)/countdown/+page.svelte`, insert this helper after `const countdownItems = ...`:

```ts
const stagger60Classes = [
	'stagger-60-0',
	'stagger-60-1',
	'stagger-60-2',
	'stagger-60-3',
	'stagger-60-4',
	'stagger-60-5',
	'stagger-60-6',
	'stagger-60-7',
	'stagger-60-8'
] as const;

function stagger60Class(index: number): string {
	return stagger60Classes[Math.min(index, stagger60Classes.length - 1)];
}
```

- [ ] **Step 4: Replace countdown page inline animation styles**

Replace orbit particles with:

```svelte
<div class="absolute w-2 h-2 bg-lavender rounded-full animate-orbit opacity-50 orbit-delay-lavender"></div>
<div class="absolute w-1.5 h-1.5 bg-mint rounded-full animate-orbit opacity-60 orbit-delay-mint"></div>
```

Replace countdown card links with:

```svelte
class="group block animate-slide-up fill-mode-both {stagger60Class(i)}"
```

Replace badge wrapper with:

```svelte
<div class="absolute top-3.5 right-3.5 z-10 animate-float float-delay-countdown-badge">
```

Replace the second colon span with:

```svelte
<span aria-hidden="true" class="pt-2 sm:pt-2.5 text-2xl sm:text-3xl font-bold text-coral/60 animate-pulse pulse-delay-half">:</span>
```

- [ ] **Step 5: Run focused public route scan**

Run:

```bash
rg -n 'style=' 'src/routes/(app)/artists/[id]/+page.svelte' 'src/routes/(app)/profile/+page.svelte' 'src/routes/(app)/countdown/+page.svelte'
```

Expected output: no matches.

---

### Task 4: Clean Up Shared Public Components

**Files:**
- Modify: `src/lib/components/ShareButton.svelte`
- Modify: `src/lib/components/BottomNav.svelte`
- Modify: `src/lib/components/chat/ChatApp.svelte`

**Interfaces:**
- Consumes: brand, icon size, safe-area, and animation delay utility classes from `src/app.css`.
- Produces: Shared public components with no `style=` attributes.

- [ ] **Step 1: Replace share button brand and icon inline styles**

In `src/lib/components/ShareButton.svelte`, replace LINE icon wrapper and SVG with:

```svelte
<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center share-brand-line">
	<svg class="text-white share-icon-line" fill="currentColor" viewBox="0 0 24 24"><path d={LINE_PATH} /></svg>
</span>
```

Replace Facebook wrapper and SVG with:

```svelte
<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center share-brand-facebook">
	<svg class="text-white share-icon-facebook" fill="currentColor" viewBox="0 0 24 24"><path d={FB_PATH} /></svg>
</span>
```

Replace X SVG with:

```svelte
<svg class="text-white share-icon-x" fill="currentColor" viewBox="0 0 24 24"><path d={X_PATH} /></svg>
```

- [ ] **Step 2: Replace bottom nav safe-area inline style**

In `src/lib/components/BottomNav.svelte`, replace:

```svelte
<div
	class="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(196,181,253,0.3)] overflow-hidden border-t border-lavender/15"
	style="padding-bottom: env(safe-area-inset-bottom, 0px);"
>
```

with:

```svelte
<div class="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(196,181,253,0.3)] overflow-hidden border-t border-lavender/15 safe-area-bottom">
```

- [ ] **Step 3: Replace chat loading dot inline delays**

In `src/lib/components/chat/ChatApp.svelte`, replace the three loading dots with:

```svelte
<span class="h-2 w-2 animate-bounce rounded-full bg-coral bounce-delay-0"></span>
<span class="h-2 w-2 animate-bounce rounded-full bg-coral bounce-delay-1"></span>
<span class="h-2 w-2 animate-bounce rounded-full bg-coral bounce-delay-2"></span>
```

- [ ] **Step 4: Replace chat safe-area inline styles**

Replace chat footer with:

```svelte
<footer class="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pt-2 sm:px-4 chat-composer-safe">
```

Replace mobile preview wrapper with:

```svelte
<div class="fixed inset-0 z-50 flex flex-col lg:hidden chat-preview-safe-top">
```

- [ ] **Step 5: Run focused component scan**

Run:

```bash
rg -n 'style=' src/lib/components/ShareButton.svelte src/lib/components/BottomNav.svelte src/lib/components/chat/ChatApp.svelte
```

Expected output: no matches.

---

### Task 5: Verify Public Inline Style Cleanup

**Files:**
- Verify only; no planned file edits.

**Interfaces:**
- Consumes: all changes from Tasks 1-4.
- Produces: verification evidence and implementation commit.

- [ ] **Step 1: Run full targeted public inline style scan**

Run:

```bash
rg -n 'style=' src/app.html 'src/routes/(app)' src/lib/components
```

Expected: no matches in this public scope.

- [ ] **Step 2: Confirm out-of-scope inline styles remain only outside public scope**

Run:

```bash
rg -n --glob '!node_modules' --glob '!.svelte-kit' --glob '!dist' --glob '!build' 'style=' src static
```

Expected: any remaining matches are limited to admin-only files or `src/routes/og-image/+server.ts` SVG markup.

- [ ] **Step 3: Run Svelte/TypeScript validation**

Run:

```bash
npm run check
```

Expected: exit status 0. Existing unrelated Svelte warnings may remain.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add src/app.html src/app.css 'src/routes/(app)/+page.svelte' 'src/routes/(app)/artists/[id]/+page.svelte' 'src/routes/(app)/profile/+page.svelte' 'src/routes/(app)/countdown/+page.svelte' src/lib/components/ShareButton.svelte src/lib/components/BottomNav.svelte src/lib/components/chat/ChatApp.svelte
git commit -m "refactor: remove public inline styles"
```

Expected: commit succeeds and includes only the public inline-style cleanup files.

---

## Self-Review

- Spec coverage: The plan removes inline styles from app shell, public routes, and shared public components while leaving admin and OG SVG styles out of scope.
- Placeholder scan: No unresolved implementation placeholders are present.
- Type consistency: Dynamic style values are converted to string class helpers with explicit `string` return types where used in Svelte class attributes.
