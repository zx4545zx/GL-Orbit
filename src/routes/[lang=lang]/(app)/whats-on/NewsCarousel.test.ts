// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import type { NewsItem } from '$lib/types/whats-on.js';
import NewsCarousel from './NewsCarousel.svelte';

vi.mock('@splidejs/splide', () => ({
	Splide: class {
		mount() { return this; }
		destroy() {}
	}
}));

const news: NewsItem[] = [
	{
		id: 'news-1',
		headline: 'First story',
		blurb: 'First story summary.',
		sourceUrl: 'https://example.com/first',
		sourceName: 'Example News',
		publishedDate: '2026-08-01',
		status: 'approved'
	},
	{
		id: 'news-2',
		headline: 'Second story',
		blurb: 'Second story summary.',
		sourceUrl: null,
		sourceName: 'Orbit Desk',
		publishedDate: '2026-07-31',
		status: 'approved'
	}
];

afterEach(cleanup);

describe('NewsCarousel', () => {
	it('renders every story with its date, source, and optional headline link', () => {
		render(NewsCarousel, { news, locale: 'en-US' });

		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		expect(document.querySelectorAll('.news-kicker')).toHaveLength(news.length);
		expect(screen.getByText(/Example News/)).toBeTruthy();
		expect(screen.getByText(/Orbit Desk/)).toBeTruthy();
		expect(screen.getByText('Aug 1, 2026')).toBeTruthy();
		const link = screen.getByRole('link', { name: 'First story' });
		expect(link.getAttribute('href')).toBe('https://example.com/first');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		const icon = link.querySelector('.news-external-icon');
		expect(icon?.getAttribute('aria-hidden')).toBe('true');
		expect(screen.queryByRole('link', { name: 'Second story' })).toBeNull();
	});

	it('exposes labeled carousel controls and pagination markup', () => {
		const { container } = render(NewsCarousel, { news, locale: 'en-US' });

		expect(screen.getByRole('region')).toBeTruthy();
		expect(container.querySelectorAll('.splide__arrow')).toHaveLength(2);
		expect(container.querySelector('.splide__pagination')).toBeTruthy();
	});

	it('maps each story to its own Splide slide card', () => {
		const { container } = render(NewsCarousel, { news, locale: 'en-US' });
		const slides = Array.from(container.querySelectorAll('.splide__slide'));

		expect(slides).toHaveLength(news.length);
		expect(slides.every((slide) => slide.querySelector(':scope > .news-story'))).toBe(true);
	});
});
