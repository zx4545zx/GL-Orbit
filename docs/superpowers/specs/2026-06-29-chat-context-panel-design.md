# Chat Context Side Panel — Design

> Status: Approved design (2026-06-29). Implementation split into 3 phases.

## Goal

เมื่อ AI chat bot ตอบคำถามเกี่ยวกับซีรีส์/ศิลปิน/ตารางฉาย ให้แสดงเนื้อหา context ที่เกี่ยวข้องใน panel แบบเต็มจอ (มือถือ) หรือ drawer ด้านขวา (desktop) โดยใช้ component เดียวกับหน้า `/explore`, `/calendar`, และหน้า detail.

## Current State (evidence)

- `POST /api/chat-series` คืน `{ reply: string, conversationId: string }` เท่านั้น — **ไม่มี entity reference**
- pipeline: ถาม → LLM สร้าง SQL → รัน DB ได้ `rows` → LLM เขียนคำตอบ → **ทิ้ง `rows`**
- `rows` ที่ได้มี id ของ entity จริงอยู่แล้ว (series.id / artists.id) แค่ไม่ถูกส่งกลับ
- `/explore`, `/calendar`, series/artist detail **ไม่มี component ร่วม** — การ์ด/section inline ซ้ำกัน 2–3 แบบ
- "3 tab ของ /calendar" จริงๆ คือ **3 view mode** (grid/calendar/list) ของตารางเดือน/สัปดาห์
- `CalendarEvent` (types/calendar.ts) มี `seriesId` อยู่แล้ว → กรองฝั่ง client ได้โดยไม่แก้ backend

## Priority Order (เมื่อ AI ตอบเกี่ยวกับหลายประเภท)

เลือก type เดียวที่จะแสดงใน panel ตามลำดับความสำคัญ:
1. **schedule** (ตารางฉาย) — สูงสุด
2. **artist** (ศิลปิน)
3. **series** (ซีรีส์) — ต่ำสุด

## Backend — Entity Extraction (Hybrid approach)

ไม่เพิ่ม LLM call. ใช้ข้อมูลที่มีอยู่แล้ว:

### Response shape ใหม่

```ts
type ChatContext =
  | { type: 'schedule'; seriesIds: string[] }
  | { type: 'artist'; artistIds: string[] }
  | { type: 'series'; seriesIds: string[] }
  | null;

// response: { reply, conversationId, context }
```

### Type classification logic

ดู `safeSql.sql` (หลังผ่าน safety gate) ว่า FROM/JOIN ตารางไหน ตามลำดับ priority:
- มี `episode_schedules` หรือ `series_schedules` → `schedule`
- else มี `artists` → `artist`
- else มี `series` → `series`

### ID extraction logic

- ปรับ `SQL_GENERATION_PROMPT` (กฎใหม่): "ถ้าคำถามเกี่ยวกับซีรีส์/ศิลปิน ให้ SELECT id ของ entity นั้นด้วยเสมอ"
- อ่าน id จาก `rows` โดยหา key ที่ชื่อ `id` / `series_id` / `artist_id` (case-insensitive)
- guard: ถ้าไม่เจอ id → `context = null`

### Out-of-scope / empty

- `safeSql.outOfScope === true` → `context = null`
- `rows.length === 0` → `context = null`

## Backend — Context Endpoint (ใหม่)

`POST /api/chat/context`

```ts
// request: { type: 'series' | 'artist' | 'schedule'; ids: string[] }
// series   → { type: 'series'; items: SeriesDetail[] }
// artist   → { type: 'artist'; items: ArtistDetail[] }
// schedule → { type: 'schedule'; calendar: CalendarApiResponse }   // กรองเฉพาะ ids ฝั่ง server
```

- ต้อง login (เหมือน endpoint อื่น)
- validate ids เป็น UUID ทั้งหมด
- reuse `getSeriesDetail`, `getArtistDetail`, `getCalendarData` ที่มีอยู่แล้ว
- schedule: ดึง `CalendarApiResponse` เดือนปัจจุบันแล้วกรอง `events` ที่ `seriesId ∈ ids`

## Frontend — Component Extraction

สกัดจากหน้าเดิมเป็น component ร่วม (ลดความซ้ำซ้อนใน explore/detail ด้วย):

