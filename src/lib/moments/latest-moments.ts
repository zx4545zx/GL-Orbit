type MomentEntity = 'series' | 'artist' | 'ship';
const filterByEntity: Record<MomentEntity, string> = { series: 'seriesId', artist: 'artistId', ship: 'shipId' };

export function latestMomentsHref(lang: string, entity: MomentEntity, id: string): string {
	return `/${lang}/halo?${new URLSearchParams({ [filterByEntity[entity]]: id })}`;
}
