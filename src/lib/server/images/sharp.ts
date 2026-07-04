import sharp from 'sharp';
import { IMAGE_VARIANTS, type ImageExt, type ImageType } from '$lib/images/config.js';

export type Variant = { width: number; ext: ImageExt; buffer: Buffer };

export async function generateVariants(input: Buffer, type: ImageType): Promise<Variant[]> {
	const { widths, formats } = IMAGE_VARIANTS[type];
	const variants: Variant[] = [];

	for (const width of widths) {
		for (const ext of formats) {
			const buffer = await encode(
				sharp(input).rotate().resize({ width }),
				ext
			);
			variants.push({ width, ext, buffer });
		}
	}
	return variants;
}

async function encode(img: ReturnType<typeof sharp>, ext: ImageExt): Promise<Buffer> {
	if (ext === 'avif') return img.avif({ quality: 50, effort: 4 }).toBuffer();
	if (ext === 'webp') return img.webp({ quality: 72 }).toBuffer();
	return img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}
