import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { studios } from '$lib/server/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const db = await getDb();

	const [existing] = await db
		.select({ id: studios.id })
		.from(studios)
		.where(and(eq(studios.id, params.id), isNull(studios.deletedAt)));

	if (!existing) {
		error(404, 'ไม่พบข้อมูลสตูดิโอ');
	}

	const body = await request.json();
	const { name, logoUrl, officialSite } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		error(400, 'กรุณาระบุชื่อสตูดิโอ');
	}

	const [updated] = await db
		.update(studios)
		.set({
			name: name.trim(),
			logoUrl: logoUrl ?? null,
			officialSite: officialSite ?? null,
			updatedAt: new Date()
		})
		.where(eq(studios.id, params.id))
		.returning({
			id: studios.id,
			name: studios.name,
			logoUrl: studios.logoUrl,
			officialSite: studios.officialSite
		});

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const db = await getDb();

	const [existing] = await db
		.select({ id: studios.id })
		.from(studios)
		.where(and(eq(studios.id, params.id), isNull(studios.deletedAt)));

	if (!existing) {
		error(404, 'ไม่พบข้อมูลสตูดิโอ');
	}

	await db
		.update(studios)
		.set({ deletedAt: new Date() })
		.where(eq(studios.id, params.id));

	return json({ success: true });
};
