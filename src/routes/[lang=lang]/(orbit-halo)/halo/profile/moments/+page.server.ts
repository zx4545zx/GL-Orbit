import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { getMoments } from '$lib/server/moments/queries.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const returnPath = `/${params.lang}/halo/profile/moments`;
	if (!locals.user) throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);

	const db = await getDb();
	const [profile] = await db.select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, coverUrl: users.coverUrl }).from(users).where(eq(users.id, locals.user.id)).limit(1);
	if (!profile) throw redirect(303, `/${params.lang}/login?redirectTo=${encodeURIComponent(returnPath)}`);
	const page = await getMoments({ authorId: profile.id, viewerId: profile.id });
	return { profile, moments: page.moments, nextCursor: page.nextCursor };
};
