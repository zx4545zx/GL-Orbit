import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export class AiCredentialError extends Error {}

function encryptionKey(env: Record<string, string | undefined> = process.env): Buffer {
	const raw = env.AI_PROVIDER_ENCRYPTION_KEY?.trim();
	if (!raw) throw new AiCredentialError('AI provider encryption is not configured');
	const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
	const canonicalBase64 = key.toString('base64').replace(/=+$/, '');
	if (key.length !== 32 || (!/^[a-f0-9]{64}$/i.test(raw) && canonicalBase64 !== raw.replace(/=+$/, ''))) throw new AiCredentialError('AI provider encryption configuration is invalid');
	return key;
}

export function encryptAiCredential(value: string, binding: string, env?: Record<string, string | undefined>): string {
	if (!value) throw new AiCredentialError('Credential is required');
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, encryptionKey(env), iv);
	cipher.setAAD(Buffer.from(binding, 'utf8'));
	const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `v2.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptAiCredential(payload: string, binding?: string, env?: Record<string, string | undefined>): string {
	const [version, ivText, tagText, dataText, ...extra] = payload.split('.');
	if ((version !== 'v1' && version !== 'v2') || !ivText || !tagText || !dataText || extra.length || (version === 'v2' && !binding)) throw new AiCredentialError('Stored credential is invalid');
	try {
		const decipher = createDecipheriv(ALGORITHM, encryptionKey(env), Buffer.from(ivText, 'base64url'));
		if (version === 'v2') decipher.setAAD(Buffer.from(binding!, 'utf8'));
		decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
		return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
	} catch {
		throw new AiCredentialError('Stored credential cannot be decrypted');
	}
}
