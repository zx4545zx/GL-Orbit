import { eq, and, isNull, asc, inArray } from 'drizzle-orm';
import {
	series,
	studios,
	genres,
	seriesGenres,
	artists,
	seriesArtists,
	episodes,
	episodeSchedules,
	seriesSchedules,
	platforms
} from './db/schema.js';
import type { Db } from './db/index.js';

/**
 * ดึงข้อมูลซีรีส์ทั้งหมดในครั้งเดียว พร้อมความสัมพันธ์ทุกอย่าง
 * ใช้สำหรับหน้า Series Editor เพื่อหลีกเลี่ยง N+1 requests
 */
export async function getSeriesFull(db: Db, id: string) {
	const [s] = await db.select().from(series).where(eq(series.id, id)).limit(1);
	if (!s || s.deletedAt) return null;

	// studio
	let studio: { id: string; name: string } | null = null;
	if (s.studioId) {
		const rows = await db
			.select({ id: studios.id, name: studios.name })
			.from(studios)
			.where(eq(studios.id, s.studioId))
			.limit(1);
		studio = rows[0] ?? null;
	}

	// genres
	const genreRows = await db
		.select({ id: genres.id, name: genres.name })
		.from(seriesGenres)
		.innerJoin(genres, eq(seriesGenres.genreId, genres.id))
		.where(eq(seriesGenres.seriesId, id));

	// artists (cast)
	const artistRows = await db
		.select({
			id: artists.id,
			nickname: artists.nickname,
			fullName: artists.fullName,
			profileImageUrl: artists.profileImageUrl,
			roleName: seriesArtists.roleName
		})
		.from(seriesArtists)
		.innerJoin(artists, eq(seriesArtists.artistId, artists.id))
		.where(and(eq(seriesArtists.seriesId, id), isNull(artists.deletedAt)))
		.orderBy(asc(artists.nickname));

	// episodes
	const epRows = await db
		.select({
			id: episodes.id,
			episodeNumber: episodes.episodeNumber,
			title: episodes.title,
			coverUrl: episodes.coverUrl,
			trailerUrl: episodes.trailerUrl
		})
		.from(episodes)
		.where(and(eq(episodes.seriesId, id), isNull(episodes.deletedAt)))
		.orderBy(asc(episodes.episodeNumber));

	// episode schedules (streaming links)
	const epIds = epRows.map((e) => e.id);
	let epSchedRows: {
		id: string;
		episodeId: string;
		platformId: string;
		platformName: string;
		airDate: Date;
		streamLink: string | null;
		isUncut: boolean;
	}[] = [];
	if (epIds.length) {
		epSchedRows = await db
			.select({
				id: episodeSchedules.id,
				episodeId: episodeSchedules.episodeId,
				platformId: episodeSchedules.platformId,
				platformName: platforms.name,
				airDate: episodeSchedules.airDate,
				streamLink: episodeSchedules.streamLink,
				isUncut: episodeSchedules.isUncut
			})
			.from(episodeSchedules)
			.innerJoin(platforms, eq(episodeSchedules.platformId, platforms.id))
			.where(and(inArray(episodeSchedules.episodeId, epIds), isNull(episodeSchedules.deletedAt)))
			.orderBy(asc(episodeSchedules.airDate));
	}

	const episodesOut = epRows.map((e) => ({
		...e,
		schedules: epSchedRows
			.filter((es) => es.episodeId === e.id)
			.map((es) => ({
				id: es.id,
				episodeId: es.episodeId,
				platformId: es.platformId,
				platformName: es.platformName,
				airDate: es.airDate ? new Date(es.airDate).toISOString().slice(0, 16) : '',
				streamLink: es.streamLink,
				isUncut: es.isUncut
			}))
	}));

	// weekly schedules (recurring)
	const schedRows = await db
		.select({
			id: seriesSchedules.id,
			platformId: seriesSchedules.platformId,
			platformName: platforms.name,
			dayOfWeek: seriesSchedules.dayOfWeek,
			airTime: seriesSchedules.airTime,
			isUncut: seriesSchedules.isUncut
		})
		.from(seriesSchedules)
		.innerJoin(platforms, eq(seriesSchedules.platformId, platforms.id))
		.where(eq(seriesSchedules.seriesId, id))
		.orderBy(asc(seriesSchedules.dayOfWeek), asc(seriesSchedules.airTime));

	return {
		series: {
			id: s.id,
			titleEn: s.titleEn,
			titleTh: s.titleTh,
			posterUrl: s.posterUrl,
			status: s.status,
			studioId: s.studioId
		},
		studio,
		genres: genreRows,
		artists: artistRows,
		episodes: episodesOut,
		schedules: schedRows
	};
}

/** ข้อมูลอ้างอิงสำหรับ dropdowns ใน editor (studios, platforms, artists, genres) */
export async function getReferenceData(db: Db) {
	const [allStudios, allPlatforms, allArtists, allGenres] = await Promise.all([
		db.select({ id: studios.id, name: studios.name }).from(studios).where(isNull(studios.deletedAt)).orderBy(asc(studios.name)),
		db.select({ id: platforms.id, name: platforms.name, logoUrl: platforms.logoUrl, baseUrl: platforms.baseUrl }).from(platforms).where(isNull(platforms.deletedAt)).orderBy(asc(platforms.name)),
		db
			.select({ id: artists.id, nickname: artists.nickname, fullName: artists.fullName, profileImageUrl: artists.profileImageUrl })
			.from(artists)
			.where(isNull(artists.deletedAt))
			.orderBy(asc(artists.nickname)),
		db.select({ id: genres.id, name: genres.name }).from(genres).orderBy(asc(genres.name))
	]);
	return { studios: allStudios, platforms: allPlatforms, artists: allArtists, genres: allGenres };
}
