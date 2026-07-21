import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionMetadata } from './session-metadata.js';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock('../db/index.js', () => ({ getDb: mocks.getDb }));

const NOW = new Date('2026-07-21T08:00:00.000Z');
const metadata: SessionMetadata = {
	browser: 'Chrome',
	operatingSystem: 'Windows',
	deviceType: 'desktop',
	maskedIp: '203.0.113.xxx',
	city: 'Bangkok',
	countryCode: 'TH'
};

const user = {
	id: 'user-1',
	username: 'orbit',
	email: 'orbit@example.com',
	displayName: 'Orbit',
	avatarUrl: null,
	passwordHash: 'hash',
	role: 'USER',
	isActive: true,
	preferredLanguage: 'th',
	createdAt: NOW,
	updatedAt: NOW
};

function makeDb(result: unknown[] = []) {
	const deleteWhere = vi.fn().mockResolvedValue(undefined);
	const values = vi.fn().mockResolvedValue(undefined);
	const limit = vi.fn().mockResolvedValue(result);
	const whereSelect = vi.fn(() => ({ limit }));
	const innerJoin = vi.fn(() => ({ where: whereSelect }));
	const from = vi.fn(() => ({ innerJoin }));
	const updateWhere = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn(() => ({ where: updateWhere }));

	return {
		db: {
			delete: vi.fn(() => ({ where: deleteWhere })),
			insert: vi.fn(() => ({ values })),
			select: vi.fn(() => ({ from })),
			update: vi.fn(() => ({ set }))
		},
		deleteWhere,
		values,
		limit,
		set,
		updateWhere
	};
}

let createSession: typeof import('./session.js').createSession;
let validateSession: typeof import('./session.js').validateSession;

beforeAll(async () => {
	process.env.AUTH_SECRET = 'session-test-secret-with-enough-entropy';
	({ createSession, validateSession } = await import('./session.js'));
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

describe('createSession', () => {
	it('cleans up expired user sessions before inserting normalized metadata', async () => {
		const database = makeDb();
		mocks.getDb.mockResolvedValue(database.db);

		await createSession('user-1', metadata);

		expect(database.deleteWhere).toHaveBeenCalledOnce();
		expect(database.values).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-1', ...metadata, lastSeenAt: NOW })
		);
		expect(database.deleteWhere.mock.invocationCallOrder[0]).toBeLessThan(
			database.values.mock.invocationCallOrder[0]
		);
	});
});

describe('validateSession', () => {
	async function tokenForTest() {
		const database = makeDb();
		mocks.getDb.mockResolvedValue(database.db);
		const result = await createSession('user-1', metadata);
		return result.token;
	}

	it.each([null, new Date('2026-07-21T07:44:59.000Z')])(
		'updates missing or stale activity timestamps (%s)',
		async (lastSeenAt) => {
			const token = await tokenForTest();
			const session = {
				id: 'session-1',
				userId: 'user-1',
				tokenHash: 'stored-hash',
				expiresAt: new Date('2026-08-20T08:00:00.000Z'),
				createdAt: NOW,
				...metadata,
				lastSeenAt
			};
			const database = makeDb([{ user, session }]);
			mocks.getDb.mockResolvedValue(database.db);

			const result = await validateSession(token);

			expect(database.set).toHaveBeenCalledWith({ lastSeenAt: NOW });
			expect(database.updateWhere).toHaveBeenCalledOnce();
			expect(result?.session.lastSeenAt).toEqual(NOW);
		}
	);

	it('does not write activity newer than fifteen minutes', async () => {
		const token = await tokenForTest();
		const session = {
			id: 'session-1',
			userId: 'user-1',
			tokenHash: 'stored-hash',
			expiresAt: new Date('2026-08-20T08:00:00.000Z'),
			createdAt: NOW,
			...metadata,
			lastSeenAt: new Date('2026-07-21T07:50:00.000Z')
		};
		const database = makeDb([{ user, session }]);
		mocks.getDb.mockResolvedValue(database.db);

		const result = await validateSession(token);

		expect(database.set).not.toHaveBeenCalled();
		expect(result?.session.lastSeenAt).toEqual(session.lastSeenAt);
	});

	it('keeps a valid session when the activity timestamp update fails', async () => {
		const token = await tokenForTest();
		const session = {
			id: 'session-1',
			userId: 'user-1',
			tokenHash: 'stored-hash',
			expiresAt: new Date('2026-08-20T08:00:00.000Z'),
			createdAt: NOW,
			...metadata,
			lastSeenAt: null
		};
		const database = makeDb([{ user, session }]);
		database.updateWhere.mockRejectedValue(new Error('temporary activity write failure'));
		mocks.getDb.mockResolvedValue(database.db);

		const result = await validateSession(token);

		expect(result).toEqual({ user, session });
	});

	it('rejects expired and inactive sessions without touching activity', async () => {
		const token = await tokenForTest();
		const expiredDatabase = makeDb([
			{
				user,
				session: {
					id: 'expired-session',
					userId: 'user-1',
					expiresAt: new Date('2026-07-20T08:00:00.000Z'),
					lastSeenAt: null
				}
			}
		]);
		mocks.getDb.mockResolvedValue(expiredDatabase.db);
		expect(await validateSession(token)).toBeNull();
		expect(expiredDatabase.set).not.toHaveBeenCalled();

		const inactiveDatabase = makeDb([
			{
				user: { ...user, isActive: false },
				session: {
					id: 'inactive-session',
					userId: 'user-1',
					expiresAt: new Date('2026-08-20T08:00:00.000Z'),
					lastSeenAt: null
				}
			}
		]);
		mocks.getDb.mockResolvedValue(inactiveDatabase.db);
		expect(await validateSession(token)).toBeNull();
		expect(inactiveDatabase.set).not.toHaveBeenCalled();
	});
});
