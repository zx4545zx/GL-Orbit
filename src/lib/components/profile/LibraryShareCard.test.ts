// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { FavoriteSeriesItem } from '$lib/types.js';
import LibraryShareCard from './LibraryShareCard.svelte';

const { createCardMock, shareCardMock } = vi.hoisted(() => ({
	createCardMock: vi.fn(),
	shareCardMock: vi.fn()
}));

vi.mock('$lib/client/library-share-card.js', () => ({
	createLibraryShareCard: createCardMock,
	shareLibraryCard: shareCardMock
}));

const favorites: FavoriteSeriesItem[] = Array.from({ length: 4 }, (_, index) => ({
	id: `series-${index + 1}`,
	title: `Series ${index + 1}`,
	subtitle: '',
	poster: `/poster-${index + 1}.jpg`,
	status: 'ENDED',
	studio: 'Orbit Studio'
}));

const props = {
	lang: 'th' as const,
	displayName: 'Orbit Member',
	avatarUrl: '/avatar.jpg',
	favoriteCount: 4,
	watchedCount: 2,
	favorites
};

afterEach(cleanup);

beforeEach(() => {
	vi.clearAllMocks();
	createCardMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
	shareCardMock.mockResolvedValue('shared');
});

describe('LibraryShareCard', () => {
	it('generates from privacy-safe profile data and only the first three favorites', async () => {
		const user = userEvent.setup();
		render(LibraryShareCard, { props });

		await user.click(screen.getByRole('button', { name: /แชร์คลังของฉัน|share my library/i }));

		expect(createCardMock).toHaveBeenCalledWith(expect.objectContaining({
			lang: 'th',
			displayName: 'Orbit Member',
			avatarUrl: '/avatar.jpg',
			favoriteCount: 4,
			watchedCount: 2,
			favorites: favorites.slice(0, 3).map(({ title, poster }) => ({ title, poster })),
			createdAt: expect.any(Date)
		}));
		expect(shareCardMock).toHaveBeenCalledOnce();
	});

	it('prevents duplicate generation while busy', async () => {
		const user = userEvent.setup();
		let resolveCard!: (blob: Blob) => void;
		createCardMock.mockReturnValue(new Promise<Blob>((resolve) => (resolveCard = resolve)));
		render(LibraryShareCard, { props });
		const button = screen.getByRole('button', { name: /แชร์คลังของฉัน|share my library/i });

		await user.click(button);
		expect((button as HTMLButtonElement).disabled).toBe(true);
		expect(screen.getByText(/กำลังสร้าง|creating/i)).toBeTruthy();
		await user.click(button);
		expect(createCardMock).toHaveBeenCalledOnce();

		resolveCard(new Blob(['png'], { type: 'image/png' }));
		await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
	});

	it('shows outcome-specific feedback and treats cancellation as idle', async () => {
		const user = userEvent.setup();
		const { unmount } = render(LibraryShareCard, { props });
		expect(screen.queryByRole('status')).toBeNull();
		shareCardMock.mockResolvedValueOnce('downloaded');
		await user.click(screen.getByRole('button', { name: /แชร์คลังของฉัน|share my library/i }));
		expect(await screen.findByText(/ดาวน์โหลดการ์ดแล้ว|library card downloaded/i)).toBeTruthy();
		expect(screen.getByRole('status').className).toContain('fixed');
		unmount();

		shareCardMock.mockResolvedValueOnce('cancelled');
		render(LibraryShareCard, { props });
		await user.click(screen.getByRole('button', { name: /แชร์คลังของฉัน|share my library/i }));
		expect(screen.queryByText(/ไม่สำเร็จ|could not create/i)).toBeNull();
		expect(screen.queryByText(/พร้อมแชร์|ready to share/i)).toBeNull();
	});

	it('keeps the action available and exposes retry feedback after failure', async () => {
		const user = userEvent.setup();
		createCardMock.mockRejectedValue(new Error('canvas failed'));
		render(LibraryShareCard, { props });
		const button = screen.getByRole('button', { name: /แชร์คลังของฉัน|share my library/i });

		await user.click(button);

		expect(await screen.findByText(/สร้างการ์ดไม่สำเร็จ|could not create the card/i)).toBeTruthy();
		expect((button as HTMLButtonElement).disabled).toBe(false);
	});
});
