# Short-link Embed Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve TikTok, YouTube, and X short links to their final safe URL before Halo embed provider detection.

**Architecture:** Add a focused server-only redirect resolver that makes requests only for an allowlist of known short-link hosts. It follows a small, timeout-bounded manual redirect chain and validates every hop with the existing URL security guard. `resolveEmbed` uses the final URL when available and retains its existing fallback behavior when resolution fails.

**Tech Stack:** TypeScript, SvelteKit server runtime, native `fetch`, Vitest tests intentionally skipped per user request.

---

## File structure

- Create `src/lib/server/embeds/short-link-resolver.ts`: bounded, secure redirect resolver for known short-link hosts.
- Modify `src/lib/server/embeds/resolver.ts`: resolve eligible links before normalization and provider matching.
- Modify `src/lib/components/moments/types.ts`: prefer the resolved canonical URL for client embed previews.

### Task 1: Add the bounded short-link resolver

**Files:**
- Create: `src/lib/server/embeds/short-link-resolver.ts`

- [ ] **Step 1: Add the resolver module**

```ts
import { parseSafeExternalUrl } from './url-security.js';

const shortLinkHosts = new Set(['vt.tiktok.com', 'youtu.be', 't.co']);
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 5_000;

function isRedirect(response: Response): boolean {
	return response.status >= 300 && response.status < 400;
}

export async function resolveShortLink(url: URL): Promise<URL> {
	if (!shortLinkHosts.has(url.hostname.toLowerCase())) return url;

	let current = url;
	for (let hop = 0; hop < MAX_REDIRECTS; hop += 1) {
		parseSafeExternalUrl(current.toString());
		const response = await fetch(current, {
			redirect: 'manual',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});

		if (!isRedirect(response)) {
			await response.body?.cancel();
			return current;
		}

		const location = response.headers.get('location');
		await response.body?.cancel();
		if (!location) return current;

		current = parseSafeExternalUrl(new URL(location, current).toString());
	}

	throw new Error('Too many redirects');
}
```

- [ ] **Step 2: Inspect the new module**

Run: `npm run check`

Expected: TypeScript and Svelte validation pass.

### Task 2: Resolve short links before provider detection

**Files:**
- Modify: `src/lib/server/embeds/resolver.ts:7-11`

- [ ] **Step 1: Import the resolver**

```ts
import { resolveShortLink } from './short-link-resolver.js';
```

- [ ] **Step 2: Replace the resolver setup with safe best-effort resolution**

```ts
export async function resolveEmbed(rawUrl: string): Promise<ResolvedEmbed> {
	const submittedUrl = parseSafeExternalUrl(rawUrl);
	let resolvedUrl = submittedUrl;
	try {
		resolvedUrl = await resolveShortLink(submittedUrl);
	} catch {
		// Preserve the submitted safe URL and existing fallback behavior.
	}

	const canonicalUrl = normalizeUrl(resolvedUrl.toString());
	const url = new URL(canonicalUrl);
	const host = url.hostname;
```

- [ ] **Step 3: Confirm direct links retain existing behavior**

Run: `npm run check`

Expected: TypeScript and Svelte validation pass. Automated tests intentionally skipped per user instruction.

### Task 3: Inspect the final change

**Files:**
- Create: `src/lib/server/embeds/short-link-resolver.ts`
- Modify: `src/lib/server/embeds/resolver.ts`

- [ ] **Step 1: Inspect the final diff**

Run: `git diff -- src/lib/server/embeds/short-link-resolver.ts src/lib/server/embeds/resolver.ts`

Expected: Requests start only from the three allowlisted short hosts; each redirect destination is validated; failed resolution leaves the safe original URL intact.

- [ ] **Step 2: Commit the implementation when approved**

```bash
git add src/lib/server/embeds/short-link-resolver.ts src/lib/server/embeds/resolver.ts
```

### Task 4: Render resolved canonical URLs

**Files:**
- Modify: `src/lib/components/moments/types.ts:77`

- [ ] **Step 1: Prefer the resolved URL in the moment adapter**

```ts
source: moment.sourceCanonicalUrl ?? moment.sourceUrl ?? null,
```

- [ ] **Step 2: Inspect the final diff**

Run: `git diff -- src/lib/components/moments/types.ts`

Expected: a successfully resolved short link reaches `EmbedPreview` as its final canonical provider URL.
