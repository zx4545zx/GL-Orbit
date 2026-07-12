import { resolveEmbed } from '$lib/server/embeds/resolver.js';
import { parseCreateMoment } from '$lib/server/moments/validation.js';

export async function parseMomentRequest(request: Request) {
	let body: Record<string, unknown>;
	try { body = await request.json() as Record<string, unknown>; } catch { return null; }
	const parsed = parseCreateMoment(body);
	if (!parsed.ok) return null;
	const embed = await resolveEmbed(parsed.value.sourceUrl);
	const ids = (name: string, max: number) => Array.isArray(body[name]) && body[name].length <= max && body[name].every((id) => typeof id === 'string') ? body[name] as string[] : null;
	const seriesIds = ids('seriesIds', 3); const artistIds = ids('artistIds', 6); const shipIds = ids('shipIds', 3);
	if (!seriesIds || !artistIds || !shipIds) return null;
	return { ...parsed.value, sourceCanonicalUrl: embed.canonicalUrl, provider: embed.provider, externalId: embed.externalId, embedStatus: embed.status, embedMetadata: embed.metadata, seriesIds, artistIds, shipIds };
}

export function requireUser(user: App.Locals['user']) { return user ?? null; }
