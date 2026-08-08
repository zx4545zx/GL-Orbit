// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { PublicSeriesVideo } from '$lib/server/queries/series-detail.js';
import SeriesVideoPlayer from './SeriesVideoPlayer.svelte';

const reactionVideo: PublicSeriesVideo = {
	id: 'reaction-1',
	type: 'REACTION',
	youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
	youtubeVideoId: 'aaaaaaaaaaa',
	titleTh: 'รีแอ็กชันหนึ่ง',
	titleEn: 'Reaction one',
	sortOrder: 0
};

afterEach(cleanup);

describe('SeriesVideoPlayer reaction videos', () => {
	it('renders a reaction video from public series data', () => {
		render(SeriesVideoPlayer, { videos: [reactionVideo], lang: 'th' });
		expect(screen.getByRole('article')).toBeTruthy();
		expect(screen.getByRole('heading', { name: 'รีแอ็กชันหนึ่ง', level: 3 })).toBeTruthy();
		expect(screen.getByTitle(/รีแอ็กชันหนึ่ง/)).toBeTruthy();
	});
});
