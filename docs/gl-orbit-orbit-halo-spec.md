# GL-Orbit — Orbit Halo
## Social Community Implementation Specification for AI Agent

> เป้าหมาย: เพิ่มพื้นที่ Social Community ชื่อ **Orbit Halo** ลงในโปรเจกต์ GL-Orbit  
> แนวคิดหลัก: Orbit Halo เป็นวง community ที่ล้อมรอบจักรวาลข้อมูลของ GL-Orbit ทุกโพสต์เรียกว่า **Moment** และต้องมีลิงก์ต้นทางจากแพลตฟอร์มภายนอก เช่น TikTok, X, YouTube หรือเว็บไซต์อื่น พร้อม preview ที่ปลอดภัย  
> เวอร์ชันแรกยังไม่รองรับการอัปโหลดรูปขึ้น storage ของระบบ แต่อนุญาตให้แนบ URL รูปภายนอกได้

---


## Product Decision Record

```txt
Decision status     Approved
Social product name Orbit Halo
Post name           Moment
Primary route       /[lang]/halo
Layout group        (orbit-halo)
Git branch          feat/orbit-halo
Neon branch         dev/orbit-halo
```

This document supersedes the previous working name “Moment Share”.

---

# 1. Project Context

Repository:

```txt
zx4545zx/GL-Orbit
```

Current stack:

```txt
Framework       SvelteKit 2
UI              Svelte 5 Runes
Language        TypeScript
Styling         Tailwind CSS 4
Database        PostgreSQL 17 on Neon
ORM             Drizzle ORM
Authentication  Custom JWT + sessions table
Deployment      Vercel
Package manager npm
Testing         Vitest
i18n            Paraglide
```

Existing important entities:

```txt
users
series
artists
ships
notifications
push_subscriptions
```

Existing routes use localized structure:

```txt
src/routes/[lang=lang]/(app)/
```

Existing API routes use:

```txt
src/routes/api/
```

Authentication is available from:

```ts
locals.user
locals.session
```

Follow existing repository patterns for:

- Database access through `getDb()`
- Drizzle schema definitions
- API error responses
- Authentication checks
- Localized public routes
- Tailwind design system
- Existing component naming and code style
- Soft delete using `deletedAt` where appropriate

Do not replace the current authentication system.

---

# 2. Product Definition

## 2.1 Orbit Halo Core Concept

A **Moment** is a community post that references content from another platform.

Every Moment must contain:

1. One required external source URL
2. Optional text written by the user
3. Optional external image URLs
4. Optional links to GL-Orbit entities:
   - Series
   - Artists
   - Ships

Example:

```txt
User text:
สายตาซีนนี้คือไม่ไหวแล้ว 😭

Source:
https://www.tiktok.com/@example/video/123456789

Tags:
Series: ใจซ่อนรัก
Artists: Lingling, Orm
Ship: หลิงออม
```

## 2.2 Product Identity and Brand Story

GL-Orbit must not become a generic Facebook/X clone.

The core identity is:

```txt
Share the moment, keep the source.
```

Orbit Halo should act as a community layer over GL-related content from multiple platforms.

---


# 3. Orbit Halo Brand Architecture

## 3.1 Final Naming

Use the following names consistently in code comments, product copy and documentation:

```txt
Main platform       GL-Orbit
Social product      Orbit Halo
Post type           Moment
Main feed           Halo Feed
Create action       Share a Moment
Community members   Members
Primary route       /[lang]/halo
Layout group        (orbit-halo)
```

Do not rename a Moment to `Post`, `Glint`, `Pulse` or `Loop` in user-facing copy.

Internal code may continue using `moment`, `moments` and related table names.

## 3.2 Brand Story

GL-Orbit is the center of the GL universe: series, schedules, artists, ships and reference data.

Orbit Halo is the community layer surrounding that center.

A halo is a ring of light around a celestial body. In this product:

```txt
GL-Orbit core data
        ↓
Series, artists, ships and schedules
        ↓
Orbit Halo
        ↓
Moments, reactions, conversations and community activity
```

Every shared Moment adds another point of light to the Halo.

Official story:

> **Orbit Halo is the community surrounding the GL-Orbit universe — a place where moments from TikTok, X, YouTube and other platforms are gathered, shared and discussed. Every Moment adds to the glow.**

Thai positioning:

> **Orbit Halo คือวงคอมมูนิตี้ที่ล้อมรอบจักรวาล GL-Orbit พื้นที่สำหรับแชร์และพูดคุยทุกโมเมนต์จากโลก GL**

Recommended tagline:

```txt
Every moment adds to the glow.
```

Optional Thai tagline:

```txt
ทุกโมเมนต์เติมแสงให้จักรวาล GL
```

## 3.3 Product Relationship

Orbit Halo is part of the same application and uses the same:

- Users
- Authentication
- Database
- Series data
- Artist data
- Ship data
- Notification infrastructure
- Localization system

However, Orbit Halo must feel like a distinct product area with its own navigation and page shell.

It must not look like a normal content page placed inside the existing GL-Orbit information layout.

---

# 4. Mandatory Layout Separation

## 4.1 Requirement

Orbit Halo must use a separate SvelteKit layout from the main GL-Orbit features.

The main layout is optimized for:

- Series discovery
- Schedules
- Artist profiles
- Ship profiles
- Long-form information
- SEO-oriented public content

The Orbit Halo layout is optimized for:

- Feed browsing
- Moment creation
- Reactions
- Comments
- Notifications
- Saved Moments
- Community profiles
- Mobile social-app usage

Do not place the Halo feed directly under the current main application layout.

## 4.2 Recommended SvelteKit Structure

Use route groups so URLs remain clean while layouts stay isolated:

