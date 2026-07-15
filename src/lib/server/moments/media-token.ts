import { createHmac, timingSafeEqual } from 'node:crypto';

type StagedMedia = { key: string; url: string; token: string };
const secret = () => process.env.AUTH_SECRET ?? '';
export function signStagedMomentMedia(momentId: string, userId: string, key: string, url: string) {
	return createHmac('sha256', secret()).update(`${momentId}:${userId}:${key}:${url}`).digest('base64url');
}
export function isStagedMomentMedia(value: unknown, momentId: string, userId: string): value is StagedMedia {
	if (!value || typeof value !== 'object') return false;
	const item = value as Record<string, unknown>;
	if (typeof item.key !== 'string' || typeof item.url !== 'string' || typeof item.token !== 'string') return false;
	const expected = signStagedMomentMedia(momentId, userId, item.key, item.url);
	return item.token.length === expected.length && timingSafeEqual(Buffer.from(item.token), Buffer.from(expected));
}
