export type HaloComment = {
	id: string;
	author: string;
	body: string;
	time: string;
	reply?: HaloComment;
};

export type MomentApiItem = {
	id: string;
	authorId: string;
	body: string | null;
	sourceUrl: string | null;
	sourceCanonicalUrl?: string | null;
	sourceProvider: 'YOUTUBE' | 'TIKTOK' | 'X' | 'OTHER' | null;
	likeCount: number;
	commentCount: number;
	createdAt: string | Date;
	liked: boolean;
	bookmarked: boolean;
	author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
	media: Array<{ id: string; momentId: string; externalUrl: string | null; altText: string | null; sortOrder: number }>;
	seriesIds: string[];
	artistIds: string[];
	shipIds: string[];
	entityTags?: MomentTag[];
};

export type MomentTag = {
	kind: 'series' | 'artist' | 'ship';
	id: string;
	label: string;
};

export type ProfileMoment = {
	id: string;
	author: string;
	handle: string;
	initial: string;
	avatarUrl: string | null;
	time: string;
	body: string;
	source: string | null;
	provider: 'YouTube' | 'TikTok' | 'X' | 'Link';
	tags: MomentTag[];
	likes: number;
	commentCount: number;
	liked: boolean;
	bookmarked: boolean;
	media: MomentApiItem['media'];
};

function formatMomentTime(value: string | Date, lang: string): string {
	const date = new Date(value);
	const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
	if (Number.isNaN(date.getTime())) return '';
	const locale = lang === 'th' ? 'th-TH' : 'en';
	const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
	if (seconds < 60) return relative.format(-seconds, 'second');
	if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), 'minute');
	if (seconds < 86400) return relative.format(-Math.floor(seconds / 3600), 'hour');
	if (seconds < 604800) return relative.format(-Math.floor(seconds / 86400), 'day');
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function toProfileMoment(moment: MomentApiItem, lang = 'th'): ProfileMoment {
	const author = moment.author.displayName?.trim() || moment.author.username || 'ผู้ใช้ Halo';
	const provider = ({ YOUTUBE: 'YouTube', TIKTOK: 'TikTok', X: 'X', OTHER: 'Link' } as const)[moment.sourceProvider ?? 'OTHER'];
	return {
		id: moment.id,
		author,
		handle: moment.author.username,
		initial: author.trim().charAt(0).toUpperCase() || '✦',
		avatarUrl: moment.author.avatarUrl,
		time: formatMomentTime(moment.createdAt, lang),
		body: moment.body ?? '',
		source: moment.sourceUrl ?? moment.sourceCanonicalUrl ?? null,
		provider,
		tags: moment.entityTags ?? [
			...moment.seriesIds.map((id) => ({ kind: 'series' as const, id, label: id })),
			...moment.artistIds.map((id) => ({ kind: 'artist' as const, id, label: id })),
			...moment.shipIds.map((id) => ({ kind: 'ship' as const, id, label: id }))
		],
		likes: Number(moment.likeCount) || 0,
		commentCount: Number(moment.commentCount) || 0,
		liked: Boolean(moment.liked),
		bookmarked: Boolean(moment.bookmarked),
		media: moment.media
	};
}