```txt
src/routes/[lang=lang]/
├── (main)/
│   ├── +layout.server.ts
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── series/
│   ├── artists/
│   ├── ships/
│   ├── calendar/
│   ├── countdown/
│   └── explore/
│
└── (orbit-halo)/
    ├── +layout.server.ts
    ├── +layout.svelte
    └── halo/
        ├── +page.server.ts
        ├── +page.svelte
        ├── explore/
        ├── moments/
        │   └── [id]/
        ├── saved/
        ├── notifications/
        └── u/
            └── [username]/
```

Expected URLs:

```txt
/th/halo
/th/halo/explore
/th/halo/moments/{momentId}
/th/halo/saved
/th/halo/notifications
/th/halo/u/{username}
```

Route groups `(main)` and `(orbit-halo)` must not appear in URLs.

Adapt the exact `(main)` group name to the repository if the existing public layout currently uses `(app)`.

Do not reorganize unrelated routes only for naming consistency.

## 4.3 Shared Root Responsibilities

Authentication, locale detection and global request handling may remain in shared root hooks and layouts.

The Orbit Halo layout may reuse:

- Session data
- Language data
- Global theme tokens
- Toast system
- Dialog primitives
- Avatar components
- Existing buttons and form controls

It should not reuse the main layout's entire navigation shell.

## 4.4 Orbit Halo Navigation

Desktop navigation:

```txt
Halo
Explore
Create Moment
Notifications
Saved
Profile
Back to GL-Orbit
```

Mobile bottom navigation:

```txt
Halo | Explore | Create | Alerts | Profile
```

The create action should be visually prominent.

`Saved` may live inside the profile menu on narrow screens if five navigation slots are already used.

## 4.5 Desktop Layout

Recommended desktop shell:

```txt
┌─────────────────┬──────────────────────────┬──────────────────┐
│ Halo navigation │ Feed / Moment detail     │ Discovery panel  │
│                 │                          │                  │
│ Halo            │ Composer                 │ Airing now       │
│ Explore         │ Moment cards             │ Popular series   │
│ Notifications   │ Comments                 │ Popular ships    │
│ Saved           │                          │ Community tips   │
│ Profile         │                          │                  │
└─────────────────┴──────────────────────────┴──────────────────┘
```

Guidelines:

- Main feed column should remain readable at approximately 680–760px
- Left navigation should stay stable on desktop
- Right discovery panel may disappear on medium screens
- Do not make the feed stretch across the entire viewport

## 4.6 Mobile Layout

Recommended mobile shell:

```txt
Top bar:
Orbit Halo logo | Create / Search

Content:
Feed or Moment detail

Bottom navigation:
Halo | Explore | Create | Alerts | Profile
```

Requirements:

- Account for safe-area insets
- Keep create action reachable by thumb
- Avoid hover-only controls
- Use sheets/dialogs for secondary actions
- Embed previews must fit the screen without horizontal scrolling

## 4.7 Visual Identity

Orbit Halo must remain recognizably part of GL-Orbit while having a distinct social identity.

Reuse:

- Existing typography
- Existing base colors
- Existing rounded-card language
- Existing avatar style
- Existing spacing scale

Differentiate with:

- A dedicated Halo mark or ring motif
- A brighter accent treatment for active navigation and create actions
- More compact feed-oriented spacing
- Stronger card separation
- Prominent avatars and interaction controls
- Ring/glow decoration used sparingly

Avoid turning the product into an unrelated dark sci-fi application unless the existing design system already supports that direction.

Recommended wordmark:

```txt
ORBIT HALO
by GL-Orbit
```

## 4.8 Cross-Product Navigation

The main GL-Orbit navigation must include an entry for Orbit Halo.

Example:

```txt
Home
Series
Calendar
Artists
Ships
Explore
Orbit Halo
```

Orbit Halo must include a clear way back to the main GL-Orbit experience.

Example:

```txt
Back to GL-Orbit
```

Do not force users to use browser back navigation to switch products.

## 4.9 Data Connections Between Products

Although layouts are separate, the products must remain deeply connected.

Main GL-Orbit entity pages should display a small Moment section:

```txt
Latest Moments
View all on Orbit Halo →
```

Examples:

```txt
/[lang]/halo?seriesId={id}
/[lang]/halo?artistId={id}
/[lang]/halo?shipId={id}
```

If canonical entity landing pages are introduced later, they may use:

```txt
/[lang]/halo/series/{slug}
/[lang]/halo/artists/{slug}
/[lang]/halo/ships/{slug}
```

Orbit Halo entity chips must link back to the main GL-Orbit entity detail pages.

The separation is visual and navigational, not a data silo.

---

# 5. MVP Scope


## 5.1 Required Features

Implement:

- Create Moment
- Edit own Moment
- Delete own Moment
- Moment feed
- Moment detail page
- External embed preview
- External image URL attachments
- Tag Series
- Tag Artists
- Tag Ships
- Like / Unlike
- Bookmark / Unbookmark
- Comment
- One-level comment reply
- Report Moment
- Admin moderation
- Community notifications
- Cursor pagination
- Responsive mobile-first UI
- Basic abuse protection
- Unit and integration tests for critical server logic

## 5.2 Supported Source Providers

Initial provider support:

```txt
YOUTUBE
TIKTOK
X
OTHER
```

Fallback behavior must exist for every provider.

## 5.3 Non-Goals

Do not implement in this version:

- Image upload
- Video upload
- Direct message
- Repost
- Quote post
- Algorithmic recommendation feed
- Trending algorithm
- Real-time WebSocket comments
- Infinite nested comments
- Redis
- Microservices
- Separate media service
- Full-text search
- Hashtag system
- User follow system

Design the schema so these may be added later without major rework.

---

# 6. Safety Rules

## 6.1 Never Accept User-Supplied HTML

The client must never be allowed to submit:

