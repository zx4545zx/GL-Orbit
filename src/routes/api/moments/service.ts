import { resolveEmbed } from '$lib/server/embeds/resolver.js';
import { parseCreateMoment } from '$lib/server/moments/validation.js';

export async function parseMomentRequest(request: Request) {
	let body: Record<string, unknown>;
	try { body = await request.json() as Record<string, unknown>; } catch { return null; }
	const parsed = parseCreateMoment(body);
	if (!parsed.ok) return null;
	const embed = parsed.value.sourceUrl
		? await resolveEmbed(parsed.value.sourceUrl)
		: { canonicalUrl: null, provider: 'OTHER' as const, externalId: undefined, status: 'FALLBACK' as const, metadata: {} };
	const ids = (name: string, max: number) => {
		if (typeof body[name] === 'undefined') return [];
		return Array.isArray(body[name]) && body[name].length <= max && body[name].every((id) => typeof id === 'string')
			? body[name] as string[]
			: null;
	};
	const seriesIds = ids('seriesIds', 3); const artistIds = ids('artistIds', 6); const shipIds = ids('shipIds', 3);
	const mediaIds = ids('mediaIds', 4);
	const stagedMedia = Array.isArray(body.stagedMedia) && body.stagedMedia.length <= 4 ? body.stagedMedia : null;
	if (!seriesIds || !artistIds || !shipIds || !mediaIds || !stagedMedia || new Set(mediaIds).size !== mediaIds.length || mediaIds.length + stagedMedia.length > 4) return null;
	return { ...parsed.value, sourceCanonicalUrl: embed.canonicalUrl, provider: embed.provider, externalId: embed.externalId, embedStatus: embed.status, embedMetadata: embed.metadata, seriesIds, artistIds, shipIds, mediaIds, stagedMedia };
}

export function requireUser(user: App.Locals['user']) { return user ?? null; }
