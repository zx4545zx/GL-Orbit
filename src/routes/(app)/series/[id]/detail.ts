/**
 * Client-side fetch module for series detail page.
 */

export type SeriesDetail = {
	id: string;
	titleEn: string;
	titleTh: string;
	status: 'UPCOMING' | 'ONGOING' | 'ENDED';
	studio: string;
	poster: string;
	description: string;
	genres: string[];
	episodes: number;
	year?: number;
	platforms: { name: string; logo: string | null }[];
	artists: { id: string; name: string; role: string; image: string }[];
	schedule: {
		episode: number;
		title: string;
		schedules: { airDate: string; platform: string; platformLogo: string | null; streamLink: string | null }[];
	}[];
};

export async function fetchSeriesDetail(id: string, fetcher: typeof fetch = fetch): Promise<SeriesDetail | null> {
	const res = await fetcher(`/api/series/${id}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลซีรีส์ได้');
	const data = await res.json();
	return data.series ?? null;
}