```html
<iframe>
<script>
<blockquote>
```

Do not render arbitrary HTML with Svelte `{@html}`.

The user submits only a URL.

The server determines the provider and produces normalized metadata.

## 6.2 URL Validation

All submitted URLs must:

- Use HTTPS
- Have a valid hostname
- Not target localhost
- Not target loopback addresses
- Not target private network ranges
- Not target link-local ranges
- Not use raw IP hosts
- Not use `.local`
- Stay within configured URL length limits

Reject examples:

```txt
http://localhost:3000
https://127.0.0.1
https://192.168.1.10
https://10.0.0.4
https://169.254.169.254
https://internal.local
```

## 6.3 SSRF Protection

Do not server-fetch arbitrary URLs during MVP.

Allowed server-side metadata requests:

- TikTok official oEmbed endpoint
- X official supported embed endpoint if configured
- YouTube metadata through deterministic URL parsing or official endpoint
- Provider endpoints explicitly listed in an allowlist

For unknown domains, create a fallback link card using only normalized URL data.

Do not scrape arbitrary external websites.

## 6.4 Embed Rendering

Embed rendering must be provider-specific.

```txt
YouTube → controlled iframe built from video ID
TikTok → official embed widget / controlled integration
X       → official widget or fallback link card
Other   → fallback link card
```

Do not store provider HTML in the database.

## 6.5 External Images

External images must:

- Use HTTPS
- Be limited to 4 per Moment
- Use lazy loading
- Use async decoding
- Use a broken-image fallback
- Use safe referrer policy
- Never be fetched through the server during MVP

Recommended markup:

```html
<img
  src={imageUrl}
  alt={altText}
  loading="lazy"
  decoding="async"
  referrerpolicy="no-referrer"
/>
```

---

# 7. Database Design

Add the following enums.

```ts
export const momentSourceProviderEnum = pgEnum('moment_source_provider', [
  'YOUTUBE',
  'TIKTOK',
  'X',
  'OTHER'
]);

export const momentEmbedStatusEnum = pgEnum('moment_embed_status', [
  'READY',
  'FALLBACK',
  'FAILED'
]);

export const momentStatusEnum = pgEnum('moment_status', [
  'PUBLISHED',
  'HIDDEN',
  'DELETED'
]);

export const momentMediaTypeEnum = pgEnum('moment_media_type', [
  'IMAGE'
]);

export const momentMediaSourceEnum = pgEnum('moment_media_source', [
  'EXTERNAL',
  'UPLOAD'
]);

export const momentCommentStatusEnum = pgEnum('moment_comment_status', [
  'PUBLISHED',
  'HIDDEN',
  'DELETED'
]);

export const momentReportReasonEnum = pgEnum('moment_report_reason', [
  'SPAM',
  'HARASSMENT',
  'INAPPROPRIATE',
  'COPYRIGHT',
  'MISLEADING',
  'OTHER'
]);

export const momentReportStatusEnum = pgEnum('moment_report_status', [
  'PENDING',
  'REVIEWED',
  'DISMISSED',
  'ACTIONED'
]);
```

---

## 7.1 moments

```ts
export const moments = pgTable(
  'moments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    body: text('body'),

    sourceUrl: text('source_url').notNull(),
    sourceCanonicalUrl: text('source_canonical_url').notNull(),

    sourceProvider: momentSourceProviderEnum('source_provider').notNull(),
    sourceExternalId: varchar('source_external_id', { length: 255 }),

    embedStatus: momentEmbedStatusEnum('embed_status')
      .notNull()
      .default('FALLBACK'),

    embedMetadata: jsonb('embed_metadata')
      .$type<{
        title?: string;
        authorName?: string;
        thumbnailUrl?: string;
        providerName?: string;
      }>()
      .notNull()
      .default({}),

    status: momentStatusEnum('status')
      .notNull()
      .default('PUBLISHED'),

    language: varchar('language', { length: 10 }),

    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    bookmarkCount: integer('bookmark_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    authorSourceUnique: uniqueIndex('moments_author_source_unique')
      .on(table.authorId, table.sourceCanonicalUrl),

    feedIndex: index('moments_feed_idx')
      .on(table.status, table.createdAt, table.id),

    authorIndex: index('moments_author_idx')
      .on(table.authorId, table.createdAt)
  })
);
```

Rules:

- `sourceUrl` is the submitted URL
- `sourceCanonicalUrl` is the normalized version
- `body` may be nullable
- Maximum body length: 2,000 characters
- A Moment must have at least:
  - valid source URL
- Same user cannot create the same canonical URL twice
- Different users may post the same URL

If existing code style avoids counter columns, counters may be computed dynamically. However, for feed performance, denormalized counters are recommended if updated transactionally.

---

## 7.2 moment_media

```ts
export const momentMedia = pgTable(
  'moment_media',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    mediaType: momentMediaTypeEnum('media_type')
      .notNull()
      .default('IMAGE'),

    sourceType: momentMediaSourceEnum('source_type')
      .notNull()
      .default('EXTERNAL'),

    externalUrl: text('external_url'),
    storageKey: text('storage_key'),

    altText: varchar('alt_text', { length: 500 }),

    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    momentIndex: index('moment_media_moment_idx')
      .on(table.momentId, table.sortOrder)
  })
);
```

MVP validation:

```txt
sourceType must be EXTERNAL
externalUrl is required
storageKey must be null
maximum 4 records per Moment
```

---

## 7.3 moment_likes

```ts
export const momentLikes = pgTable(
  'moment_likes',
  {
    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.momentId, table.userId] }),
    userIndex: index('moment_likes_user_idx')
      .on(table.userId, table.createdAt)
  })
);
```

---

## 7.4 moment_bookmarks

