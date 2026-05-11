import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/lib/server/db/index.js';
import * as schema from '../src/lib/server/db/schema.js';
import { hashPassword } from '../src/lib/server/auth/password.js';

async function seedAdmin() {
	const args = process.argv.slice(2);
	const email = args.find((a) => a.startsWith('--email='))?.split('=')[1];
	const password = args.find((a) => a.startsWith('--password='))?.split('=')[1];
	const username = args.find((a) => a.startsWith('--username='))?.split('=')[1];

	if (!email || !password || !username) {
		console.error('❌ Usage: npx tsx scripts/seed-admin.ts --email=admin@example.com --password=YOUR_SECRET --username=admin');
		process.exit(1);
	}

	const db = await getDb();

	const existing = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.email, email))
		.limit(1);

	if (existing.length > 0) {
		console.log(`Admin user with email "${email}" already exists.`);
		process.exit(0);
	}

	const passwordHash = await hashPassword(password);

	const [user] = await db
		.insert(schema.users)
		.values({
			username,
			email,
			passwordHash,
			role: 'ADMIN',
			displayName: 'Administrator'
		})
		.returning();

	console.log('✅ Admin user created successfully!');
	console.log(`   ID:       ${user.id}`);
	console.log(`   Username: ${user.username}`);
	console.log(`   Email:    ${user.email}`);
	console.log(`   Role:     ${user.role}`);
	console.log(`\n   Login at: /admin/login`);
}

seedAdmin().catch((err) => {
	console.error('❌ Failed to seed admin:', err);
	process.exit(1);
});
