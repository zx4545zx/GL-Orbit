import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { seriesSchedules, series, platforms } from '$lib/server/db/schema.js';
import { eq, asc, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const body = await request.json() as {
		seriesId?: string;
		platformId?: string;
		dayOfWeek?: number;
		airTime?: string;
		isUncut?: boolean;
	};

	if (!body.seriesId || !body.platformId || body.dayOfWeek === undefined || !body.airTime) {
		error(400, 'กรุณากรอกข้อมูลให้ครบถ้วน');
	}

	const db = await getDb();

	const [created] = await db
		.insert(seriesSchedules)
		.values({
			seriesId: body.seriesId,
			platformId: body.platformId,
			dayOfWeek: body.dayOfWeek,
			airTime: body.airTime,
			isUncut: body.isUncut ?? false
		})
		.returning();

	return json({ data: created }, { status: 201 });
};

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		error(403, 'ไม่มีสิทธิ์เข้าถึง');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const offset = (page - 1) * limit;

	const db = await getDb();

	const schedules = await db
		.select({
			id: seriesSchedules.id,
			seriesId: series.id,
			seriesTitle: series.titleEn,
			seriesTitleTh: series.titleTh,
			platformName: platforms.name,
			dayOfWeek: seriesSchedules.dayOfWeek,
			airTime: seriesSchedules.airTime,
			isUncut: seriesSchedules.isUncut
		})
		.from(seriesSchedules)
		.innerJoin(series, eq(seriesSchedules.seriesId, series.id))
		.innerJoin(platforms, eq(seriesSchedules.platformId, platforms.id))
		.orderBy(asc(seriesSchedules.dayOfWeek), asc(seriesSchedules.airTime))
		.limit(limit)
		.offset(offset);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(seriesSchedules);

	const data = schedules.map((s) => ({
		id: s.id,
		seriesId: s.seriesId,
		series: s.seriesTitle,
		seriesTh: s.seriesTitleTh ?? '',
		day: dayNames[s.dayOfWeek] ?? 'ไม่ระบุ',
		dayOfWeek: s.dayOfWeek,
		time: s.airTime,
		platform: s.platformName,
		isUncut: s.isUncut
	}));

	return json({ data, page, limit, total: count, totalPages: Math.ceil(count / limit) });
};
