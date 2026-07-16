import { describe, expect, it, vi } from 'vitest';
import { deleteImageVariants, putVariantsWithCleanup } from './r2.js';

const id = '11111111-2222-3333-4444-555555555555';
const variants = [480, 1080].flatMap((width) => ['avif', 'webp', 'jpg'].map((ext) => ({ width, ext: ext as 'avif' | 'webp' | 'jpg', buffer: Buffer.from('x') })));

describe('Moment R2 cleanup', () => {
	it('deletes all six Moment variants', async () => {
		const remove = vi.fn().mockResolvedValue(undefined);
		await deleteImageVariants(`images/moments/${id}/1080.jpg`, remove);
		expect(remove).toHaveBeenCalledTimes(6);
		expect(remove).toHaveBeenCalledWith(`images/moments/${id}/480.avif`);
		expect(remove).toHaveBeenCalledWith(`images/moments/${id}/1080.jpg`);
	});

	it('cleans all generated variants after a parallel PUT failure, including the ambiguous failed key', async () => {
		const put = vi.fn().mockImplementation((key: string) => key.endsWith('/480.webp') ? Promise.reject(new Error('R2 failed')) : Promise.resolve());
		const remove = vi.fn().mockResolvedValue(undefined);
		await expect(putVariantsWithCleanup(variants, 'moments', id, put, remove)).rejects.toThrow('R2 failed');
		expect(remove).toHaveBeenCalledTimes(6);
		expect(remove).toHaveBeenCalledWith(`images/moments/${id}/480.webp`);
	});
});

describe('Cover R2 cleanup', () => {
	it('deletes all nine cover variants', async () => {
		const remove = vi.fn().mockResolvedValue(undefined);
		await deleteImageVariants(`images/covers/${id}/1800.jpg`, remove);
		expect(remove).toHaveBeenCalledTimes(9);
		expect(remove).toHaveBeenCalledWith(`images/covers/${id}/960.avif`);
		expect(remove).toHaveBeenCalledWith(`images/covers/${id}/1800.jpg`);
	});
});