```ts
export const momentBookmarks = pgTable(
  'moment_bookmarks',
  {
    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.momentId, table.userId] }),
    userIndex: index('moment_bookmarks_user_idx')
      .on(table.userId, table.createdAt)
  })
);
```

---

## 7.5 moment_comments

```ts
export const momentComments = pgTable(
  'moment_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    parentId: uuid('parent_id'),

    body: text('body').notNull(),

    status: momentCommentStatusEnum('status')
      .notNull()
      .default('PUBLISHED'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    momentIndex: index('moment_comments_moment_idx')
      .on(table.momentId, table.createdAt),

    parentIndex: index('moment_comments_parent_idx')
      .on(table.parentId, table.createdAt),

    authorIndex: index('moment_comments_author_idx')
      .on(table.authorId, table.createdAt)
  })
);
```

Add a self-reference for `parentId` if supported cleanly by the current Drizzle version.

Rules:

- Maximum comment length: 1,000 characters
- Only one reply level is allowed
- A reply cannot have another reply as parent
- Deleted comments should remain as tombstones if they have replies

---

## 7.6 Moment Entity Links

### moment_series

```ts
export const momentSeries = pgTable(
  'moment_series',
  {
    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.momentId, table.seriesId] }),
    seriesIndex: index('moment_series_series_idx')
      .on(table.seriesId, table.momentId)
  })
);
```

### moment_artists

```ts
export const momentArtists = pgTable(
  'moment_artists',
  {
    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    artistId: uuid('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.momentId, table.artistId] }),
    artistIndex: index('moment_artists_artist_idx')
      .on(table.artistId, table.momentId)
  })
);
```

### moment_ships

```ts
export const momentShips = pgTable(
  'moment_ships',
  {
    momentId: uuid('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),

    shipId: uuid('ship_id')
      .notNull()
      .references(() => ships.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.momentId, table.shipId] }),
    shipIndex: index('moment_ships_ship_idx')
      .on(table.shipId, table.momentId)
  })
);
```

Limits per Moment:

```txt
Series  maximum 3
Artists maximum 6
Ships   maximum 3
```

---

## 7.7 moment_reports

```ts
export const momentReports = pgTable(
  'moment_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    momentId: uuid('moment_id')
      .references(() => moments.id, { onDelete: 'cascade' }),

    commentId: uuid('comment_id')
      .references(() => momentComments.id, { onDelete: 'cascade' }),

    reason: momentReportReasonEnum('reason').notNull(),
    details: text('details'),

    status: momentReportStatusEnum('status')
      .notNull()
      .default('PENDING'),

    reviewedBy: uuid('reviewed_by')
      .references(() => users.id, { onDelete: 'set null' }),

    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    reporterMomentUnique: uniqueIndex('moment_reports_reporter_moment_unique')
      .on(table.reporterId, table.momentId),

    pendingIndex: index('moment_reports_pending_idx')
      .on(table.status, table.createdAt)
  })
);
```

Database or application validation must enforce:

```txt
Exactly one of momentId or commentId must be present.
```

---

# 8. Notification Changes

Current notifications are series-specific.

Extend the existing notifications table without creating a second notification system.

Recommended changes:

```ts
seriesId: uuid('series_id')
  .references(() => series.id, { onDelete: 'cascade' }),

actorUserId: uuid('actor_user_id')
  .references(() => users.id, { onDelete: 'set null' }),

momentId: uuid('moment_id')
  .references(() => moments.id, { onDelete: 'cascade' }),

commentId: uuid('comment_id')
  .references(() => momentComments.id, { onDelete: 'cascade' }),

metadata: jsonb('metadata').$type<Record<string, unknown>>()
```

Change `seriesId` from required to nullable.

Notification types:

```txt
MOMENT_LIKED
MOMENT_COMMENTED
COMMENT_REPLIED
MOMENT_MODERATED
```

Rules:

- Do not notify users about their own actions
- Like notification may be deduplicated
- Comment notification goes to Moment author
- Reply notification goes to parent comment author
- Existing series notifications must continue working

---

# 9. Embed Architecture

Create:

```txt
src/lib/server/embeds/
├── types.ts
├── resolver.ts
├── normalize-url.ts
├── url-security.ts
├── youtube.ts
├── tiktok.ts
├── x.ts
└── other.ts
```

## 9.1 Shared Types

```ts
export type EmbedProvider =
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'X'
  | 'OTHER';

export type ResolvedEmbed = {
  provider: EmbedProvider;
  canonicalUrl: string;
  externalId?: string;
  status: 'READY' | 'FALLBACK' | 'FAILED';
  metadata: {
    title?: string;
    authorName?: string;
    thumbnailUrl?: string;
    providerName?: string;
  };
};
```

## 9.2 Resolver Contract

```ts
export interface EmbedProviderResolver {
  supports(url: URL): boolean;
  resolve(url: URL): Promise<ResolvedEmbed>;
}
```

Top-level function:

```ts
export async function resolveEmbed(
  rawUrl: string
): Promise<ResolvedEmbed>
```

Responsibilities:

1. Validate URL
2. Normalize hostname
3. Remove tracking parameters
4. Detect provider
5. Parse external ID
6. Resolve provider metadata
7. Return fallback result if metadata lookup fails

Publishing must never depend on metadata success.

A valid source URL may still create a Moment with:

```txt
embedStatus = FALLBACK
```

---

# 10. URL Normalization

Remove common tracking parameters:

```txt
utm_source
utm_medium
utm_campaign
utm_term
utm_content
fbclid
gclid
si
feature
```

Normalize:

- Hostname to lowercase
- Remove trailing slash when safe
- Convert mobile aliases when appropriate
- Convert YouTube short links to canonical watch URL
- Convert X aliases such as twitter.com to x.com canonical form
- Preserve provider content ID

Examples:

