import 'dotenv/config';
import postgres from 'postgres';

const provider = process.env.DB_PROVIDER || 'neon';
if (provider !== 'neon' && provider !== 'supabase') throw new Error('DB_PROVIDER must be either "neon" or "supabase"');
const key = provider === 'supabase' ? 'SUPABASE_DATABASE_URL' : 'NEON_DATABASE_URL';
const url = process.env[key] || (!process.env.DB_PROVIDER && process.env.DATABASE_URL);
if (!url) throw new Error(`${key} is not set`);
const sql = postgres(url, { prepare: false });
const getExpiry = (url) => {
	try { const expires = Number(new URL(url).searchParams.get('x-expires')); return Number.isFinite(expires) ? new Date(expires * 1_000).toISOString() : undefined; } catch { return undefined; }
};

try {
	const rows = await sql.unsafe("SELECT id, source_canonical_url FROM moments WHERE source_provider = 'TIKTOK' AND (embed_metadata->>'thumbnailUrl') IS NULL");
	console.log(`Found ${rows.length} TikTok moments to backfill.`);
	for (const row of rows) {
		try {
			const endpoint = new URL('https://www.tiktok.com/oembed');
			endpoint.searchParams.set('url', row.source_canonical_url);
			const response = await fetch(endpoint, { signal: AbortSignal.timeout(3_000) });
			if (!response.ok) continue;
			const metadata = await response.json();
			if (typeof metadata.thumbnail_url !== 'string' || !metadata.thumbnail_url.startsWith('https://')) continue;
			await sql`UPDATE moments SET embed_metadata = coalesce(embed_metadata, '{}'::jsonb) || ${JSON.stringify({ providerName: 'TikTok', title: metadata.title, authorName: metadata.author_name, thumbnailUrl: metadata.thumbnail_url, thumbnailExpiresAt: getExpiry(metadata.thumbnail_url) })}::jsonb, updated_at = now() WHERE id = ${row.id}`;
		} catch { /* retain the existing branded-card fallback */ }
	}
} finally {
	await sql.end();
}
