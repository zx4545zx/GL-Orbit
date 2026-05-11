import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
	userId: string;
	sessionId: string;
}

export async function createSession(userId: string) {
	const db = await getDb();
	const sessionId = crypto.randomUUID();
	const token = await new SignJWT({ userId, sessionId })
		.setProtectedHeader({ alg: 'HS256' })
		.setJti(sessionId)
		.setIssuedAt()
		.setExpirationTime('30d')
		.sign(SECRET);

	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	// Store hash of token for lookup
	const tokenHash = await hashToken(token);

	await db.insert(schema.sessions).values({
		userId,
		tokenHash,
		expiresAt
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

		// Verify session exists in DB and is not expired
		const [session] = await db
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.tokenHash, tokenHash))
			.limit(1);

		if (!session) return null;
		if (new Date() > session.expiresAt) {
			await destroySession(token);
			return null;
		}

		// Get user
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.id, userId))
			.limit(1);

		if (!user || !user.isActive) return null;

		return { user, session };
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