```txt
https://youtu.be/abc123?si=tracking
→ https://www.youtube.com/watch?v=abc123

https://twitter.com/user/status/123
→ https://x.com/user/status/123
```

Do not over-normalize URLs in ways that change the referenced content.

---

# 11. Provider Rules

## 11.1 YouTube

Support:

```txt
youtube.com/watch?v=
youtu.be/
youtube.com/shorts/
youtube.com/embed/
```

Store:

```txt
sourceProvider = YOUTUBE
sourceExternalId = video ID
```

Render with a controlled iframe:

```txt
https://www.youtube-nocookie.com/embed/{videoId}
```

Use iframe attributes:

```html
loading="lazy"
allowfullscreen
referrerpolicy="strict-origin-when-cross-origin"
```

Do not accept arbitrary embed URLs from the client.

## 11.2 TikTok

Support TikTok video URLs.

Resolve metadata using official TikTok oEmbed where possible.

Do not persist returned HTML.

Persist only safe metadata:

```txt
title
authorName
thumbnailUrl
externalId
canonicalUrl
```

The client component may initialize the official TikTok widget using the canonical URL.

If the widget fails, show a fallback card.

## 11.3 X

Support:

```txt
x.com/{user}/status/{id}
twitter.com/{user}/status/{id}
```

Normalize to `x.com`.

Use official widget integration when available.

If unavailable or blocked, show a fallback card.

## 11.4 Other

For unknown valid HTTPS URLs:

```txt
sourceProvider = OTHER
embedStatus = FALLBACK
```

Display:

- Hostname
- Canonical URL
- Open original button

Do not fetch Open Graph metadata from arbitrary websites in MVP.

---

# 12. API Design

Use SvelteKit `+server.ts`.

## 12.1 Preview

```txt
POST /api/moments/preview
```

Authentication:

```txt
Required
```

Request:

```json
{
  "url": "https://..."
}
```

Response:

```json
{
  "provider": "YOUTUBE",
  "canonicalUrl": "https://...",
  "externalId": "abc123",
  "status": "READY",
  "metadata": {
    "title": "...",
    "authorName": "...",
    "thumbnailUrl": "..."
  }
}
```

Validation:

- URL required
- HTTPS only
- Rate limited
- Maximum URL length

---

## 12.2 Create Moment

```txt
POST /api/moments
```

Authentication:

```txt
Required
```

Request:

```json
{
  "body": "ข้อความของผู้ใช้",
  "sourceUrl": "https://...",
  "imageUrls": [
    "https://..."
  ],
  "seriesIds": [],
  "artistIds": [],
  "shipIds": [],
  "language": "th"
}
```

Server behavior:

1. Validate authentication
2. Validate payload
3. Resolve URL on server again
4. Validate linked entities exist
5. Insert Moment
6. Insert external media
7. Insert entity relationships
8. Commit in one transaction
9. Return hydrated Moment

Response status:

```txt
201 Created
```

Possible errors:

```txt
400 invalid payload
401 unauthenticated
409 duplicate source by same author
422 unsupported or unsafe URL
429 rate limited
```

---

## 12.3 Feed

```txt
GET /api/moments
```

Query parameters:

```txt
cursor
limit
seriesId
artistId
shipId
authorId
bookmarked
```

Default:

```txt
limit = 20
maximum limit = 50
```

Ordering:

```sql
ORDER BY created_at DESC, id DESC
```

Cursor:

```ts
type MomentCursor = {
  createdAt: string;
  id: string;
};
```

Encode cursor as URL-safe base64 JSON.

Query pattern:

```sql
WHERE (created_at, id) < ($createdAt, $id)
ORDER BY created_at DESC, id DESC
LIMIT 21
```

Fetch `limit + 1` to determine `nextCursor`.

Only return:

```txt
status = PUBLISHED
deleted_at IS NULL
```

Feed response:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

Each item should include:

- Moment fields
- Author public profile
- Safe embed metadata
- Media
- Series tags
- Artist tags
- Ship tags
- Counts
- Current user interaction state:
  - liked
  - bookmarked

Avoid N+1 queries.

---

## 12.4 Moment Detail

```txt
GET /api/moments/[id]
```

Returns:

- Full Moment
- Author
- Entity links
- Media
- Counts
- Current user state
- Initial comments page

Hidden or deleted Moments:

- Author may see their own hidden content if needed
- Admin may see for moderation
- Other users receive 404

---

## 12.5 Update Moment

```txt
PATCH /api/moments/[id]
```

Only author may edit.

Editable fields:

- body
- imageUrls
- seriesIds
- artistIds
- shipIds

Do not allow source URL replacement in MVP.

Reason:

Changing source URL changes the identity of the Moment.

---

## 12.6 Delete Moment

```txt
DELETE /api/moments/[id]
```

Only author or admin.

Prefer soft delete:

```txt
status = DELETED
deletedAt = now()
```

---

## 12.7 Like

```txt
POST /api/moments/[id]/like
```

Toggle behavior is acceptable if consistent with existing favorite API.

Response:

```json
{
  "liked": true,
  "likeCount": 12
}
```

Must be transactional when updating counters.

---

## 12.8 Bookmark

```txt
POST /api/moments/[id]/bookmark
```

Response:

```json
{
  "bookmarked": true
}
```

Bookmark is private.

---

## 12.9 Comments

```txt
GET  /api/moments/[id]/comments
POST /api/moments/[id]/comments
```

POST request:

```json
{
  "body": "comment",
  "parentId": null
}
```

Rules:

- Parent must belong to the same Moment
- Parent cannot itself be a reply
- User cannot comment on hidden/deleted Moment
- Update `commentCount` transactionally

Delete:

```txt
DELETE /api/comments/[id]
```

If comment has replies, replace body with tombstone text.

---

## 12.10 Report

```txt
POST /api/moments/[id]/report
```

