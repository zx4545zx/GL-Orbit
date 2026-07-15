# Short-link embed resolution

## Goal

Resolve supported short URLs before saving a Halo moment so TikTok, YouTube, and X links use the existing embed preview.

## Scope

- Resolve only `vt.tiktok.com`, `youtu.be`, and `t.co`.
- Follow a bounded redirect chain server-side.
- Persist the final normalized URL as the moment's canonical URL.
- Render the canonical URL when available so the client-side embed recognizer receives the resolved URL.
- Preserve the existing fallback card when resolution fails or the final URL is unsupported.

## Design

Add a small resolver helper used by `resolveEmbed` before provider detection.

1. Parse and validate the submitted HTTPS URL.
2. If its hostname is not in the short-link allowlist, use the existing normalization path without fetching it.
3. For allowlisted hosts, issue a redirect-following request with a short timeout and a fixed maximum hop count.
4. Validate every redirect target with `parseSafeExternalUrl` before requesting it.
5. Normalize the final URL and pass it through the existing provider detection for TikTok, YouTube, and X.
6. Render `sourceCanonicalUrl` before `sourceUrl` in the moment adapter.
7. On timeout, network failure, invalid redirect, or too many redirects, retain the original safe URL and return the existing fallback result.

## Security and reliability

- HTTPS-only URLs; no credentials, ports, localhost, private IPv4, or local hostnames.
- Allowlisted redirect origins only initiate requests; every destination is independently validated.
- Redirect hops and request duration are bounded.
- No general-purpose metadata fetch or HTML parsing.

## Tests

- TikTok `vt.tiktok.com` redirect resolves to a TikTok video canonical URL.
- `youtu.be` and `t.co` redirects resolve to supported provider URLs.
- Unsafe redirect targets, redirect loops, and failed requests return the safe fallback without throwing.
- Existing direct provider URL tests remain unchanged.
