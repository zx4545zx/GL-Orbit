export const MAX_MOMENT_IMAGES = 4;

export const momentReportReasons = [
	'SPAM',
	'HARASSMENT',
	'INAPPROPRIATE',
	'COPYRIGHT',
	'MISLEADING',
	'OTHER'
] as const;

export type MomentReportReason = (typeof momentReportReasons)[number];

export type MomentCursor = {
	createdAt: string;
	id: string;
};

export type MomentVisibility = 'PUBLISHED' | 'HIDDEN' | 'DELETED';

export type ResolvedEmbed = {
	provider: 'YOUTUBE' | 'TIKTOK' | 'X' | 'OTHER';
	canonicalUrl: string;
	externalId?: string;
	status: 'READY' | 'FALLBACK' | 'FAILED';
	metadata: {
		title?: string;
		authorName?: string;
		thumbnailUrl?: string;
		providerName?: string;
	};
};

export function isMomentReportReason(value: unknown): value is MomentReportReason {
	return typeof value === 'string' && momentReportReasons.includes(value as MomentReportReason);
}
