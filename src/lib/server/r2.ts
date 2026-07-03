import 'dotenv/config';
import { AwsClient } from 'aws4fetch';

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

export function generateImageKey(type: 'posters' | 'profiles', ext: string): string {
	return `images/${type}/${crypto.randomUUID()}.${ext}`;
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

export async function uploadImage(
	file: File,
	type: 'posters' | 'profiles'
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

	const baseEndpoint = endpoint.replace(/\/+$/, '');
	const objectBase = baseEndpoint.endsWith(`/${bucketName}`) ? baseEndpoint : `${baseEndpoint}/${bucketName}`;
	const key = generateImageKey(type, detected.ext);
	const objectUrl = `${objectBase}/${key}`;

	const signed = await aws.sign(objectUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': detected.mime
		}
	});

	const res = await fetch(signed);
	if (!res.ok) {
		const text = await res.text().catch(() => 'Unknown error');
		throw new Error(`Upload failed: ${res.status} ${text}`);
	}

	const basePublicUrl = publicUrl.replace(/\/$/, '');
	return { url: `${basePublicUrl}/${key}`, key };
}
