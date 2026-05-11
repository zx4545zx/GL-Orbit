import type { InferSelectModel } from 'drizzle-orm';
import type { users, sessions } from './lib/server/db/schema.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: InferSelectModel<typeof users> | null;
			session: InferSelectModel<typeof sessions> | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
