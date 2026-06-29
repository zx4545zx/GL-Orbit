import { json } from '@sveltejs/kit';
import { getSeriesDetail } from '$lib/server/queries/series-detail.js';
import type { RequestHandler } from './$types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 20;

function parseBody(body: unknown): { type: string; ids: string[] } | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as { type?: unknown; ids?: unknown };
	if (typeof b.type !== 'string' || !Array.isArray(b.ids)) return null;
	const ids = b.ids.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x));
	return { type: b.type, ids };
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
	}

	const parsed = parseBody(body);
	if (!parsed || parsed.ids.length === 0 || parsed.ids.length > MAX_IDS) {
		return json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
	}

	if (parsed.type === 'series') {
		const items = (await Promise.all(parsed.ids.map((id) => getSeriesDetail(id)))).filter((x): x is NonNullable<typeof x> => x !== null);
		return json({ type: 'series', items });
	}

	return json({ error: 'ยังไม่รองรับประเภทนี้' }, { status: 400 });
};
