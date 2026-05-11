import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/lib/server/db/index.js';
import * as schema from '../src/lib/server/db/schema.js';
import { hashPassword } from '../src/lib/server/auth/password.js';

async function seedData() {
	const db = await getDb();

	// ─── Clear existing data (except admin users) ───
	await db.delete(schema.episodeSchedules);
	await db.delete(schema.episodes);
	await db.delete(schema.seriesSchedules);
	await db.delete(schema.seriesArtists);
	await db.delete(schema.series);
	await db.delete(schema.artists);
	await db.delete(schema.platforms);
	await db.delete(schema.studios);
	await db.delete(schema.users).where(eq(schema.users.role, 'USER'));
	console.log('🧹 Cleared existing mock data');

	// ─── Users ───
	const randomPass = (u: string) => u + Math.random().toString(36).slice(2, 8);
	const userData = [
		{ username: 'glfan01', email: 'glfan01@example.com', displayName: 'ติ่ง GL คนที่ 1', role: 'USER' },
		{ username: 'glfan02', email: 'glfan02@example.com', displayName: 'ติ่ง GL คนที่ 2', role: 'USER' },
		{ username: 'freenbecky', email: 'freenbecky@example.com', displayName: 'FreenBecky Lover', role: 'USER' },
		{ username: 'lingorm', email: 'lingorm@example.com', displayName: 'LingOrm Shipper', role: 'USER' },
		{ username: 'milklove', email: 'milklove@example.com', displayName: 'MilkLove Stan', role: 'USER' },
		{ username: 'serieshunter', email: 'hunter@example.com', displayName: 'Series Hunter', role: 'USER' },
		{ username: 'calendarfan', email: 'calendar@example.com', displayName: 'ติ่งตารางฉาย', role: 'USER' },
		{ username: 'emibonnie', email: 'emibonnie@example.com', displayName: 'EmiBonnie Fan', role: 'USER' }
	];
	const users = await db.insert(schema.users).values(
		await Promise.all(userData.map(async (u) => ({
			...u,
			passwordHash: await hashPassword(randomPass(u.username))
		})))
	).returning();
	console.log(`✅ Inserted ${users.length} users`);

	// ─── Studios ───
	const studios = await db.insert(schema.studios).values([
		{ name: 'GMMTV', logoUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop' },
		{ name: 'Idol Factory', logoUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=200&h=200&fit=crop' },
		{ name: '9NAA Production', logoUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=200&fit=crop' },
		{ name: 'WeTV Original', logoUrl: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=200&h=200&fit=crop' },
		{ name: 'GagaOOLala', logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d4?w=200&h=200&fit=crop' }
	]).returning();
	console.log(`✅ Inserted ${studios.length} studios`);

	const studioMap = new Map(studios.map(s => [s.name, s.id]));

	// ─── Platforms ───
	const platforms = await db.insert(schema.platforms).values([
		{ name: 'YouTube', logoUrl: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=200&h=200&fit=crop' },
		{ name: 'iQIYI', logoUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=200&fit=crop' },
		{ name: 'WeTV', logoUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=200&h=200&fit=crop' },
		{ name: 'GagaOOLala', logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d4?w=200&h=200&fit=crop' },
		{ name: 'Viki', logoUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop' }
	]).returning();
	console.log(`✅ Inserted ${platforms.length} platforms`);

	const platformMap = new Map(platforms.map(p => [p.name, p.id]));

	// ─── Artists ───
	const artists = await db.insert(schema.artists).values([
		{ nickname: 'Freen', fullName: 'Sarocha Chankimha', profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
		{ nickname: 'Becky', fullName: 'Rebecca Patricia Armstrong', profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
		{ nickname: 'Lingling', fullName: 'Orm Kornnaphat', profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop' },
		{ nickname: 'Orm', fullName: 'Lingling Sirilak', profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
		{ nickname: 'Milk', fullName: 'Pansa Vosbein', profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
		{ nickname: 'Love', fullName: 'Pattranite Limpatiyaporn', profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop' },
		{ nickname: 'Emi', fullName: 'Bonnie', profileImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop' },
		{ nickname: 'Bonnie', fullName: 'Emi', profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' }
	]).returning();
	console.log(`✅ Inserted ${artists.length} artists`);

	const artistMap = new Map(artists.map(a => [a.nickname, a.id]));

	// ─── Series ───
	const seriesList = await db.insert(schema.series).values([
		{ studioId: studioMap.get('Idol Factory'), titleTh: 'ทฤษฎีสีชมพู', titleEn: 'Gap The Series', status: 'ENDED', posterUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop' },
		{ studioId: studioMap.get('9NAA Production'), titleTh: 'เติมคำว่ารักลงในช่องว่าง', titleEn: 'Blank The Series', status: 'ONGOING', posterUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=600&fit=crop' },
		{ studioId: studioMap.get('GMMTV'), titleTh: 'ใจซ่อนรัก', titleEn: 'The Secret of Us', status: 'ONGOING', posterUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=600&fit=crop' },
		{ studioId: studioMap.get('WeTV Original'), titleTh: 'ฝันอัศจรรย์ของฉัน', titleEn: 'My Marvelous Dream', status: 'ONGOING', posterUrl: 'https://images.unsplash.com/photo-1604076913837-52ab5f7b92b7?w=400&h=600&fit=crop' },
		{ studioId: studioMap.get('GagaOOLala'), titleTh: '24 ชั่วโมงที่มีเธอ', titleEn: '24 Hours', status: 'UPCOMING', posterUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400&h=600&fit=crop' },
		{ studioId: studioMap.get('GMMTV'), titleTh: 'Love Senior', titleEn: 'Love Senior', status: 'ONGOING', posterUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=600&fit=crop' }
	]).returning();
	console.log(`✅ Inserted ${seriesList.length} series`);

	const seriesMap = new Map(seriesList.map(s => [s.titleEn, s.id]));

	// ─── Series Artists ───
	await db.insert(schema.seriesArtists).values([
		{ seriesId: seriesMap.get('Gap The Series'), artistId: artistMap.get('Freen'), roleName: 'Sam' },
		{ seriesId: seriesMap.get('Gap The Series'), artistId: artistMap.get('Becky'), roleName: 'Mon' },
		{ seriesId: seriesMap.get('The Secret of Us'), artistId: artistMap.get('Lingling'), roleName: 'Earn' },
		{ seriesId: seriesMap.get('The Secret of Us'), artistId: artistMap.get('Orm'), roleName: 'Jeerawat' },
		{ seriesId: seriesMap.get('Blank The Series'), artistId: artistMap.get('Milk'), roleName: 'Nueng' },
		{ seriesId: seriesMap.get('Blank The Series'), artistId: artistMap.get('Love'), roleName: 'Auu' },
		{ seriesId: seriesMap.get('My Marvelous Dream'), artistId: artistMap.get('Emi'), roleName: 'Main' },
		{ seriesId: seriesMap.get('My Marvelous Dream'), artistId: artistMap.get('Bonnie'), roleName: 'Lead' },
		{ seriesId: seriesMap.get('Love Senior'), artistId: artistMap.get('Milk'), roleName: 'Gyoz' },
		{ seriesId: seriesMap.get('Love Senior'), artistId: artistMap.get('Love'), roleName: 'Kaning' }
	]);
	console.log(`✅ Inserted series-artists relationships`);

	// ─── Series Schedules ───
	await db.insert(schema.seriesSchedules).values([
		{ seriesId: seriesMap.get('Blank The Series'), platformId: platformMap.get('YouTube'), dayOfWeek: 1, airTime: '20:00', isUncut: true },
		{ seriesId: seriesMap.get('The Secret of Us'), platformId: platformMap.get('iQIYI'), dayOfWeek: 3, airTime: '21:30', isUncut: false },
		{ seriesId: seriesMap.get('My Marvelous Dream'), platformId: platformMap.get('WeTV'), dayOfWeek: 5, airTime: '19:00', isUncut: true },
		{ seriesId: seriesMap.get('24 Hours'), platformId: platformMap.get('GagaOOLala'), dayOfWeek: 5, airTime: '22:00', isUncut: true },
		{ seriesId: seriesMap.get('Love Senior'), platformId: platformMap.get('YouTube'), dayOfWeek: 6, airTime: '20:30', isUncut: false }
	]);
	console.log(`✅ Inserted series schedules`);

	// ─── Episodes ───
	const episodes = await db.insert(schema.episodes).values([
		// Gap The Series (12 EP)
		...Array.from({ length: 12 }, (_, i) => ({
			seriesId: seriesMap.get('Gap The Series'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop'
		})),
		// Blank The Series (6 EP, ongoing)
		...Array.from({ length: 6 }, (_, i) => ({
			seriesId: seriesMap.get('Blank The Series'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=600&fit=crop'
		})),
		// The Secret of Us (8 EP, ongoing)
		...Array.from({ length: 8 }, (_, i) => ({
			seriesId: seriesMap.get('The Secret of Us'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=600&fit=crop'
		})),
		// My Marvelous Dream (4 EP, ongoing)
		...Array.from({ length: 4 }, (_, i) => ({
			seriesId: seriesMap.get('My Marvelous Dream'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1604076913837-52ab5f7b92b7?w=400&h=600&fit=crop'
		})),
		// 24 Hours (upcoming)
		...Array.from({ length: 3 }, (_, i) => ({
			seriesId: seriesMap.get('24 Hours'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400&h=600&fit=crop'
		})),
		// Love Senior (14 EP, ongoing)
		...Array.from({ length: 14 }, (_, i) => ({
			seriesId: seriesMap.get('Love Senior'),
			episodeNumber: i + 1,
			title: `EP.${i + 1}`,
			coverUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=600&fit=crop'
		}))
	]).returning();
	console.log(`✅ Inserted ${episodes.length} episodes`);

	// ─── Episode Schedules (some sample upcoming episodes) ───
	const now = new Date();
	const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	// Helper to get next dayOfWeek
	function getNextDayOfWeek(dayOfWeek: number, offsetWeeks: number = 0) {
		const d = new Date(baseDate);
		const diff = (dayOfWeek + 7 - d.getDay()) % 7;
		d.setDate(d.getDate() + diff + offsetWeeks * 7);
		return d;
	}

	const episodeSchedulesData = [
		// Blank The Series EP.5 (Mon)
		{ seriesTitle: 'Blank The Series', ep: 5, platform: 'YouTube', dayOfWeek: 1, weekOffset: 0, isUncut: true },
		// The Secret of Us EP.8 (Wed)
		{ seriesTitle: 'The Secret of Us', ep: 8, platform: 'iQIYI', dayOfWeek: 3, weekOffset: 0, isUncut: false },
		// My Marvelous Dream EP.3 (Fri)
		{ seriesTitle: 'My Marvelous Dream', ep: 3, platform: 'WeTV', dayOfWeek: 5, weekOffset: 0, isUncut: true },
		// 24 Hours EP.1 (Fri)
		{ seriesTitle: '24 Hours', ep: 1, platform: 'GagaOOLala', dayOfWeek: 5, weekOffset: 1, isUncut: true },
		// Love Senior EP.12 (Sat)
		{ seriesTitle: 'Love Senior', ep: 12, platform: 'YouTube', dayOfWeek: 6, weekOffset: 0, isUncut: false },
		// Blank The Series EP.6 (Mon next week)
		{ seriesTitle: 'Blank The Series', ep: 6, platform: 'YouTube', dayOfWeek: 1, weekOffset: 1, isUncut: true },
		// The Secret of Us EP.9 (Wed next week)
		{ seriesTitle: 'The Secret of Us', ep: 9, platform: 'iQIYI', dayOfWeek: 3, weekOffset: 1, isUncut: false },
	];

	for (const sched of episodeSchedulesData) {
		const seriesId = seriesMap.get(sched.seriesTitle);
		const platformId = platformMap.get(sched.platform);
		const ep = episodes.find(e => e.seriesId === seriesId && e.episodeNumber === sched.ep);
		if (ep && platformId) {
			const airDate = getNextDayOfWeek(sched.dayOfWeek, sched.weekOffset);
			await db.insert(schema.episodeSchedules).values({
				episodeId: ep.id,
				platformId,
				airDate,
				isUncut: sched.isUncut
			});
		}
	}
	console.log(`✅ Inserted episode schedules`);

	console.log('\n🎉 Mock data seeded successfully!');
}

seedData().catch((err) => {
	console.error('❌ Failed to seed data:', err);
	process.exit(1);
});
