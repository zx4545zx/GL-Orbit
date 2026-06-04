/**
 * Client-side fetch module for series detail page.
 */

export async function fetchSeriesDetail(id: string): Promise<unknown> {
	const res = await fetch(`/api/series/${id}`);
	const data = await res.json();
	return data.series ?? null;
}
