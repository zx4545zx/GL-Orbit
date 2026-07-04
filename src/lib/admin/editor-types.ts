export type SeriesStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';

export interface StudioRef {
	id: string;
	name: string;
}
export interface PlatformRef {
	id: string;
	name: string;
	logoUrl: string | null;
	baseUrl: string | null;
}
export interface ArtistRef {
	id: string;
	nickname: string;
	fullNameTh: string | null;
	fullNameEn: string;
	profileImageUrl: string | null;
}
export interface GenreRef {
	id: string;
	name: string;
}

export interface ReferenceData {
	studios: StudioRef[];
	platforms: PlatformRef[];
	artists: ArtistRef[];
	genres: GenreRef[];
}

export interface SeriesCore {
	id: string;
	titleEn: string;
	titleTh: string | null;
	descriptionTh: string | null;
	descriptionEn: string | null;
	posterUrl: string | null;
	coverUrl: string | null;
	status: SeriesStatus;
	studioId: string | null;
}

export interface CastMember extends ArtistRef {
	roleName: string | null;
}

export interface EpisodeSchedule {
	id: string;
	episodeId: string;
	platformId: string;
	platformName: string;
	airDate: string; // ISO format (yyyy-mm-ddThh:mm:ss.sssZ)
	streamLink: string | null;
	isUncut: boolean;
}

export interface Episode {
	id: string;
	episodeNumber: number;
	title: string | null;
	coverUrl: string | null;
	trailerUrl: string | null;
	schedules: EpisodeSchedule[];
}

export interface WeeklySchedule {
	id: string;
	platformId: string;
	platformName: string;
	dayOfWeek: number; // 0=Sun ... 6=Sat
	airTime: string; // HH:MM:SS
	isUncut: boolean;
}

export interface SeriesGalleryImage {
	id: string;
	seriesId: string;
	imageUrl: string;
	caption: string | null;
	sortOrder: number;
	createdAt: Date;
}

export interface SeriesFull {
	series: SeriesCore;
	studio: StudioRef | null;
	genres: GenreRef[];
	artists: CastMember[];
	gallery: SeriesGalleryImage[];
	episodes: Episode[];
	schedules: WeeklySchedule[];
}

export interface ApiResult<T = unknown> {
	ok: boolean;
	data?: T;
	error?: string;
}
