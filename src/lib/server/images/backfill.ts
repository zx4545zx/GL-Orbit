import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import {
	IMAGE_VARIANTS,
	parseLegacyUrl,
	buildVariantKey,
	buildVariantUrl,
	mimeForExt,
	type ImageType
} from '$lib/images/config.js';
import { generateVariants } from './sharp.js';
import { putObject, objectExists } from '../r2.js';

export type BackfillResult = {
	processed: number;
	updated: number;
	skipped: number;
	errors: { url: string; message: string }[];
};

type EntitySpec = {
	type: ImageType;
	select: () => Promise<{ id: string; url: string }[]>;
	update: (id: string, canonical: string) => Promise<unknown>;
};

export async function backfillLegacyImages(): Promise<BackfillResult> {
	const db = await getDb();
	const result: BackfillResult = { processed: 0, updated: 0, skipped: 0, errors: [] };

	const entities: EntitySpec[] = [
		{
			type: 'posters',
			select: async () =>
				(await db
					.select({ id: schema.series.id, url: schema.series.posterUrl })
					.from(schema.series))
					.filter((r): r is { id: string; url: string } => r.url !== null),
			update: (id, canonical) =>
				db.update(schema.series).set({ posterUrl: canonical }).where(eq(schema.series.id, id))
		},
		{
			type: 'profiles',
			select: async () =>
				(await db
					.select({ id: schema.artists.id, url: schema.artists.profileImageUrl })
					.from(schema.artists))
					.filter((r): r is { id: string; url: string } => r.url !== null),
			update: (id, canonical) =>
				db
					.update(schema.artists)
					.set({ profileImageUrl: canonical })
					.where(eq(schema.artists.id, id))
		},
		{
			type: 'profiles',
			select: async () =>
				(await db.select({ id: schema.users.id, url: schema.users.avatarUrl }).from(schema.users))
					.filter((r): r is { id: string; url: string } => r.url !== null),
			update: (id, canonical) =>
				db.update(schema.users).set({ avatarUrl: canonical }).where(eq(schema.users.id, id))
		},
		{
			type: 'posters',
			select: async () =>
				(await db.select({ id: schema.users.id, url: schema.users.coverUrl }).from(schema.users))
					.filter((r): r is { id: string; url: string } => r.url !== null),
			update: (id, canonical) =>
				db.update(schema.users).set({ coverUrl: canonical }).where(eq(schema.users.id, id))
		},
		{
			type: 'posters',
			select: async () =>
				(await db
					.select({ id: schema.episodes.id, url: schema.episodes.coverUrl })
					.from(schema.episodes))
					.filter((r): r is { id: string; url: string } => r.url !== null),
			update: (id, canonical) =>
				db.update(schema.episodes).set({ coverUrl: canonical }).where(eq(schema.episodes.id, id))
		}
	];

	for (const entity of entities) {
		const rows = (await entity.select()).filter((r) => parseLegacyUrl(r.url) !== null);
		for (const row of rows) {
			result.processed++;
			try {
				await backfillOne(row, entity, result);
			} catch (err) {
				result.errors.push({
					url: row.url,
					message: err instanceof Error ? err.message : 'unknown error'
				});
			}
		}
	}
	return result;
}

async function backfillOne(
	row: { id: string; url: string },
	entity: EntitySpec,
	result: BackfillResult
): Promise<void> {
	const parsed = parseLegacyUrl(row.url);
	if (!parsed) {
		result.skipped++;
		return;
	}
	const { base, type, uuid } = parsed;
	const fallback = IMAGE_VARIANTS[type].fallback;
	const canonicalKey = buildVariantKey(type, uuid, fallback, 'jpg');

	// idempotency: skip if canonical already exists
	if (await objectExists(canonicalKey)) {
		await entity.update(row.id, buildVariantUrl(base, type, uuid, fallback, 'jpg'));
		result.updated++;
		return;
	}

	const res = await fetch(row.url);
	if (!res.ok) throw new Error(`download failed: ${res.status}`);
	const input = Buffer.from(await res.arrayBuffer());
	const variants = await generateVariants(input, type);

	for (const v of variants) {
		await putObject(buildVariantKey(type, uuid, v.width, v.ext), v.buffer, mimeForExt(v.ext));
	}
	await entity.update(row.id, buildVariantUrl(base, type, uuid, fallback, 'jpg'));
	result.updated++;
}
