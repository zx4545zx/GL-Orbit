/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	LIBRARY_CARD_HEIGHT,
	LIBRARY_CARD_WIDTH,
	createLibraryShareCard,
	shareLibraryCard,
	type LibraryShareCardInput
} from './library-share-card.js';

const context = {
	fillStyle: '',
	strokeStyle: '',
	lineWidth: 1,
	font: '',
	textAlign: 'start' as CanvasTextAlign,
	textBaseline: 'alphabetic' as CanvasTextBaseline,
	fillRect: vi.fn(),
	strokeRect: vi.fn(),
	fillText: vi.fn(),
	drawImage: vi.fn(),
	measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
	save: vi.fn(),
	restore: vi.fn(),
	beginPath: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn(),
	clip: vi.fn()
};

const canvas = {
	width: 0,
	height: 0,
	getContext: vi.fn(() => context),
	toBlob: vi.fn((callback: BlobCallback, type?: string) => {
		callback(new Blob(['png'], { type: type ?? 'image/png' }));
	})
};

const loadedImages: string[] = [];

class MockImage {
	crossOrigin: string | null = null;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	width = 400;
	height = 600;

	set src(value: string) {
		loadedImages.push(value);
		queueMicrotask(() => value.includes('fail') ? this.onerror?.() : this.onload?.());
	}
}

const input: LibraryShareCardInput = {
	lang: 'th',
	displayName: 'Orbit Member',
	avatarUrl: null,
	favoriteCount: 4,
	watchedCount: 2,
	favorites: [
		{ title: 'First', poster: '/first.jpg' },
		{ title: 'Second', poster: '/fail.jpg' },
		{ title: 'Third', poster: '/third.jpg' },
		{ title: 'Must not render', poster: '/fourth.jpg' }
	],
	createdAt: new Date('2026-07-22T00:00:00.000Z')
};

describe('library share card', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loadedImages.length = 0;
		canvas.width = 0;
		canvas.height = 0;
		const createElement = document.createElement.bind(document);
		vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
			if (tagName === 'canvas') return canvas as unknown as HTMLCanvasElement;
			return createElement(tagName);
		});
		vi.stubGlobal('Image', MockImage);
		vi.stubGlobal('File', class extends Blob {
			name: string;
			constructor(parts: BlobPart[], name: string, options?: FilePropertyBag) {
				super(parts, options);
				this.name = name;
			}
		});
		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => 'blob:library-card'),
			revokeObjectURL: vi.fn()
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('exports a fixed-size PNG and loads only the first three posters', async () => {
		const blob = await createLibraryShareCard(input);

		expect(LIBRARY_CARD_WIDTH).toBe(1080);
		expect(LIBRARY_CARD_HEIGHT).toBe(1350);
		expect(canvas.width).toBe(1080);
		expect(canvas.height).toBe(1350);
		expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
		expect(blob.type).toBe('image/png');
		expect(loadedImages).toEqual(['/first.jpg', '/fail.jpg', '/third.jpg']);
		expect(context.fillRect).toHaveBeenCalled();
	});

	it('still exports with no avatar or favorites', async () => {
		await expect(createLibraryShareCard({
			...input,
			avatarUrl: null,
			favorites: []
		})).resolves.toMatchObject({ type: 'image/png' });
		expect(loadedImages).toEqual([]);
	});

	it('shares an image/png file when native file sharing is supported', async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperties(navigator, {
			canShare: { configurable: true, value: vi.fn(() => true) },
			share: { configurable: true, value: share }
		});

		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit',
			text: 'My library'
		})).resolves.toBe('shared');
		expect(share).toHaveBeenCalledWith(expect.objectContaining({
			title: 'My GL Orbit',
			text: 'My library',
			files: [expect.objectContaining({ name: 'gl-orbit-library.png', type: 'image/png' })]
		}));
	});

	it('downloads and revokes the object URL when native file sharing is unavailable', async () => {
		Object.defineProperties(navigator, {
			canShare: { configurable: true, value: undefined },
			share: { configurable: true, value: undefined }
		});
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit',
			text: 'My library'
		})).resolves.toBe('downloaded');
		expect(click).toHaveBeenCalledOnce();
		expect(URL.createObjectURL).toHaveBeenCalledOnce();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:library-card');
	});

	it('returns cancelled for AbortError without downloading', async () => {
		Object.defineProperties(navigator, {
			canShare: { configurable: true, value: vi.fn(() => true) },
			share: {
				configurable: true,
				value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
			}
		});
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		await expect(shareLibraryCard(new Blob(['png'], { type: 'image/png' }), {
			title: 'My GL Orbit',
			text: 'My library'
		})).resolves.toBe('cancelled');
		expect(click).not.toHaveBeenCalled();
	});
});
