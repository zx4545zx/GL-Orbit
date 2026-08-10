import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const blockedNames = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal', 'metadata.aws.internal']);

function ipv4Number(address: string) { return address.split('.').reduce((value, octet) => (value << 8) + Number(octet), 0) >>> 0; }
function ipv4In(address: string, base: string, bits: number) { const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0; return (ipv4Number(address) & mask) === (ipv4Number(base) & mask); }
function ipv6Number(address: string) {
	const [left, right = ''] = address.toLowerCase().split('::');
	const leftParts = left ? left.split(':') : []; const rightParts = right ? right.split(':') : [];
	const parts = [...leftParts, ...Array.from({ length: 8 - leftParts.length - rightParts.length }, () => '0'), ...rightParts];
	return parts.reduce((value, part) => (value << 16n) + BigInt(`0x${part || '0'}`), 0n);
}
function ipv6In(address: string, base: string, bits: number) { const shift = BigInt(128 - bits); return (ipv6Number(address) >> shift) === (ipv6Number(base) >> shift); }

export function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return ![
		['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]
	].some(([base, bits]) => ipv4In(address, base as string, bits as number));
	if (family === 6) {
		if (address.toLowerCase().startsWith('::ffff:')) return isPublicAddress(address.slice(7));
		return ![['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['2001:db8::', 32], ['2002::', 16]].some(([base, bits]) => ipv6In(address, base as string, bits as number));
	}
	return false;
}

export function validateProviderBaseUrl(value: unknown): string {
	if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2048) throw new Error('A public HTTPS base URL is required. Local Ollama cannot be used from the hosted server.');
	let url: URL;
	try { url = new URL(value.trim()); } catch { throw new Error('Base URL is invalid'); }
	const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
	if (url.protocol !== 'https:' || url.username || url.password || url.port || blockedNames.has(host) || host.endsWith('.local') || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('Base URL must use a public HTTPS endpoint. Local Ollama cannot be used from the hosted server.');
	if (isIP(host) && !isPublicAddress(host)) throw new Error('Base URL must not target a private, local, or reserved address.');
	return url.toString().replace(/\/$/, '');
}

export async function resolvePublicProviderHost(url: string): Promise<{ address: string; family: 4 | 6 }> {
	const host = new URL(validateProviderBaseUrl(url)).hostname.replace(/^\[|\]$/g, '');
	if (isIP(host)) {
		if (!isPublicAddress(host)) throw new Error('Provider host is not public');
		return { address: host, family: isIP(host) as 4 | 6 };
	}
	const addresses = await lookup(host, { all: true, verbatim: true });
	if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) throw new Error('Provider host does not resolve to public addresses');
	const first = addresses[0];
	return { address: first.address, family: first.family as 4 | 6 };
}
