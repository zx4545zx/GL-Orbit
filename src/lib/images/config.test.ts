import { describe, it, expect } from 'vitest';
import {
	IMAGE_VARIANTS,
	isLegacyImageUrl,
	isManagedImageUrl,
	deriveVariantUrls,
	getCoverDimensionError,
	parseLegacyUrl
} from './config.js';

const BASE = 'https://cdn.example.com/images';
const UUID = '11111111-2222-3333-4444-555555555555';

describe('isLegacyImageUrl', () => {
	it('true for old single-file key', () => {
		expect(isLegacyImageUrl(`${BASE}/posters/${UUID}.jpg`)).toBe(true);
	});
	it('false for new convention', () => {
		expect(isLegacyImageUrl(`${BASE}/posters/${UUID}/1080.jpg`)).toBe(false);
	});
	it('false for external url', () => {
		expect(isLegacyImageUrl('https://imgur.com/abc.png')).toBe(false);
	});
});

describe('isManagedImageUrl', () => {
	it('true for any supported managed image path', () => {
		expect(isManagedImageUrl(`${BASE}/profiles/${UUID}/640.jpg`)).toBe(true);
		expect(isManagedImageUrl(`${BASE}/posters/${UUID}.jpg`)).toBe(true);
		expect(isManagedImageUrl(`${BASE}/covers/${UUID}/1800.jpg`)).toBe(true);
		expect(isManagedImageUrl(`${BASE}/moments/${UUID}/1080.jpg`)).toBe(true);
	});
	it('false for external', () => {
		expect(isManagedImageUrl('https://example.com/foo.jpg')).toBe(false);
	});
});

describe('deriveVariantUrls', () => {
	const canonical = `${BASE}/posters/${UUID}/1080.jpg`;

	it('returns entries ordered by widths for each format', () => {
		const v = deriveVariantUrls(canonical, 'posters');
		expect(v).not.toBeNull();
		expect(v!.avif.map((e) => e.width)).toEqual([480, 768, 1080]);
		expect(v!.avif[0]).toEqual({ url: `${BASE}/posters/${UUID}/480.avif`, width: 480 });
		expect(v!.webp.map((e) => e.width)).toEqual([480, 768, 1080]);
		expect(v!.jpg.map((e) => e.width)).toEqual([480, 768, 1080]);
	});

	it('null for legacy url', () => {
		expect(deriveVariantUrls(`${BASE}/posters/${UUID}.jpg`, 'posters')).toBeNull();
	});

	it('null for external url', () => {
		expect(deriveVariantUrls('https://imgur.com/abc.jpg', 'posters')).toBeNull();
	});

	it('handles profiles type', () => {
		const v = deriveVariantUrls(`${BASE}/profiles/${UUID}/640.jpg`, 'profiles');
		expect(v!.avif.map((e) => e.width)).toEqual([320, 640]);
	});

	it('handles moments type', () => {
		const v = deriveVariantUrls(`${BASE}/moments/${UUID}/1080.jpg`, 'moments');
		expect(v!.avif.map((e) => e.width)).toEqual([480, 1080]);
		expect(v!.webp.map((e) => e.url)).toEqual([`${BASE}/moments/${UUID}/480.webp`, `${BASE}/moments/${UUID}/1080.webp`]);
		expect(v!.jpg.map((e) => e.url)).toEqual([`${BASE}/moments/${UUID}/480.jpg`, `${BASE}/moments/${UUID}/1080.jpg`]);
	});

	it('handles covers type', () => {
		const v = deriveVariantUrls(`${BASE}/covers/${UUID}/1800.jpg`, 'covers');
		expect(v!.avif.map((e) => e.width)).toEqual([960, 1440, 1800]);
		expect(v!.jpg.at(-1)?.url).toBe(`${BASE}/covers/${UUID}/1800.jpg`);
	});

	it('does not derive cover variants from an old poster-path cover', () => {
		expect(deriveVariantUrls(`${BASE}/posters/${UUID}/1080.jpg`, 'covers')).toBeNull();
	});
});

describe('getCoverDimensionError', () => {
	it('accepts high-resolution landscape cover ratios', () => {
		expect(getCoverDimensionError(1915, 1077)).toBeNull();
		expect(getCoverDimensionError(2880, 1200)).toBeNull();
	});

	it('rejects undersized and incorrectly shaped covers', () => {
		expect(getCoverDimensionError(1799, 1011)).toContain('1800 px');
		expect(getCoverDimensionError(1800, 2200)).toContain('16:9');
		expect(getCoverDimensionError(1800, 600)).toContain('16:9');
	});
});

describe('parseLegacyUrl', () => {
	it('extracts base, type, uuid, ext', () => {
		const p = parseLegacyUrl(`${BASE}/posters/${UUID}.webp`);
		expect(p).toEqual({ base: BASE, type: 'posters', uuid: UUID, ext: 'webp' });
	});
	it('null for new convention', () => {
		expect(parseLegacyUrl(`${BASE}/posters/${UUID}/1080.jpg`)).toBeNull();
	});
	it('null for external', () => {
		expect(parseLegacyUrl('https://imgur.com/abc.jpg')).toBeNull();
	});
});

describe('IMAGE_VARIANTS', () => {
	it('has expected widths and fallback', () => {
		expect(IMAGE_VARIANTS.posters.widths).toEqual([480, 768, 1080]);
		expect(IMAGE_VARIANTS.posters.fallback).toBe(1080);
		expect(IMAGE_VARIANTS.covers.widths).toEqual([960, 1440, 1800]);
		expect(IMAGE_VARIANTS.covers.fallback).toBe(1800);
		expect(IMAGE_VARIANTS.profiles.widths).toEqual([320, 640]);
		expect(IMAGE_VARIANTS.profiles.fallback).toBe(640);
		expect(IMAGE_VARIANTS.moments.widths).toEqual([480, 1080]);
		expect(IMAGE_VARIANTS.moments.fallback).toBe(1080);
	});
});
