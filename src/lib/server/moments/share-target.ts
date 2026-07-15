export const SHARE_TARGET_COOKIE = 'halo_share_target';
export const SHARE_TARGET_MAX_AGE = 10 * 60;

export type SharedMomentPayload = { body: string; sourceUrl: string };

function normalizeText(value: string | null): string {
	return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function validHttpsUrl(value: string): string {
	try {
		return new URL(value).protocol === 'https:' ? value : '';
	} catch {
		return '';
	}
}

export function normalizeSharedMoment(input: URLSearchParams): SharedMomentPayload | null {
	const title = normalizeText(input.get('title'));
	const sharedText = normalizeText(input.get('text'));
	const body = [title, sharedText]
		.filter((part, index, parts) => part && parts.indexOf(part) === index)
		.join('\n\n')
		.slice(0, 2_000);
	const sourceUrl = validHttpsUrl(normalizeText(input.get('url')));
	return body || sourceUrl ? { body, sourceUrl } : null;
}

export function readSharedMoment(value: string | undefined): SharedMomentPayload | null {
	if (!value) return null;

	try {
		const parsed = JSON.parse(value) as Partial<SharedMomentPayload>;
		const body = typeof parsed.body === 'string' ? parsed.body.slice(0, 2_000) : '';
		const sourceUrl = typeof parsed.sourceUrl === 'string' ? validHttpsUrl(parsed.sourceUrl) : '';
		return body || sourceUrl ? { body, sourceUrl } : null;
	} catch {
		return null;
	}
}
