// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { PublicSeriesVideo } from '$lib/server/queries/series-detail.js';
import SeriesVideoPlayer from './SeriesVideoPlayer.svelte';

const videos: PublicSeriesVideo[] = [
	{ id: 'trailer-1', type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', youtubeVideoId: 'aaaaaaaaaaa', titleTh: 'ตัวอย่างหนึ่ง', titleEn: 'Trailer one', sortOrder: 0 },
	{ id: 'trailer-2', type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb', youtubeVideoId: 'bbbbbbbbbbb', titleTh: 'ตัวอย่างสอง', titleEn: 'Trailer two', sortOrder: 1 },
	{ id: 'pilot-1', type: 'PILOT', youtubeUrl: 'https://www.youtube.com/watch?v=ccccccccccc', youtubeVideoId: 'ccccccccccc', titleTh: 'ไพล็อตหนึ่ง', titleEn: 'Pilot one', sortOrder: 0 },
	{ id: 'music-1', type: 'MUSIC', youtubeUrl: 'https://www.youtube.com/watch?v=ddddddddddd', youtubeVideoId: 'ddddddddddd', titleTh: 'เพลงประกอบหนึ่ง', titleEn: 'Soundtrack one', sortOrder: 0 },
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

	it('renders only non-empty types in registry order and selects the first clip', async () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		await waitFor(() => expect(screen.getAllByRole('tab').length).toBe(5));
		const tabs = screen.getAllByRole('tab');
		expect(tabs.map((tab) => tab.textContent)).toEqual(['Trailer', 'Pilot', 'Music', 'Event', 'Other']);
		expect(tabs[0].getAttribute('aria-selected')).toBe('true');
		expect(screen.getByRole('button', { name: /Trailer one/i }).getAttribute('aria-pressed')).toBe('true');
	});

	it('switches type to its first clip and restores the first clip when returning', async () => {
		const user = userEvent.setup();
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		await user.click(screen.getByRole('button', { name: /Trailer two/i }));
		expect((screen.getByTitle(/Trailer two/i) as HTMLIFrameElement).src).toContain('/bbbbbbbbbbb?');
		await user.click(screen.getByRole('tab', { name: 'Pilot' }));
		expect((screen.getByTitle(/Pilot one/i) as HTMLIFrameElement).src).toContain('/ccccccccccc?');
		await user.click(screen.getByRole('tab', { name: 'Trailer' }));
		expect((screen.getByTitle(/Trailer one/i) as HTMLIFrameElement).src).toContain('/aaaaaaaaaaa?');
	});

	it('uses localized required title without fallback', async () => {
		render(SeriesVideoPlayer, { videos, lang: 'th' });
		await waitFor(() => expect(screen.getByRole('button', { name: /ตัวอย่างหนึ่ง/ })).toBeTruthy());
		expect(screen.queryByRole('button', { name: /Trailer one/ })).toBeNull();
		expect(screen.getByTitle(/ตัวอย่างหนึ่ง/)).toBeTruthy();
	});

	it('builds a hardened lazy nocookie iframe only from the stored ID', async () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		const iframe = await screen.findByTitle(/Trailer one/i) as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/aaaaaaaaaaa?playsinline=1&rel=0');
		expect(iframe.getAttribute('src')).not.toContain('autoplay');
		expect(iframe.getAttribute('src')).not.toContain(videos[0].youtubeUrl);
		expect(iframe.getAttribute('loading')).toBe('lazy');
		expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
		expect(iframe.getAttribute('allow')).toBe('accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share');
		expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
	});

	it('links tab and panel semantics and gives clip controls accessible active/focus states', async () => {
		render(SeriesVideoPlayer, { videos, lang: 'en' });
		const tablist = await screen.findByRole('tablist');
		expect(tablist.getAttribute('aria-label')).toBeTruthy();
		const tab = screen.getByRole('tab', { name: 'Trailer' });
		const panel = screen.getByRole('tabpanel');
		expect(tab.id).toBeTruthy();
		expect(tab.getAttribute('aria-controls')).toBe(panel.id);
		expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
		for (const clip of [screen.getByRole('button', { name: /Trailer one/ }), screen.getByRole('button', { name: /Trailer two/ })]) {
			expect(clip.className).toContain('min-h-11');
			expect(clip.className).toContain('focus-visible:outline');
			expect(clip.hasAttribute('aria-pressed')).toBe(true);
		}
	});

	it('repairs selection when rerendered with a different list', async () => {
		const user = userEvent.setup();
		const view = render(SeriesVideoPlayer, { videos, lang: 'en' });
		await user.click(await screen.findByRole('button', { name: /Trailer two/ }));
		await view.rerender({ videos: [videos[2]], lang: 'en' });
		await waitFor(() => expect(screen.getByTitle(/Pilot one/i)).toBeTruthy());
		expect(screen.queryByText(/Trailer two/)).toBeNull();
	});
});
