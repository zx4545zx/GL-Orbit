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
	service: 's3'
});

export function generateImageKey(type: 'posters' | 'profiles', ext: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).slice(2, 10);
	return `images/${type}/${timestamp}-${random}.${ext}`;
}

export async function uploadImage(
	file: File,
	type: 'posters' | 'profiles'
): Promise<{ url: string; key: string }> {
	if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
		throw new Error('Cloudflare R2 is not configured');
	}

	const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	if (!allowedTypes.includes(file.type)) {
		throw new Error('ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP, GIF)');
	}

	const maxSize = 5 * 1024 * 1024;
	if (file.size > maxSize) {
		throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');
	}

	const extByType: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif'
	};
	const ext = extByType[file.type] ?? 'jpg';
	const key = generateImageKey(type, ext);
	const objectUrl = `${endpoint}/${bucketName}/${key}`;

	const signed = await aws.sign(objectUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
			'Content-Length': String(file.size),
			'x-amz-acl': 'public-read'
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
