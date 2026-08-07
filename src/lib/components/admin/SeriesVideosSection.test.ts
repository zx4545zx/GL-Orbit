// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { SeriesVideo } from '$lib/admin/editor-types.js';

const mocks = vi.hoisted(() => ({ add: vi.fn(), reorder: vi.fn(), remove: vi.fn() }));
vi.mock('$lib/admin/editor-api.js', () => ({
	editorApi: { addSeriesVideo: mocks.add, reorderSeriesVideos: mocks.reorder, removeSeriesVideo: mocks.remove }
}));
import SeriesVideosSection from './SeriesVideosSection.svelte';

const seriesId = '11111111-1111-4111-8111-111111111111';
const createdAt = new Date('2026-07-29T00:00:00Z');
const videos: SeriesVideo[] = [
	{ id: 'pilot-1', seriesId, type: 'PILOT', youtubeUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb', youtubeVideoId: 'bbbbbbbbbbb', titleTh: 'ไพล็อต', titleEn: 'Pilot one', sortOrder: 0, createdAt },
	{ id: 'trailer-1', seriesId, type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', youtubeVideoId: 'aaaaaaaaaaa', titleTh: 'ตัวอย่างหนึ่ง', titleEn: 'Trailer one', sortOrder: 0, createdAt },
	{ id: 'trailer-2', seriesId, type: 'TRAILER', youtubeUrl: 'https://www.youtube.com/watch?v=ccccccccccc', youtubeVideoId: 'ccccccccccc', titleTh: 'ตัวอย่างสอง', titleEn: 'Trailer two', sortOrder: 1, createdAt }
];

function setup(props: Partial<{ videos: SeriesVideo[]; lang: 'th' | 'en'; onrefresh: () => void | Promise<void> }> = {}) {
	return render(SeriesVideosSection, { seriesId, videos, lang: 'en', onrefresh: vi.fn(), ...props });
}

function fields() {
	return {
		type: screen.getByLabelText(/type|ประเภท/i),
		url: screen.getByLabelText(/youtube/i),
		th: screen.getByLabelText(/thai title|ชื่อภาษาไทย/i),
		en: screen.getByLabelText(/english title|ชื่อภาษาอังกฤษ/i)
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.add.mockResolvedValue({ ok: true, data: { success: true, data: videos[0] } });
	mocks.reorder.mockResolvedValue({ ok: true, data: { success: true } });
	mocks.remove.mockResolvedValue({ ok: true, data: { success: true } });
});
afterEach(cleanup);

describe('SeriesVideosSection', () => {
	it('renders labeled native fields and blocks whitespace-only submission', async () => {
		const user = userEvent.setup();
		setup({ videos: [] });
		const form = fields();
		expect(form.type.tagName).toBe('SELECT');
		expect(form.url.getAttribute('type')).toBe('url');
		expect(form.th.getAttribute('maxlength')).toBe('255');
		expect(form.en.getAttribute('maxlength')).toBe('255');
		expect(Array.from((form.type as HTMLSelectElement).options).map(({ value, text }) => ({ value, text }))).toEqual([
			{ value: 'TRAILER', text: 'Trailer' },
			{ value: 'PILOT', text: 'Pilot' },
			{ value: 'MUSIC', text: 'Music' },
			{ value: 'EVENT', text: 'Event' },
			{ value: 'OTHER', text: 'Other' }
		]);
		const add = screen.getByRole('button', { name: /add video|เพิ่มวิดีโอ/i }) as HTMLButtonElement;
		expect(add.disabled).toBe(true);
		await user.type(form.th, '   ');
		await user.type(form.en, 'English');
		await user.type(form.url, 'https://youtu.be/dQw4w9WgXcQ');
		expect(add.disabled).toBe(true);
		expect(mocks.add).not.toHaveBeenCalled();
	});

	it('retains all values and reports an accessible failed add', async () => {
		const user = userEvent.setup();
		mocks.add.mockResolvedValue({ ok: false, error: 'วิดีโอนี้ถูกเพิ่มแล้ว', code: 'DUPLICATE_VIDEO' });
		setup({ videos: [] });
		const form = fields();
		await user.selectOptions(form.type, 'PILOT');
		await user.type(form.th, 'ชื่อไทย');
		await user.type(form.en, 'English title');
		await user.type(form.url, 'https://youtu.be/dQw4w9WgXcQ');
		await user.click(screen.getByRole('button', { name: /add video|เพิ่มวิดีโอ/i }));
		expect((await screen.findByRole('alert')).textContent).toContain('This video has already been added');
		expect(screen.getByRole('alert').textContent).not.toContain('วิดีโอนี้ถูกเพิ่มแล้ว');
		expect((form.type as HTMLSelectElement).value).toBe('PILOT');
		expect((form.th as HTMLInputElement).value).toBe('ชื่อไทย');
		expect((form.en as HTMLInputElement).value).toBe('English title');
		expect((form.url as HTMLInputElement).value).toBe('https://youtu.be/dQw4w9WgXcQ');
	});

	it('localizes a stable video error code in Thai', async () => {
		const user = userEvent.setup();
		mocks.add.mockResolvedValue({ ok: false, error: 'Invalid YouTube URL', code: 'INVALID_YOUTUBE_URL' });
		setup({ videos: [], lang: 'th' });
		const form = fields();
		await user.type(form.th, 'ชื่อไทย');
		await user.type(form.en, 'English title');
		await user.type(form.url, 'https://youtu.be/dQw4w9WgXcQ');
		await user.click(screen.getByRole('button', { name: /add video|เพิ่มวิดีโอ/i }));
		expect((await screen.findByRole('alert')).textContent).toBe('ลิงก์ YouTube ไม่ถูกต้อง');
	});

	it('locks add while pending, clears only after success, then awaits refresh', async () => {
		const user = userEvent.setup();
		let resolve!: (value: { ok: true; data: { success: true; data: SeriesVideo } }) => void;
		mocks.add.mockReturnValue(new Promise((done) => (resolve = done)));
		const onrefresh = vi.fn().mockResolvedValue(undefined);
		setup({ videos: [], onrefresh });
		const form = fields();
		await user.type(form.th, 'ชื่อไทย');
		await user.type(form.en, 'English title');
		await user.type(form.url, 'https://youtu.be/dQw4w9WgXcQ');
		await user.click(screen.getByRole('button', { name: /add video|เพิ่มวิดีโอ/i }));
		expect((screen.getByRole('button', { name: /adding|กำลังเพิ่ม/i }) as HTMLButtonElement).disabled).toBe(true);
		expect((form.url as HTMLInputElement).disabled).toBe(true);
		resolve({ ok: true, data: { success: true, data: videos[0] } });
		await waitFor(() => expect(onrefresh).toHaveBeenCalledOnce());
		expect((form.th as HTMLInputElement).value).toBe('');
		expect((form.en as HTMLInputElement).value).toBe('');
		expect((form.url as HTMLInputElement).value).toBe('');
		expect(screen.getByText(/video saved|บันทึกวิดีโอแล้ว/i)).toBeTruthy();
	});

	it('shows registry groups in order with bilingual rows, URL, and positions', () => {
		setup();
		const headings = screen.getAllByRole('heading', { level: 3 });
		expect(headings[0].textContent).toMatch(/Trailer/);
		expect(headings[1].textContent).toMatch(/Pilot/);
		expect(headings.slice(2).map((heading) => heading.textContent)).toEqual(['Music (0)', 'Event (0)', 'Other (0)']);
		expect(screen.getByText(/Trailer one/)).toBeTruthy();
		expect(screen.getByText(/ตัวอย่างหนึ่ง/)).toBeTruthy();
		expect(screen.getByRole('link', { name: videos[1].youtubeUrl }).getAttribute('href')).toBe(videos[1].youtubeUrl);
		expect(screen.getAllByText(/Position 1|ลำดับ 1/i).length).toBeGreaterThan(0);
	});

	it('keeps movement inside a type group and disables boundary actions', async () => {
		const user = userEvent.setup();
		setup();
		const firstUp = screen.getByRole('button', { name: /move up.*trailer one|เลื่อนขึ้น.*trailer one/i }) as HTMLButtonElement;
		const firstDown = screen.getByRole('button', { name: /move down.*trailer one|เลื่อนลง.*trailer one/i });
		const secondDown = screen.getByRole('button', { name: /move down.*trailer two|เลื่อนลง.*trailer two/i }) as HTMLButtonElement;
		expect(firstUp.disabled).toBe(true);
		expect(secondDown.disabled).toBe(true);
		await user.click(firstDown);
		expect(mocks.reorder).toHaveBeenCalledWith(seriesId, 'TRAILER', ['trailer-2', 'trailer-1']);
		expect(mocks.reorder.mock.calls[0][2]).not.toContain('pilot-1');
	});

	it('does not refresh after failed reorder and exposes the failure', async () => {
		const user = userEvent.setup();
		const onrefresh = vi.fn();
		mocks.reorder.mockResolvedValue({ ok: false, error: 'Reorder failed' });
		setup({ onrefresh });
		await user.click(screen.getByRole('button', { name: /move down.*trailer one|เลื่อนลง.*trailer one/i }));
		expect((await screen.findByRole('alert')).textContent).toBe('Action failed');
		expect(screen.getByRole('alert').textContent).not.toContain('Reorder failed');
		expect(onrefresh).not.toHaveBeenCalled();
	});

	it('requires confirmation, supports cancel, and refreshes once after confirmed delete', async () => {
		const user = userEvent.setup();
		const onrefresh = vi.fn();
		setup({ onrefresh });
		await user.click(screen.getByRole('button', { name: /delete.*trailer one|ลบ.*trailer one/i }));
		const dialog = screen.getByRole('dialog');
		expect(mocks.remove).not.toHaveBeenCalled();
		await user.click(within(dialog).getByTestId('confirm-cancel'));
		expect(mocks.remove).not.toHaveBeenCalled();
		await user.click(screen.getByRole('button', { name: /delete.*trailer one|ลบ.*trailer one/i }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /delete video|ลบวิดีโอ/i }));
		expect(mocks.remove).toHaveBeenCalledWith(seriesId, 'trailer-1');
		await waitFor(() => expect(onrefresh).toHaveBeenCalledOnce());
	});

	it('keeps the affected row disabled during delete and skips refresh on failure', async () => {
		const user = userEvent.setup();
		let resolve!: (value: { ok: false; error: string }) => void;
		mocks.remove.mockReturnValue(new Promise((done) => (resolve = done)));
		const onrefresh = vi.fn();
		setup({ onrefresh });
		await user.click(screen.getByRole('button', { name: /delete.*trailer one|ลบ.*trailer one/i }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /delete video|ลบวิดีโอ/i }));
		expect((screen.getByRole('button', { name: /delete.*trailer one|ลบ.*trailer one/i }) as HTMLButtonElement).disabled).toBe(true);
		resolve({ ok: false, error: 'Delete failed' });
		expect((await screen.findByRole('alert')).textContent).toBe('Action failed');
		expect(screen.getByRole('alert').textContent).not.toContain('Delete failed');
		expect(onrefresh).not.toHaveBeenCalled();
	});

	it('gives all row actions 44px targets and visible focus styles', () => {
		setup();
		for (const button of screen.getAllByRole('button').filter((item) => /move|delete|เลื่อน|ลบ/i.test(item.getAttribute('aria-label') ?? ''))) {
			expect(button.className).toContain('min-h-11');
			expect(button.className).toContain('focus-visible:outline');
		}
	});
});
