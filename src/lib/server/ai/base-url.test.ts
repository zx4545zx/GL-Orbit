import { describe, expect, it } from 'vitest';
import { isPublicAddress, resolvePublicProviderHost, validateProviderBaseUrl } from './base-url.js';
describe('custom AI base URL validation', () => {
	it('accepts public HTTPS endpoints', () => expect(validateProviderBaseUrl('https://api.example.com/v1/')).toBe('https://api.example.com/v1'));
	it.each(['http://api.example.com', 'https://localhost:11434', 'https://127.0.0.1', 'https://10.0.0.1', 'https://[::1]', 'https://user:pass@example.com'])('blocks unsafe targets: %s', (url) => expect(() => validateProviderBaseUrl(url)).toThrow());
	it.each(['127.1.2.3', '169.254.169.254', '192.0.2.1', '198.18.0.1', '224.0.0.1', '::1', 'fc00::1', 'fe80::1', 'ff02::1', '2001:db8::1'])('rejects non-public address %s', (address) => expect(isPublicAddress(address)).toBe(false));
	it('pins numeric public endpoint resolution', async () => await expect(resolvePublicProviderHost('https://1.1.1.1')).resolves.toEqual({ address: '1.1.1.1', family: 4 }));
});
