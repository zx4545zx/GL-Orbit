export type EmbedProvider = 'YOUTUBE' | 'TIKTOK' | 'X' | 'OTHER';

export type ResolvedEmbed = {
	provider: EmbedProvider;
	canonicalUrl: string;
	externalId?: string;
	status: 'READY' | 'FALLBACK' | 'FAILED';
	metadata: { title?: string; authorName?: string; thumbnailUrl?: string; thumbnailExpiresAt?: string; providerName?: string };
};
