import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { language } = await request.json();
	if (!['th', 'en'].includes(language)) {
		return json({ error: 'Invalid language' }, { status: 400 });
	}

	const db = await getDb();
	await db.update(users).set({ preferredLanguage: language }).where(eq(users.id, locals.user.id));

	return json({ success: true });
};