Request:

```json
{
  "reason": "SPAM",
  "details": "..."
}
```

User cannot submit duplicate report for the same Moment.

---

## 12.11 Admin Moderation

```txt
GET   /api/admin/moments/reports
PATCH /api/admin/moments/[id]/moderate
```

Admin actions:

```txt
HIDE
RESTORE
DELETE
DISMISS_REPORT
```

Request:

```json
{
  "action": "HIDE",
  "reason": "..."
}
```

All admin endpoints require:

```txt
locals.user.role === 'ADMIN'
```

---

# 13. UI Routes

Create localized routes:

```txt
/[lang]/halo
/[lang]/halo/moments/[id]
/[lang]/halo/profile/moments
/[lang]/halo/saved
```

Integrate Moments into existing entity pages:

```txt
/[lang]/series/[id]
/[lang]/artists/[id]
/[lang]/ships/[slug]
```

Each entity detail page should have a Moments section or tab.

Suggested tabs:

```txt
Overview | Episodes | Moments
```

Use existing route conventions if the current URLs differ.

---

# 14. UI Components

Create reusable components:

```txt
src/lib/components/moments/
├── MomentComposer.svelte
├── MomentCard.svelte
├── MomentFeed.svelte
├── MomentActions.svelte
├── MomentEntityTags.svelte
├── MomentMediaGallery.svelte
├── MomentComments.svelte
├── MomentCommentItem.svelte
├── MomentReportDialog.svelte
├── MomentSkeleton.svelte
└── embeds/
    ├── EmbedPreview.svelte
    ├── YouTubeEmbed.svelte
    ├── TikTokEmbed.svelte
    ├── XEmbed.svelte
    └── LinkFallbackCard.svelte
```

## 14.1 Composer

Flow:

```txt
1. User pastes URL
2. Client calls preview endpoint
3. Preview appears
4. User adds text
5. User optionally adds image URLs
6. User selects Series / Artists / Ships
7. User publishes
```

Composer states:

```txt
IDLE
RESOLVING
READY
PUBLISHING
ERROR
```

Validation must be shown before submit.

## 14.2 Feed

Initial feed:

```txt
Halo Feed — latest chronological Moments
```

Do not implement ranking.

Use IntersectionObserver for:

- Infinite scrolling
- Lazy embed initialization

Do not load every external provider script immediately.

## 14.3 Moment Card

Display:

- User avatar
- Display name
- Username
- Relative time
- Body
- Embed preview
- External image gallery
- Entity chips
- Like count
- Comment count
- Bookmark button
- More menu
- Open original source link

## 14.4 Mobile Design

Optimize for mobile first.

Recommended feed width:

```txt
max-width around 680–760px
```

Keep composer and cards readable on small screens.

Avoid desktop-only interaction patterns.

---

# 15. Embed Performance

External embeds may be heavy.

Requirements:

- Render lightweight placeholder first
- Initialize provider content only near viewport
- Load each provider script once
- Show fallback if script fails
- Avoid layout shift with fixed aspect ratio
- Respect reduced-motion preferences

For YouTube:

```txt
Use 16:9 aspect ratio
```

For TikTok/X:

```txt
Use a reasonable minimum height placeholder
```

---

# 16. Content Security Policy

Add or update security headers carefully.

Minimum provider requirements may include:

```txt
frame-src
  'self'
  https://www.youtube.com
  https://www.youtube-nocookie.com

script-src
  'self'
  https://www.tiktok.com
  https://platform.twitter.com

img-src
  'self'
  data:
  https:

connect-src
  'self'
  https://www.tiktok.com
```

Do not weaken CSP with broad unsafe rules unless required.

Avoid:

```txt
script-src *
frame-src *
```

Test existing app behavior after CSP changes.

---

# 17. Rate Limiting

Implement a simple Postgres-backed rate limiter or reuse an existing app mechanism.

Suggested initial limits:

```txt
Preview URL
20 requests / 10 minutes / user

Create Moment
10 requests / 10 minutes / user

Create Comment
30 requests / 10 minutes / user

Like
100 requests / 10 minutes / user

Report
10 requests / day / user
```

The implementation should use a reusable helper.

Suggested files:

```txt
src/lib/server/rate-limit/
├── index.ts
└── keys.ts
```

Do not add Redis in MVP.

---

# 18. Validation

Create reusable schemas with Zod only if Zod already exists in this project.

If Zod is not currently installed, either:

1. Add Zod and use it consistently for the new feature, or
2. Follow the current repository validation style

Do not introduce multiple validation libraries.

Validation limits:

```txt
Moment body           0–2000 chars
Comment body          1–1000 chars
Source URL            maximum 2048 chars
External image URLs   maximum 4
Alt text              maximum 500 chars
Series tags           maximum 3
Artist tags           maximum 6
Ship tags             maximum 3
Report details        maximum 1000 chars
```

Trim strings before validation.

Reject empty strings where null is more appropriate.

---

# 19. Transactions and Consistency

Use database transactions for:

- Create Moment + media + entity links
- Update Moment relationships
- Like toggle + count update
- Comment create + count update
- Comment delete + count update
- Moderation actions where reports are updated

Never allow negative counters.

Use unique constraints as final protection against race conditions.

---

# 20. Authorization Matrix

| Action | Guest | User | Author | Admin |
|---|---:|---:|---:|---:|
| View public Moment | Yes | Yes | Yes | Yes |
| Create Moment | No | Yes | Yes | Yes |
| Edit Moment | No | No | Yes | Yes |
| Delete Moment | No | No | Yes | Yes |
| Like | No | Yes | Yes | Yes |
| Bookmark | No | Yes | Yes | Yes |
| Comment | No | Yes | Yes | Yes |
| Report | No | Yes | Yes | Yes |
| Hide Moment | No | No | No | Yes |
| Restore Moment | No | No | No | Yes |
| Review reports | No | No | No | Yes |

