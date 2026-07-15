import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const getExpiry = (url) => {
	try { const expires = Number(new URL(url).searchParams.get('x-expires')); return Number.isFinite(expires) ? new Date(expires * 1_000).toISOString() : undefined; } catch { return undefined; }
};
const rows = await sql.query("SELECT id, source_canonical_url FROM moments WHERE source_provider = 'TIKTOK' AND (embed_metadata->>'thumbnailUrl') IS NULL");
console.log(`Found ${rows.length} TikTok moments to backfill.`);
for (const row of rows) {
	try {
		const endpoint = new URL('https://www.tiktok.com/oembed');
		endpoint.searchParams.set('url', row.source_canonical_url);
		const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
		if (!response.ok) continue;
		const metadata = await response.json();
		if (typeof metadata.thumbnail_url !== 'string' || !metadata.thumbnail_url.startsWith('https://')) continue;
		await sql.query("UPDATE moments SET embed_metadata = coalesce(embed_metadata, '{}'::jsonb) || $1::jsonb, updated_at = now() WHERE id = $2", [JSON.stringify({ providerName: 'TikTok', title: metadata.title, authorName: metadata.author_name, thumbnailUrl: metadata.thumbnail_url, thumbnailExpiresAt: getExpiry(metadata.thumbnail_url) }), row.id]);
	} catch { /* retain the existing branded-card fallback */ }
}
