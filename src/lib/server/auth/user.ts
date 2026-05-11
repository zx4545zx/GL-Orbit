import { eq, or } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema.js';

export async function getUserByEmail(email: string) {
	const db = await getDb();
	const [user] = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.email, email))
		.limit(1);
	return user ?? null;
}

export async function getUserByUsername(username: string) {
	const db = await getDb();
	const [user] = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.username, username))
		.limit(1);
	return user ?? null;
}

export async function getUserByIdentifier(identifier: string) {
	const db = await getDb();
	const [user] = await db
		.select()
		.from(schema.users)
		.where(or(
			eq(schema.users.username, identifier),
			eq(schema.users.email, identifier)
		))
		.limit(1);
	return user ?? null;
}

export async function createUser(data: {
	username: string;
	email: string;
	passwordHash: string;
	role?: 'ADMIN' | 'USER';
	displayName?: string;
}) {
	const db = await getDb();
	const [user] = await db
		.insert(schema.users)
		.values({
			username: data.username,
			email: data.email,
			passwordHash: data.passwordHash,
			role: data.role ?? 'USER',
			displayName: data.displayName ?? null
		})
		.returning();
	return user;
}
