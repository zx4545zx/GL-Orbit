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

	it('respects withoutEnlargement when source smaller than requested', async () => {
		const small = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#fff' } })
			.jpeg().toBuffer();
		const variants = await generateVariants(small, 'profiles');
		// source 400px → all requested (320, 640) clamp to ≤400; 640 becomes 400
		const widths = [...new Set(variants.map((v) => v.width))].sort((a, b) => a - b);
		expect(widths[widths.length - 1]).toBeLessThanOrEqual(400);
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
