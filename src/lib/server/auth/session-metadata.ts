import { isIP } from 'node:net';

export type SessionDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface SessionMetadata {
	browser: string | null;
	operatingSystem: string | null;
	deviceType: SessionDeviceType;
	maskedIp: string | null;
	city: string | null;
	countryCode: string | null;
}

const EMPTY_METADATA: SessionMetadata = {
	browser: null,
	operatingSystem: null,
	deviceType: 'unknown',
	maskedIp: null,
	city: null,
	countryCode: null
};

function ipv6Prefix(value: string): string {
	const [left = '', right = ''] = value.toLowerCase().split('::');
	const leftParts = left ? left.split(':') : [];
	const rightParts = right ? right.split(':') : [];
	const missingParts = Math.max(0, 8 - leftParts.length - rightParts.length);
	const parts = value.includes('::')
		? [...leftParts, ...Array<string>(missingParts).fill('0'), ...rightParts]
		: leftParts;

	return `${parts.slice(0, 3).map((part) => part || '0').join(':')}::/48`;
}

export function maskIpAddress(value: string): string | null {
	const address = value.trim();
	const version = isIP(address);

	if (version === 4) {
		const octets = address.split('.');
		return `${octets.slice(0, 3).join('.')}.xxx`;
	}

	if (version === 6) return ipv6Prefix(address);
	return null;
}

export function classifyUserAgent(
	value: string | null
): Pick<SessionMetadata, 'browser' | 'operatingSystem' | 'deviceType'> {
	if (!value) {
		return {
			browser: EMPTY_METADATA.browser,
			operatingSystem: EMPTY_METADATA.operatingSystem,
			deviceType: EMPTY_METADATA.deviceType
		};
	}

	let browser: string | null = null;
	if (/Edg\//.test(value)) browser = 'Edge';
	else if (/(?:Chrome|CriOS)\//.test(value)) browser = 'Chrome';
	else if (/(?:Firefox|FxiOS)\//.test(value)) browser = 'Firefox';
	else if (/Safari\//.test(value)) browser = 'Safari';

	let operatingSystem: string | null = null;
	if (/(?:iPhone|iPad|iPod)/.test(value)) operatingSystem = 'iOS';
	else if (/Android/.test(value)) operatingSystem = 'Android';
	else if (/Windows/.test(value)) operatingSystem = 'Windows';
	else if (/(?:Macintosh|Mac OS X)/.test(value)) operatingSystem = 'macOS';
	else if (/Linux/.test(value)) operatingSystem = 'Linux';

	let deviceType: SessionDeviceType = 'desktop';
	if (/(?:iPad|Tablet)/i.test(value) || (/Android/i.test(value) && !/Mobile/i.test(value))) {
		deviceType = 'tablet';
	} else if (/(?:iPhone|iPod|Mobile|Android)/i.test(value)) {
		deviceType = 'mobile';
	}

	return { browser, operatingSystem, deviceType };
}

function normalizeCity(value: string | null): string | null {
	if (!value) return null;

	try {
		const sanitized = decodeURIComponent(value)
			.replace(/[\u0000-\u001F\u007F]/g, '')
			.trim()
			.slice(0, 100);
		return sanitized || null;
	} catch {
		return null;
	}
}

function normalizeCountryCode(value: string | null): string | null {
	if (!value || !/^[A-Za-z]{2}$/.test(value)) return null;
	return value.toUpperCase();
}

export function collectSessionMetadata(
	request: Request,
	getClientAddress: () => string
): SessionMetadata {
	const classified = classifyUserAgent(request.headers.get('user-agent'));
	let maskedIp: string | null = null;

	try {
		maskedIp = maskIpAddress(getClientAddress());
	} catch {
		// Metadata collection must never prevent authentication.
	}

	return {
		...classified,
		maskedIp,
		city: normalizeCity(request.headers.get('x-vercel-ip-city')),
		countryCode: normalizeCountryCode(request.headers.get('x-vercel-ip-country'))
	};
}
