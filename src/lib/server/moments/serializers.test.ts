import { describe, expect, it } from 'vitest';
import { serializeMomentAuthor } from './serializers.js';

describe('serializeMomentAuthor', () => {
	it('never exposes private user fields', () => {
		expect(serializeMomentAuthor({ id: 'user-1', username: 'halo', displayName: 'Halo', avatarUrl: null, email: 'private@example.com', role: 'ADMIN' })).toEqual({ id: 'user-1', username: 'halo', displayName: 'Halo', avatarUrl: null });
	});
});
