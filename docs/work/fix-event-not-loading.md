# Events not loading

Investigation only. No application code change. The production failure is real, but the code does not show which external failure is causing it.

## Original report

Slack `#report-bug`, posted by Nattapon (GitHub `zx4545zx`) on 2026-10-08 around 01:22 Asia/Bangkok. The thread had no replies, screenshots, steps, or environment notes.

Thai:

> bug: event โหลดไม่ขึ้น

English:

> bug: events don't load / don't show up

## What I investigated

What's On events are the product surface that matches this report. They are not the airing calendar.

- Page: `src/routes/[lang=lang]/(app)/whats-on/+page.svelte` at `/th/whats-on` and `/en/whats-on`.
- Load: `+page.server.ts` calls `getWhatsOnData()` in `src/lib/server/queries/whats-on.ts`.
- News comes from the app database through `listPublishedNews()`.
- Events come from an external Supabase REST table, `GET {WHATS_ON_API_URL}/rest/v1/events`, using server-only `WHATS_ON_API_URL` and `WHATS_ON_API_KEY`.
- The query selects `event_id,title,performer,full_title,starts_at,ends_at,all_day,location,event_type,pairing_id,actress_id,company_id,source_timezone,lat,lng`, filters `starts_at` to the view window, and orders by `starts_at`.
- A thrown config error or a failed events response is caught. The page still renders, with `sourceStatus.events` set to `unavailable` and `events` set to `[]`. The only detail is a server log: `What's On <source> source unavailable: <message>`.
- The "all" view then keeps events whose end date is on or after the Bangkok anchor date, and shows the first 5 with a load-more control.
- Git history: `fetchEvents` was added in `4a4e8d5` (2026-08-03) and was not changed when news moved into the app database in `21ba363` (2026-08-08).

Checked live on 2026-10-07 18:25 UTC (2026-10-08 01:25 Asia/Bangkok), logged out:

- `https://gl-orbit.vercel.app/th/whats-on` (Vercel cache miss)
- `https://gl-orbit.com/th/whats-on`
- `https://gl-orbit.vercel.app/th/whats-on?view=week&date=2026-10-08`
- `https://gl-orbit.vercel.app/th/calendar`

## Findings

Production What's On is failing closed on events while news still loads.

Serialized page data on `/th/whats-on`:

- `sourceStatus: { news: "live", events: "unavailable" }`
- `events: []`
- `params.anchorDate: "2026-10-08"`
- News count in the rendered page: 9

The events section shows **0 อีเวนต์** and the copy `โหลดอีเวนต์จากแหล่งข้อมูลภายนอกไม่ได้ในขณะนี้` (`whats_on_events_unavailable`). The same `events: "unavailable"` payload is on the apex domain and on the week view. Both locales use this server load, so `/en/whats-on` takes the same events path.

That status is only set when `getConfig()` throws or `fetchEvents()` rejects. It is not the empty-list state. These paths are ruled out for the current production page:

- Rows that fail `parseEvent` would still be `sourceStatus.events: "live"`.
- A successful response with no rows in the date window would render `ยังไม่มีอีเวนต์ในช่วงนี้`, not the unavailable message.
- CSS and the load-more button are not hiding rows. The server payload is already an empty list.
- The airing calendar is a different query (`src/lib/server/queries/calendar.ts`). `/th/calendar` currently renders schedule items (1 today, 6 this week, including Moon Shadow).
- Client CSP does not block this request. The events fetch runs on the server.

`getConfig()` throws when `WHATS_ON_API_URL` or `WHATS_ON_API_KEY` is missing, the URL is not valid HTTPS, or the URL contains credentials. `fetchEvents()` throws on a non-OK response, a non-array body, a network error, or the 8 second timeout. The page shows the same unavailable state for all of those. The HTTP status or config message exists only in the Vercel function log.

No local `.env` is present in this workspace, and the repository never contained a real What's On host, so this investigation could not call the external table.

## Fix

None. There is no verified defect in the query or the renderer. Changing the select list, the date window, or the error UI would be a guess. The next fact needed is the server log line, or the HTTP status of the external `events` request.

## How to verify

Current bug, logged out:

1. Open `/th/whats-on`.
2. News should still list stories.
3. The events count should be `0 อีเวนต์`, and the section should say events could not be loaded from the external source.
4. In the Vercel function logs for that request, find `What's On configuration source unavailable:` or `What's On events source unavailable:`. The text after the colon is the missing fact (missing env, HTTP status, timeout, or invalid JSON).

After the external call succeeds, the same page should send `sourceStatus.events: "live"` and render upcoming rows in all, week, and calendar views. `npm test -- src/lib/server/queries/whats-on.test.ts src/routes/[lang=lang]/(app)/whats-on/whats-on.test.ts` covers the mapper and the window. It does not call the live Supabase project.

## Open questions for Nattapon

1. Is `/th/whats-on` (ข่าว & อีเวนต์) the page you meant? `/th/calendar` (ตารางฉาย) was showing airing items at the time of this check.
2. In the Vercel logs for a `/th/whats-on` request, what is the full `What's On ... source unavailable:` line? Please do not paste `WHATS_ON_API_KEY` or any other secret.
3. Are `WHATS_ON_API_URL` and `WHATS_ON_API_KEY` set on the production Vercel project? A yes/no for each name is enough.
4. Does `GET {WHATS_ON_API_URL}/rest/v1/events` with that key still return 200 and a JSON array? If it returns 400, 401, 404, or 503, that status is the cause.
5. Do these selected columns still exist on the remote `events` table: `event_id`, `all_day`, `pairing_id`, `actress_id`, `company_id`, `lat`, `lng`? A missing column makes PostgREST reject the whole request.
6. When did events last show on this page, and was that before or after news moved into GL-Orbit (2026-08-08)?
