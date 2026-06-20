import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '$lib/server/db/schema.js';
import type { PublicUser, ProfileUser } from '$lib/types.js';

type DbUser = InferSelectModel<typeof users>;

export function toPublicUser(user: DbUser): PublicUser {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		coverUrl: user.coverUrl,
		role: user.role
	};
}

export function toProfileUser(user: DbUser): ProfileUser {
	return {
		...toPublicUser(user),
		createdAt: user.createdAt.toISOString()
	};
}
