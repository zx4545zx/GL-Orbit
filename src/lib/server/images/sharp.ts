import sharp from 'sharp';
import { IMAGE_VARIANTS, type ImageExt, type ImageType } from '$lib/images/config.js';

export type Variant = { width: number; ext: ImageExt; buffer: Buffer };

export async function generateVariants(input: Buffer, type: ImageType): Promise<Variant[]> {
	const { widths, formats } = IMAGE_VARIANTS[type];
	const variants: Variant[] = [];

	for (const width of widths) {
		for (const ext of formats) {
			const buffer = await encode(
				sharp(input).rotate().resize({ width, withoutEnlargement: type === 'covers' }),
				ext,
				type
			);
			variants.push({ width, ext, buffer });
		}
	}
	return variants;
}

export async function getOrientedImageDimensions(input: Buffer): Promise<{ width: number; height: number }> {
	const metadata = await sharp(input).metadata();
	if (!metadata.width || !metadata.height) return { width: 0, height: 0 };

	const swapsAxes = metadata.orientation !== undefined && metadata.orientation >= 5 && metadata.orientation <= 8;
	return swapsAxes
		? { width: metadata.height, height: metadata.width }
		: { width: metadata.width, height: metadata.height };
}

async function encode(img: ReturnType<typeof sharp>, ext: ImageExt, type: ImageType): Promise<Buffer> {
	const cover = type === 'covers';
	if (ext === 'avif') return img.avif({ quality: cover ? 62 : 50, effort: 4 }).toBuffer();
	if (ext === 'webp') return img.webp({ quality: cover ? 82 : 72 }).toBuffer();
	return img.jpeg({ quality: cover ? 86 : 80, mozjpeg: true }).toBuffer();
}
