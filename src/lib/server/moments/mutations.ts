import { randomUUID } from 'node:crypto';
import { getDb } from '../db/index.js';

type CreateMomentInput = {
	authorId: string;
	sourceUrl: string;
	sourceCanonicalUrl: string;
	provider: 'YOUTUBE' | 'TIKTOK' | 'X' | 'OTHER';
	imageUrls: string[];
};

export async function createMoment(input: CreateMomentInput): Promise<{ id: string }> {
	const db = await getDb();
	const sql = db.$client;
	const id = randomUUID();
	const statements = [sql`INSERT INTO moments (id, author_id, source_url, source_canonical_url, source_provider) VALUES (${id}, ${input.authorId}, ${input.sourceUrl}, ${input.sourceCanonicalUrl}, ${input.provider})`];
	for (const [sortOrder, externalUrl] of input.imageUrls.entries()) {
		statements.push(sql`INSERT INTO moment_media (id, moment_id, external_url, sort_order) VALUES (${randomUUID()}, ${id}, ${externalUrl}, ${sortOrder})`);
	}
	await sql.transaction(statements);
	return { id };
}
