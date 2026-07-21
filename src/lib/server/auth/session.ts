import { SignJWT, jwtVerify } from 'jose';
import { and, eq, lt } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';
import type { SessionMetadata } from './session-metadata.js';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const ACTIVITY_UPDATE_INTERVAL_MS = 1000 * 60 * 15;

export interface SessionPayload {
	userId: string;
	sessionId: string;
}

export async function createSession(userId: string, metadata: SessionMetadata) {
	const db = await getDb();
	const now = new Date();
	const sessionId = crypto.randomUUID();
	const token = await new SignJWT({ userId, sessionId })
		.setProtectedHeader({ alg: 'HS256' })
		.setJti(sessionId)
		.setIssuedAt()
		.setExpirationTime('30d')
		.sign(SECRET);

	const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

	// Store hash of token for lookup
	const tokenHash = await hashToken(token);

	await db
		.delete(schema.sessions)
		.where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, now)));

	await db.insert(schema.sessions).values({
		userId,
		tokenHash,
		expiresAt,
		...metadata,
		lastSeenAt: now
	});

	return { token, expiresAt };
}

export async function validateSession(token: string) {
	try {
		const { payload } = await jwtVerify(token, SECRET, {
			algorithms: ['HS256'],
			clockTolerance: 60
		});

		const { userId } = payload as unknown as SessionPayload;
		const tokenHash = await hashToken(token);

		const db = await getDb();

		const [result] = await db
			.select({ user: schema.users, session: schema.sessions })
			.from(schema.sessions)
			.innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
			.where(and(eq(schema.sessions.tokenHash, tokenHash), eq(schema.sessions.userId, userId)))
			.limit(1);

		if (!result) return null;
		const now = new Date();
		if (now > result.session.expiresAt) {
			await destroySession(token);
			return null;
		}

		if (!result.user.isActive) return null;
		if (
			!result.session.lastSeenAt ||
			now.getTime() - result.session.lastSeenAt.getTime() >= ACTIVITY_UPDATE_INTERVAL_MS
		) {
			try {
				await db
					.update(schema.sessions)
					.set({ lastSeenAt: now })
					.where(eq(schema.sessions.id, result.session.id));
				return { ...result, session: { ...result.session, lastSeenAt: now } };
			} catch {
				return result;
			}
		}

		return result;
	} catch {
		return null;
	}
}

export async function destroySession(token: string) {
	const db = await getDb();
	const tokenHash = await hashToken(token);
	await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
}

async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
