export type ImageType = 'posters' | 'profiles';
export type ImageExt = 'avif' | 'webp' | 'jpg';

export const IMAGE_VARIANTS = {
	posters: { widths: [480, 768, 1080], formats: ['avif', 'webp', 'jpg'] as const, fallback: 1080 },
	profiles: { widths: [320, 640], formats: ['avif', 'webp', 'jpg'] as const, fallback: 640 }
} as const satisfies Record<ImageType, { widths: number[]; formats: readonly ImageExt[]; fallback: number }>;

export type SrcEntry = { url: string; width: number };
export type VariantSet = { avif: SrcEntry[]; webp: SrcEntry[]; jpg: SrcEntry[] };

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// New convention: .../images/{type}/{uuid}/{w}.{ext}
const CANONICAL_RE = new RegExp(`^(.*\\/images)\\/(posters|profiles)\\/(${UUID})\\/\\d+\\.(jpg|png|webp)$`);
// Legacy:        .../images/{type}/{uuid}.{ext}
const LEGACY_RE = new RegExp(`^(.*\\/images)\\/(posters|profiles)\\/(${UUID})\\.(jpg|png|webp)$`);

export function isManagedImageUrl(url: string): boolean {
	return /\/images\/(posters|profiles)\//.test(url);
}

export function isLegacyImageUrl(url: string): boolean {
	return LEGACY_RE.test(url);
}

export function parseLegacyUrl(
	url: string
): { base: string; type: ImageType; uuid: string; ext: ImageExt | 'png' } | null {
	const m = LEGACY_RE.exec(url);
	if (!m) return null;
	const [, base, type, uuid, ext] = m;
	return { base, type: type as ImageType, uuid, ext: ext as ImageExt | 'png' };
}

export function deriveVariantUrls(canonicalUrl: string, type: ImageType): VariantSet | null {
	const m = CANONICAL_RE.exec(canonicalUrl);
	if (!m) return null;
	const [, base, t, uuid] = m;
	if (t !== type) return null;
	const widths = IMAGE_VARIANTS[type].widths;
	const make = (ext: ImageExt): SrcEntry[] =>
		widths.map((w) => ({ url: `${base}/${type}/${uuid}/${w}.${ext}`, width: w }));
	return { avif: make('avif'), webp: make('webp'), jpg: make('jpg') };
}

// --- server-side key/url builders (used by upload + backfill) ---

export function buildVariantKey(type: ImageType, uuid: string, width: number, ext: ImageExt): string {
	return `images/${type}/${uuid}/${width}.${ext}`;
}

export function buildVariantUrl(
	publicBaseUrl: string,
	type: ImageType,
	uuid: string,
	width: number,
	ext: ImageExt
): string {
	return `${publicBaseUrl.replace(/\/$/, '')}/images/${type}/${uuid}/${width}.${ext}`;
}

export function mimeForExt(ext: ImageExt): string {
	return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
}
