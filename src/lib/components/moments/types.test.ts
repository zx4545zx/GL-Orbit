import { describe, expect, it } from 'vitest';
import { toProfileMoment, type MomentApiItem } from './types.js';

describe('toProfileMoment', () => {
	it('uses hydrated entity labels instead of exposing database IDs as hashtags', () => {
		const moment: MomentApiItem = {
			id: 'moment-1', authorId: 'user-1', body: 'hello', sourceUrl: null, sourceProvider: 'OTHER',
			likeCount: 2, commentCount: 1, createdAt: new Date().toISOString(), liked: false, bookmarked: false,
			author: { id: 'user-1', username: 'halo', displayName: 'Halo', avatarUrl: null }, media: [],
			seriesIds: ['series-id'], artistIds: [], shipIds: [],
			entityTags: [{ kind: 'series', id: 'series-id', label: 'The Secret of Us' }]
		};

		expect(toProfileMoment(moment, 'en').tags).toEqual([
			{ kind: 'series', id: 'series-id', label: 'The Secret of Us' }
		]);
	});
});