Do not rely on client-side authorization.

Every protected action must be checked server-side.

---

# 21. Privacy

For MVP:

- All Moments are public
- Bookmarks are private
- Reports are private
- Email addresses must never be exposed
- Session data must never be included in API responses
- Only public profile fields may appear:
  - id
  - username
  - displayName
  - avatarUrl

Do not expose password hashes, session hashes, roles unless required by admin UI.

---

# 22. Migration Workflow

Do not modify production directly.

Create:

```txt
Git branch:
feat/orbit-halo

Neon branch:
dev/orbit-halo
```

Recommended workflow:

```txt
1. Create Neon branch from production
2. Configure DATABASE_URL for the new branch
3. Add Drizzle schema
4. Generate migration
5. Review generated SQL
6. Apply migration to dev Neon branch
7. Run tests
8. Run npm run check
9. Run npm run build
10. Open draft pull request
```

Do not use `drizzle-kit push` against production.

Migration files must be committed.

---

# 23. File Structure Proposal

```txt
src/
├── lib/
│   ├── components/
│   │   └── halo/
│   │       ├── MomentComposer.svelte
│   │       ├── MomentCard.svelte
│   │       ├── MomentFeed.svelte
│   │       ├── MomentActions.svelte
│   │       ├── MomentComments.svelte
│   │       ├── MomentCommentItem.svelte
│   │       ├── MomentEntityTags.svelte
│   │       ├── MomentMediaGallery.svelte
│   │       ├── MomentReportDialog.svelte
│   │       ├── MomentSkeleton.svelte
│   │       └── embeds/
│   │           ├── EmbedPreview.svelte
│   │           ├── YouTubeEmbed.svelte
│   │           ├── TikTokEmbed.svelte
│   │           ├── XEmbed.svelte
│   │           └── LinkFallbackCard.svelte
│   ├── server/
│   │   ├── embeds/
│   │   │   ├── types.ts
│   │   │   ├── resolver.ts
│   │   │   ├── normalize-url.ts
│   │   │   ├── url-security.ts
│   │   │   ├── youtube.ts
│   │   │   ├── tiktok.ts
│   │   │   ├── x.ts
│   │   │   └── other.ts
│   │   ├── moments/
│   │   │   ├── queries.ts
│   │   │   ├── mutations.ts
│   │   │   ├── validation.ts
│   │   │   ├── cursor.ts
│   │   │   └── permissions.ts
│   │   └── rate-limit/
│   │       └── index.ts
│   └── types/
│       └── moments.ts
└── routes/
    ├── [lang=lang]/
    │   └── (app)/
    │       └── halo/
    │           ├── +page.server.ts
    │           ├── +page.svelte
    │           └── [id]/
    │               ├── +page.server.ts
    │               └── +page.svelte
    └── api/
        ├── moments/
        │   ├── +server.ts
        │   ├── preview/
        │   │   └── +server.ts
        │   └── [id]/
        │       ├── +server.ts
        │       ├── like/
        │       │   └── +server.ts
        │       ├── bookmark/
        │       │   └── +server.ts
        │       ├── comments/
        │       │   └── +server.ts
        │       └── report/
        │           └── +server.ts
        ├── comments/
        │   └── [id]/
        │       └── +server.ts
        └── admin/
            └── halo/
                ├── reports/
                │   └── +server.ts
                └── [id]/
                    └── moderate/
                        └── +server.ts
```

Adapt paths to the current project structure where necessary.

---

# 24. Query Design

Create a server query layer instead of placing complex queries directly in route files.

Example functions:

```ts
getMomentFeed(input)
getMomentById(input)
getMomentComments(input)
getUserBookmarks(input)
createMoment(input)
updateMoment(input)
deleteMoment(input)
toggleMomentLike(input)
toggleMomentBookmark(input)
createMomentComment(input)
deleteMomentComment(input)
createMomentReport(input)
moderateMoment(input)
```

API route files should remain thin.

Avoid N+1 queries.

Use batch queries or aggregation where practical.

---

# 25. Testing Requirements

## 25.1 Unit Tests

Test:

- URL validation
- SSRF rejection
- URL normalization
- YouTube ID parsing
- TikTok URL detection
- X URL detection
- Cursor encoding and decoding
- Permission checks
- Validation limits

## 25.2 API Tests

Test:

- Guest cannot create Moment
- User can create valid Moment
- Unsafe URL is rejected
- Duplicate URL by same author returns conflict
- Different user can use same URL
- Author can edit
- Non-author cannot edit
- Like toggle is idempotent
- Bookmark toggle works
- Reply depth is limited to one level
- Report duplicate is blocked
- Admin can hide and restore
- Hidden Moment is unavailable to normal users

## 25.3 Database Tests

Test:

- Cascade deletes
- Unique constraints
- Transaction rollback
- Counter consistency
- Entity relationships
- Report target validation

## 25.4 UI Tests

At minimum verify:

- Composer state transitions
- Preview fallback
- Moment card rendering
- Infinite scroll does not duplicate records
- Broken external image fallback
- Embed lazy loading
- Mobile layout

---

# 26. Acceptance Criteria

The feature is complete when:

## Moment Creation

- Logged-in user can create a Moment with a valid external URL
- Server validates and normalizes the URL
- User can add optional text
- User can add up to 4 external images
- User can tag Series, Artists and Ships
- Invalid or unsafe URLs are rejected
- Metadata failure does not block publishing

## Feed

- Public users can view latest Moments
- Feed uses cursor pagination
- Feed does not duplicate items
- Feed supports Series, Artist, Ship and Author filters
- Current user sees liked/bookmarked state
- No N+1 query issue is introduced

## Embed

