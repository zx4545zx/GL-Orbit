import { describe, expect, it } from 'vitest';
import { decryptAiCredential, encryptAiCredential } from './crypto.js';

const env = { AI_PROVIDER_ENCRYPTION_KEY: 'a'.repeat(64) };
describe('AI credential encryption', () => {
	it('round trips without serializing plaintext', () => {
		const encrypted = encryptAiCredential('secret-key', 'ai-provider:user:config:v2', env);
		expect(encrypted).not.toContain('secret-key');
		expect(JSON.stringify({ encrypted })).not.toContain('secret-key');
		expect(decryptAiCredential(encrypted, 'ai-provider:user:config:v2', env)).toBe('secret-key');
	});
	it('rejects corruption and wrong owner binding', () => {
		const encrypted = encryptAiCredential('secret-key', 'ai-provider:user:config:v2', env);
		expect(() => decryptAiCredential(encrypted, 'ai-provider:other:config:v2', env)).toThrow();
		expect(() => decryptAiCredential('v1.bad.bad.bad', undefined, env)).toThrow();
	});
});
