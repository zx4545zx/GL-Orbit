# Design: Add `/llms.txt` Endpoint

Date: 2026-06-29

## Goal

Add a crawlable `llms.txt` file for GL-Orbit so SEO tools and LLM-oriented crawlers can retrieve a concise, machine-readable summary of the site and its most useful public entry points.

## Current Context

- GL-Orbit is a SvelteKit app.
- Existing SEO files are implemented as route endpoints:
  - `src/routes/robots.txt/+server.ts`
  - `src/routes/sitemap.xml/+server.ts`
- No `llms.txt` route or static file exists yet.
- Public content should be emphasized; private/admin/API routes should not be promoted.

## Chosen Approach

Create a SvelteKit route endpoint at:

```text
src/routes/llms.txt/+server.ts
```

This matches the existing SEO route pattern and allows the response to use the request origin for absolute URLs.

## Response Format

The endpoint returns Markdown-style text with:

- A short description of GL-Orbit.
- A list of public site links useful to LLM crawlers.
- A link to `/sitemap.xml`.
- A crawler guidance note that admin, API, auth, profile, and notification pages are not intended as primary crawl targets.

Headers:

```text
content-type: text/markdown; charset=utf-8
cache-control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400
```

## Public Links to Include

Use `url.origin` to generate absolute URLs for:

- `/`
- `/series`
- `/calendar`
- `/artists`
- `/sitemap.xml`

## Exclusions / Guidance

The endpoint should not link to:

- `/admin/`
- `/api/`
- `/login`
- `/register`
- `/profile`
- `/notifications`

These exclusions align with the current `robots.txt` policy.

## Error Handling

No database access is required. The endpoint is deterministic and should always return a successful response unless the SvelteKit runtime itself fails.

## Testing / Verification

After implementation:

1. Run `npm run check`.
2. Optionally start the dev server and verify `/llms.txt` returns the expected text and headers.

## Scope

In scope:

- Add `/llms.txt` route endpoint.
- Keep content static and concise.

Out of scope:

- Dynamic database-driven lists of every series or artist.
- Changes to sitemap or robots behavior.
- Schema, auth, or database changes.
