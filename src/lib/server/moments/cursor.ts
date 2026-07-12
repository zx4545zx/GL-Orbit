import type { MomentCursor } from './types.js';

export function encodeCursor(cursor: MomentCursor): string {
	return Buffer.from(JSON.stringify({ v: 1, ...cursor })).toString('base64url');
}

export function decodeCursor(value: string): MomentCursor | null {
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as { v?: unknown; createdAt?: unknown; id?: unknown };
		return parsed.v === 1 && typeof parsed.createdAt === 'string' && typeof parsed.id === 'string'
			? { createdAt: parsed.createdAt, id: parsed.id }
			: null;
	} catch { return null; }
}