| Component (ใหม่) | แหล่งที่มา | Props |
|---|---|---|
| `SeriesPosterCard.svelte` | explore/series card | `{ item: SeriesListItem; href?: string }` |
| `ArtistCard.svelte` | explore/artists compact card | `{ item: ArtistListItem; href?: string }` |
| `SeriesDetailPanel.svelte` | series/[id] hero+artists+schedule sections | `{ detail: SeriesDetail }` |
| `ArtistDetailPanel.svelte` | artists/[id] profile+works sections | `{ detail: ArtistDetail }` |
| `CalendarViews.svelte` | calendar 3 view mode | `{ events, allSeries, platforms, scheduleByDay }` |

หลังสกัดแล้ว explore/series, explore/artists, calendar ใช้ component เดียวกันกับ panel.

## Frontend — Panel Shell & Header Reorg

### Header (เปลี่ยน)
- มุมซ้ายบน: hamburger เปิดประวัติแชต (เหมือนเดิม)
- มุมขวาบน: **ปุ่มเปิด context panel** (แทนที่รูปโปรไฟล์เดิม) — มี badge ตัวเลขเมื่อมี context, ซ่อนเมื่อ `context === null`
- รูปโปรไฟล์: **ย้ายเข้า sidebar ประวัติแชต** (footer ของ aside)

### Panel
- `ChatContextPanel.svelte` — overlay
  - mobile (< lg): fixed inset-0, มี header (ปุ่มปิด) + scrollable content
  - desktop (lg+): drawer ด้านขวา width ~420px
- internal state: `view: 'list' | 'detail'`, `selectedId`
- มุมขวาบนของ panel content detail: ปุ่ม "ดูหน้าเต็ม" → link เต็ม `/series/[id]` หรือ `/artists/[id]`

### Panel content rendering (ตาม type และจำนวน)
- `series` / `artist`:
  - 1 entity → `SeriesDetailPanel` / `ArtistDetailPanel` ทันที (view='detail') + ปุ่ม "ดูหน้าเต็ม"
  - N entities → grid ของ `SeriesPosterCard` / `ArtistCard` (view='list'); กดการ์ด → view='detail' (มีปุ่มย้อนกลับ list) + ปุ่ม "ดูหน้าเต็ม"
- `schedule`:
  - `CalendarViews` ที่กรองเฉพาะ `seriesIds` ที่ AI ตอบ ครบ 3 view mode

## Data Flow

```
user ส่งคำถาม
  → POST /api/chat-series → { reply, conversationId, context }
  → ChatApp เก็บ context ล่าสุดใน state
  → เปิดปุ่ม panel (badge แสดงจำนวน)
user กดปุ่ม panel
  → POST /api/chat/context { type, ids }
  → render ตาม type/จำนวน
```

## Empty / Error States

- `context === null` → ซ่อนปุ่ม panel (แชตทำงานเหมือนเดิม)
- fetch context error → ข้อความไทยใน panel + ปุ่ม "ลองใหม่"

## Testing Strategy

- backend: unit test entity extraction (`classifyContext`, `extractIds`) — pure functions, mock rows
- backend: endpoint test (`/api/chat/context`) กรณี series/artist/schedule + auth + validation
- frontend: source-level regression test เหมือน pattern ที่มี (อ่าน source ตรวจ wiring) เพราะไม่มี component test framework setup ที่ render

## Phasing

Build order ≠ display priority. ในผลิตภัณฑ์สุดท้ายยึด schedule>artist>series เสมอ แต่ build ทีละ type:

- **Phase 1 (foundation + series):** backend extraction (ทุก type พร้อมกัน เพราะ logic เดียวกัน) + panel shell + header reorg + `SeriesPosterCard` + `SeriesDetailPanel` + series rendering + context endpoint (series branch). Shippable ในตัวเอง.
- **Phase 2 (artist):** `ArtistCard` + `ArtistDetailPanel` + artist rendering + context endpoint (artist branch).
- **Phase 3 (schedule):** `CalendarViews` extraction + schedule branch + กรอง 3 view.

## Open Constraints (Global)

- UI ภาษาไทยทั้งหมด (label/error/empty)
- Svelte 5 Runes (`$state`/`$derived`/`$props`) เท่านั้น, ไม่ใช้ `export let`
- Server files: `getDb()` ไม่ใช่ `db` proxy
- import ต้องมีนามสกุล `.js` (NodeNext)
- ต้อง login ทุก chat endpoint
- ไม่แตะ `(chat)/+layout.svelte` body-lock (เพิ่งแก้ keyboard gap เสร็จ)
