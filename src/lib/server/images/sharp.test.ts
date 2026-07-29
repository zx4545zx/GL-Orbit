import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { generateVariants } from './sharp.js';

// synthetic 2000x2000 jpeg — no fixture file needed
async function synthInput(): Promise<Buffer> {
	return sharp({ create: { width: 2000, height: 2000, channels: 3, background: '#ff6b9d' } })
		.jpeg()
		.toBuffer();
}

describe('generateVariants', () => {
	it('produces every width×format for posters', async () => {
		const variants = await generateVariants(await synthInput(), 'posters');
		// 3 widths × 3 formats = 9
		expect(variants).toHaveLength(9);
		const widths = [...new Set(variants.map((v) => v.width))].sort((a, b) => a - b);
		expect(widths).toEqual([480, 768, 1080]);
		expect(variants.filter((v) => v.ext === 'avif')).toHaveLength(3);
		expect(variants.filter((v) => v.ext === 'webp')).toHaveLength(3);
		expect(variants.filter((v) => v.ext === 'jpg')).toHaveLength(3);
	});

	it('produces exactly six new cover outputs without 1800 variants', async () => {
		const variants = await generateVariants(await synthInput(), 'covers');
		expect(variants).toHaveLength(6);
		expect([...new Set(variants.map((v) => v.width))]).toEqual([960, 1440]);
		expect(variants.some((v) => v.width === 1800)).toBe(false);
	});

	it.each([
		['portrait JPEG', 60, 180, 'jpeg'],
		['portrait PNG', 60, 180, 'png'],
		['portrait WebP', 60, 180, 'webp'],
		['square JPEG', 80, 80, 'jpeg'],
		['square PNG', 80, 80, 'png'],
		['square WebP', 80, 80, 'webp'],
		['ultra-wide JPEG', 300, 30, 'jpeg'],
		['ultra-wide PNG', 300, 30, 'png'],
		['ultra-wide WebP', 300, 30, 'webp'],
		['very small JPEG', 8, 12, 'jpeg'],
		['very small PNG', 8, 12, 'png'],
		['very small WebP', 8, 12, 'webp']
	] as const)('processes %s covers regardless of source geometry', async (_label, width, height, format) => {
		const input = await sharp({ create: { width, height, channels: 3, background: '#c4b5fd' } })
			.toFormat(format)
			.toBuffer();
		const variants = await generateVariants(input, 'covers');
		expect(variants.map((variant) => variant.width)).toEqual([960, 960, 960, 1440, 1440, 1440]);
	});

	it('rejects bytes that Sharp cannot decode', async () => {
		await expect(generateVariants(Buffer.from('not an image'), 'covers')).rejects.toThrow();
	});

	it('generates exactly the configured widths regardless of source size', async () => {
		const small = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#fff' } })
			.jpeg().toBuffer();
		const variants = await generateVariants(small, 'profiles');
		// widths should be exactly the configured widths, not clamped to source
		expect(variants.map((v) => v.width)).toEqual([320, 320, 320, 640, 640, 640, 1080, 1080, 1080]);
	});

	it('each variant buffer is a valid image of correct format', async () => {
		const variants = await generateVariants(await synthInput(), 'profiles');
		// sharp reports AVIF as its container format 'heif', webp as 'webp', jpg as 'jpeg'
		const expectedFormat = (ext: 'avif' | 'webp' | 'jpg') =>
			ext === 'avif' ? 'heif' : ext === 'jpg' ? 'jpeg' : 'webp';
		for (const v of variants) {
			const meta = await sharp(v.buffer).metadata();
			expect(meta.format).toBe(expectedFormat(v.ext));
		}
	});

});
