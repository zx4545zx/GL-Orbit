// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import type { PublicSeriesVideo } from '$lib/server/queries/series-detail.js';
import SeriesVideoPlayer from './SeriesVideoPlayer.svelte';

Object.defineProperty(globalThis, 'matchMedia', {
	writable: true,
	value: () => ({
		matches: false,
		media: '',
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})
});

const videos: PublicSeriesVideo[] = [
	{ id: 'trailer-1', type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', youtubeVideoId: 'aaaaaaaaaaa', titleTh: 'ตัวอย่างหนึ่ง', titleEn: 'Trailer one', sortOrder: 0 },
	{ id: 'trailer-2', type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb', youtubeVideoId: 'bbbbbbbbbbb', titleTh: 'ตัวอย่างสอง', titleEn: 'Trailer two', sortOrder: 1 },
	{ id: 'pilot-1', type: 'PILOT', youtubeUrl: 'https://www.youtube.com/watch?v=ccccccccccc', youtubeVideoId: 'ccccccccccc', titleTh: 'ไพล็อตหนึ่ง', titleEn: 'Pilot one', sortOrder: 0 },
	{ id: 'music-1', type: 'MUSIC', youtubeUrl: 'https://www.youtube.com/watch?v=ddddddddddd', youtubeVideoId: 'ddddddddddd', titleTh: 'เพลงประกอบหนึ่ง', titleEn: 'Soundtrack one', sortOrder: 0 },
	{ id: 'vlog-1', type: 'VLOG', youtubeUrl: 'https://www.youtube.com/watch?v=ggggggggggg', youtubeVideoId: 'ggggggggggg', titleTh: 'วล็อกหนึ่ง', titleEn: 'Vlog one', sortOrder: 0 },
	{ id: 'event-1', type: 'EVENT', youtubeUrl: 'https://www.youtube.com/watch?v=eeeeeeeeeee', youtubeVideoId: 'eeeeeeeeeee', titleTh: 'กิจกรรมหนึ่ง', titleEn: 'Event one', sortOrder: 0 },
	{ id: 'other-1', type: 'OTHER', youtubeUrl: 'https://www.youtube.com/watch?v=fffffffffff', youtubeVideoId: 'fffffffffff', titleTh: 'อื่นๆ หนึ่ง', titleEn: 'Other one', sortOrder: 0 }
];

afterEach(cleanup);

describe('SeriesVideoPlayer', () => {
	it('renders nothing for an empty list', () => {
		render(SeriesVideoPlayer, { videos: [], lang: 'en' });
		expect(screen.queryByRole('heading', { name: /video|วิดีโอ/i })).toBeNull();
		expect(document.querySelector('iframe')).toBeNull();
	});

	it('renders every clip as a carousel card in registry order with pagination controls', async () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		expect(screen.getAllByRole('article')).toHaveLength(7);
		expect(screen.getAllByTitle(/video|trailer|pilot|soundtrack|vlog|event|other/i)).toHaveLength(7);
		const carousel = document.querySelector('.series-video-splide');
		expect(carousel?.getAttribute('role')).toBe('region');
		expect(carousel?.getAttribute('aria-roledescription')).toBe('carousel');
		expect(carousel?.getAttribute('aria-labelledby')).toBe('series-video-heading');
		await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(1));
		expect(screen.getByRole('tablist')).toBeTruthy();
		const shortTitle = screen.getByRole('heading', { name: 'Trailer one', level: 3 });
		expect(shortTitle).toBeTruthy();
		expect(shortTitle.className).toContain('line-clamp-2');
		expect(shortTitle.className).toContain('h-[59px]');
		expect(shortTitle.className).toContain('leading-5');
		expect(screen.getByRole('heading', { name: 'Pilot one', level: 3 })).toBeTruthy();
		expect(screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent)).toEqual([
			'Trailer one', 'Trailer two', 'Pilot one', 'Soundtrack one', 'Vlog one', 'Event one', 'Other one'
		]);
	});

	it('uses localized titles visibly and accessibly without fallback', () => {
		render(SeriesVideoPlayer, { videos, lang: 'th' });
		expect(screen.getByRole('heading', { name: 'ตัวอย่างหนึ่ง', level: 3 })).toBeTruthy();
		expect(screen.queryByRole('heading', { name: 'Trailer one', level: 3 })).toBeNull();
		expect(screen.getByTitle(/ตัวอย่างหนึ่ง/)).toBeTruthy();
	});

	it('builds hardened lazy nocookie iframes only from stored IDs', () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		const iframe = screen.getByTitle(/Trailer one/i) as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?playsinline=1&rel=0');
		expect(iframe.getAttribute('src')).not.toContain('autoplay');
		expect(iframe.getAttribute('src')).not.toContain(videos[0].youtubeUrl);
		expect(iframe.getAttribute('loading')).toBe('lazy');
		expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
		expect(iframe.getAttribute('allow')).toBe('accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share');
		expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
	});

	it('uses semantic carousel cards without obsolete selection semantics', () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		expect(screen.queryByRole('tabpanel')).toBeNull();
		expect(document.querySelector('[aria-pressed]')).toBeNull();
		expect(screen.getAllByRole('article')).toHaveLength(7);
	});
});
