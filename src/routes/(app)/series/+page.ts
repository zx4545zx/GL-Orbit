import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ url, fetch }) => {
	const search = url.searchParams.get('search') ?? '';
	type FilterKey = 'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED';
	const status: FilterKey = (url.searchParams.get('status')?.toUpperCase() ?? 'ALL') as FilterKey;

	const params = new URLSearchParams();
	if (search) params.set('search', search);
	if (status !== 'ALL') params.set('status', status.toLowerCase());

	const query = params.toString();
	const apiUrl = query ? `/api/series?${query}` : '/api/series';

	const res = await fetch(apiUrl);
	if (!res.ok) {
		return {
			series: { items: [], total: 0, page: 1, totalPages: 0 },
			filters: { search, status },
			meta: {
				title: 'ซีรีส์ทั้งหมด | GL-Orbit',
				description: 'รวบรวมซีรีส์ GL จากทุกสตูดิโอ',
				robots: 'index, follow',
				canonicalPath: 'https://gl-orbit.vercel.app/series',
				ogTitle: 'ซีรีส์ทั้งหมด | GL-Orbit',
				ogDescription: 'รวบรวมซีรีส์ GL จากทุกสตูดิโอ',
				jsonLd: '{}'
			}
		};
	}

	const series = await res.json();

	return {
		series,
		filters: { search, status },
		meta: {
			title: 'ซีรีส์ทั้งหมด | GL-Orbit',
			description: 'รวบรวมซีรีส์ GL จากทุกสตูดิโอ',
			robots: 'index, follow',
			canonicalPath: 'https://gl-orbit.vercel.app/series',
			ogTitle: 'ซีรีส์ทั้งหมด | GL-Orbit',
			ogDescription: 'รวบรวมซีรีส์ GL จากทุกสตูดิโอ',
			jsonLd: '{}'
		}
	};
};
