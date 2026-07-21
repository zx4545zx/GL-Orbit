import { describe, expect, it } from 'vitest';
import {
	classifyUserAgent,
	collectSessionMetadata,
	maskIpAddress
} from './session-metadata.js';

const CHROME_WINDOWS =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

describe('maskIpAddress', () => {
	it('masks valid IPv4 and IPv6 addresses before persistence', () => {
		expect(maskIpAddress('203.0.113.42')).toBe('203.0.113.xxx');
		expect(maskIpAddress('2001:db8:85a3:8d3::1')).toBe('2001:db8:85a3::/48');
	});

	it('rejects malformed addresses', () => {
		expect(maskIpAddress('not-an-ip')).toBeNull();
		expect(maskIpAddress('999.0.0.1')).toBeNull();
	});
});

describe('classifyUserAgent', () => {
	it('normalizes browser, operating system, and device type', () => {
		expect(classifyUserAgent(CHROME_WINDOWS)).toEqual({
			browser: 'Chrome',
			operatingSystem: 'Windows',
			deviceType: 'desktop'
		});
		expect(classifyUserAgent(SAFARI_IPHONE)).toEqual({
			browser: 'Safari',
			operatingSystem: 'iOS',
			deviceType: 'mobile'
		});
	});

	it('returns safe unknown values when no user agent is available', () => {
		expect(classifyUserAgent(null)).toEqual({
			browser: null,
			operatingSystem: null,
			deviceType: 'unknown'
		});
	});
});

describe('collectSessionMetadata', () => {
	it('decodes and sanitizes trusted deployment location headers', () => {
		const request = new Request('https://example.com/login', {
			headers: {
				'user-agent': CHROME_WINDOWS,
				'x-vercel-ip-city': `${encodeURIComponent('Bangkok')}%00${'x'.repeat(120)}`,
				'x-vercel-ip-country': 'th'
			}
		});

		const metadata = collectSessionMetadata(request, () => '203.0.113.42');

		expect(metadata).toEqual({
			browser: 'Chrome',
			operatingSystem: 'Windows',
			deviceType: 'desktop',
			maskedIp: '203.0.113.xxx',
			city: `Bangkok${'x'.repeat(93)}`,
			countryCode: 'TH'
		});
		expect(metadata.city).toHaveLength(100);
	});

	it('uses nullable fallbacks when request metadata is unavailable', () => {
		const request = new Request('https://example.com/login', {
			headers: {
				'x-vercel-ip-city': '%E0%A4%A',
				'x-vercel-ip-country': 'Thailand'
			}
		});

		expect(
			collectSessionMetadata(request, () => {
				throw new Error('address unavailable');
			})
		).toEqual({
			browser: null,
			operatingSystem: null,
			deviceType: 'unknown',
			maskedIp: null,
			city: null,
			countryCode: null
		});
	});
});
