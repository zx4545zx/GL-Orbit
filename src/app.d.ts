import type { InferSelectModel } from 'drizzle-orm';
import type { sessions, users } from './lib/server/db/schema.js';
import type { PublicUser } from './lib/types.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: InferSelectModel<typeof users> | null;
			session: InferSelectModel<typeof sessions> | null;
		}
		interface PageData {
			user: PublicUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