- YouTube embeds safely
- TikTok attempts official embed and falls back safely
- X attempts official embed and falls back safely
- Unknown URLs use fallback cards
- Raw external HTML is never rendered
- Embeds are lazy loaded

## Interaction

- User can like and unlike
- User can bookmark and unbookmark
- User can comment
- User can reply one level
- Counts remain consistent

## Moderation

- User can report a Moment
- Duplicate reports are prevented
- Admin can review reports
- Admin can hide, restore or delete Moment
- Hidden content is not visible to normal users

## Notifications

- Moment author receives comment notifications
- Comment author receives reply notifications
- User does not receive notifications for own actions
- Existing series notifications continue working

## Orbit Halo Layout

- Orbit Halo uses its own SvelteKit route-group layout
- The main GL-Orbit navigation shell is not rendered around the Halo feed
- Orbit Halo has its own desktop navigation
- Orbit Halo has mobile bottom navigation
- Users can switch between Orbit Halo and GL-Orbit explicitly
- Series, Artist and Ship pages can surface linked Moments
- Moment entity chips link back to GL-Orbit entity pages
- The separate layout still uses the same authentication and localization systems

## Quality

- `npm run check` passes
- `npm run test` passes
- `npm run build` passes
- Migration is committed
- No direct production schema modification
- No secrets committed
- No arbitrary HTML rendering
- No arbitrary server-side URL fetching

---

# 27. Recommended Implementation Phases

## Phase 1 — Database and Server Core

1. Create Neon dev branch
2. Add schema and migration
3. Add embed resolver
4. Add URL security
5. Add validation
6. Add query/mutation layer
7. Add API endpoints
8. Add tests

## Phase 2 — Feed and Composer

1. Moment composer
2. URL preview
3. Moment card
4. Feed page
5. Moment detail
6. Cursor pagination
7. Mobile responsive behavior

## Phase 3 — Community Features

1. Like
2. Bookmark
3. Comments
4. Replies
5. Notifications

## Phase 4 — Moderation and Hardening

1. Report flow
2. Admin moderation UI
3. Rate limits
4. CSP
5. Security tests
6. Performance pass
7. Accessibility pass

---

# 28. Agent Execution Rules

The implementing AI agent must:

1. Treat **Orbit Halo** as the final product name.
2. Treat a user-generated social entry as a **Moment**.
3. Inspect the repository before modifying files.
4. Follow the existing code style and architecture.
5. Implement Orbit Halo under a dedicated `(orbit-halo)` SvelteKit layout group.
6. Preserve clean public URLs under `/[lang]/halo`.
7. Keep authentication, localization and core GL-Orbit data shared.
8. Do not wrap Halo pages in the main information-site navigation shell.
9. Provide explicit navigation between GL-Orbit and Orbit Halo.
10. Reuse existing UI primitives where appropriate.
11. Keep API route handlers thin.
12. Put Moment business logic in reusable server modules.
13. Generate and commit real Drizzle migration files.
14. Never modify production directly.
15. Add tests with each critical module.
16. Run:

    ```bash
    npm run check
    npm run test
    npm run build
    ```

17. Fix failures caused by the implementation before finishing.
18. Avoid unrelated refactors.
19. Avoid adding dependencies unless justified.
20. Do not replace the existing authentication system.
21. Do not implement image upload.
22. Do not render raw provider HTML.
23. Do not fetch arbitrary external URLs.
24. Document notable architectural decisions.
25. Produce a final summary containing:
    - Files changed
    - Migration created
    - Tests added
    - Commands executed
    - Remaining risks
    - Recommended follow-up work

---

# 29. Suggested Final Agent Prompt

Use the following prompt with the implementation agent:

```txt
Implement the GL-Orbit Orbit Halo feature according to
docs/specs/gl-orbit-orbit-halo-spec.md.

Orbit Halo is the final social product name.
A user-generated post is called a Moment.

First inspect the repository, current schema, route patterns,
authentication, components, tests and code style.

Create a dedicated SvelteKit route-group layout for Orbit Halo.
Use clean public routes under /[lang]/halo.
Do not render Halo pages inside the main GL-Orbit information layout.
Keep authentication, localization and core data shared.
Add explicit navigation between GL-Orbit and Orbit Halo.

Create and work on a dedicated Git branch named:

feat/orbit-halo

Use a Neon development branch named:

dev/orbit-halo

Do not modify production directly.

Implement the work incrementally in the phases described in the spec.
Generate and commit Drizzle migration files.

Keep route handlers thin and place Moment business logic in reusable
server modules.

Do not add image upload.
Do not accept or render user-supplied HTML.
Do not server-fetch arbitrary URLs.
Use safe provider-specific embeds and fallback cards.

Add tests for URL security, normalization, provider parsing,
authorization, creation, duplicate prevention, interactions,
comments and moderation.

Before finishing, run:

npm run check
npm run test
npm run build

Fix all failures caused by the implementation.

At completion, provide:

1. Summary of architecture
2. Files changed
3. Database migration details
4. Tests added
5. Commands executed and results
6. Remaining risks
7. Recommended next steps
```

---

# 30. Future Extensions

The following may be added after the MVP proves usage:

```txt
Image upload through object storage
User follow system
Following feed
Block and mute
Repost / Quote Moment
Trending tags
Search
Content recommendation
Real-time updates
Moderation automation
External metadata refresh jobs
Storage migration from external images
```

Do not implement these unless explicitly requested.

---

# 31. Product Summary

The system should remain simple:

```txt
1 Moment
= 1 required external source
+ optional user commentary
+ optional external images
+ optional GL-Orbit entity tags
+ community interactions
```

The key differentiator is not generic social posting.

The key differentiator is:

```txt
GL-focused community discussion around real moments
from TikTok, X, YouTube and other source platforms.
```
