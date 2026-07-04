import 'dotenv/config';
import { AwsClient } from 'aws4fetch';
import { generateVariants } from './images/sharp.js';
import {
	IMAGE_VARIANTS,
	buildVariantKey,
	buildVariantUrl,
	mimeForExt,
	type ImageExt,
	type ImageType
} from '$lib/images/config.js';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const aws = new AwsClient({
	accessKeyId: accessKeyId ?? '',
	secretAccessKey: secretAccessKey ?? '',
	service: 's3',
	region: 'auto'
});

export class ImageUploadValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageUploadValidationError';
	}
}

async function detectImage(file: File): Promise<{ mime: string; ext: string } | null> {
	const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { mime: 'image/jpeg', ext: 'jpg' };
	}

	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return { mime: 'image/png', ext: 'png' };
	}

	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return { mime: 'image/webp', ext: 'webp' };
	}

	return null;
}

function objectBaseEndpoint(): string {
	const baseEndpoint = endpoint!.replace(/\/+$/, '');
	return baseEndpoint.endsWith(`/${bucketName}`)
		? baseEndpoint
		: `${baseEndpoint}/${bucketName}`;
}

/** PUT a single object to R2 with immutable cache headers. Exported for backfill reuse. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
	if (!endpoint || !bucketName) throw new Error('Cloudflare R2 is not configured');

	const objectUrl = `${objectBaseEndpoint()}/${key}`;
	// Wrap in a fresh ArrayBuffer-backed Uint8Array so it satisfies DOM `BodyInit`
	// (node's Buffer<ArrayBufferLike> doesn't match BufferSource under TS 5.8 libs).
	const bodyView = new Uint8Array(body);
	const signed = await aws.sign(objectUrl, {
		method: 'PUT',
		body: bodyView,
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});

	const res = await fetch(signed);
	if (!res.ok) {
		const text = await res.text().catch(() => 'Unknown error');
		throw new Error(`Upload failed: ${res.status} ${text}`);
	}
}

/** HEAD an object to check existence (used by backfill for idempotency). */
export async function objectExists(key: string): Promise<boolean> {
	if (!endpoint || !bucketName) return false;
	const objectUrl = `${objectBaseEndpoint()}/${key}`;
	const signed = await aws.sign(objectUrl, { method: 'HEAD' });
	const res = await fetch(signed);
	return res.ok;
}

export async function uploadImage(
	file: File,
	type: ImageType
): Promise<{ url: string; key: string }> {
	if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
		throw new Error('Cloudflare R2 is not configured');
	}

	const detected = await detectImage(file);
	if (!detected) {
		throw new ImageUploadValidationError('ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP)');
	}

	const maxSize = 4 * 1024 * 1024;
	if (file.size > maxSize) {
		throw new ImageUploadValidationError('ไฟล์ต้องมีขนาดไม่เกิน 4 MB');
	}

	const input = Buffer.from(await file.arrayBuffer());
	const variants = await generateVariants(input, type);
	const id = crypto.randomUUID();

	// PUT all variants in parallel (variant keys are content-addressed by uuid → immutable)
	await Promise.all(
		variants.map((v) => putObject(buildVariantKey(type, id, v.width, v.ext), v.buffer, mimeForExt(v.ext)))
	);

	const fallback = IMAGE_VARIANTS[type].fallback;
	const canonicalKey = buildVariantKey(type, id, fallback, 'jpg');
	const canonicalUrl = buildVariantUrl(publicUrl, type, id, fallback, 'jpg');
	return { url: canonicalUrl, key: canonicalKey };
}
