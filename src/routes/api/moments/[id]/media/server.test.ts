import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadImage = vi.fn();
const deleteImageVariants = vi.fn();
const getMomentMediaUploadAccess = vi.fn();
const appendMomentMedia = vi.fn();
vi.mock('$lib/server/r2.js', () => ({ ImageUploadValidationError: class ImageUploadValidationError extends Error {}, uploadImage, deleteImageVariants }));
vi.mock('$lib/server/moments/mutations.js', () => ({ getMomentMediaUploadAccess, appendMomentMedia }));

function request(file?: File, contentLength?: string) {
	const formData = new FormData();
	if (file) formData.set('file', file);
	return new Request('http://localhost/api/moments/moment-1/media', {
		method: 'POST', headers: contentLength ? { 'content-length': contentLength } : undefined, body: formData
	});
}

function imageFile(type = 'image/jpeg') {
	return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'image.jpg', { type });
}

describe('POST /api/moments/[id]/media', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getMomentMediaUploadAccess.mockResolvedValue('OK');
		appendMomentMedia.mockResolvedValue(true);
		deleteImageVariants.mockResolvedValue(undefined);
		uploadImage.mockResolvedValue({ url: 'https://cdn.example/images/moments/a/1080.jpg', key: 'images/moments/a/1080.jpg' });
	});

	it('returns 401 without a user', async () => {
		const { POST } = await import('./+server.js');
		expect((await POST({ params: { id: 'moment-1' }, locals: {}, request: request(imageFile()) } as never)).status).toBe(401);
	});

	it('returns 403 for another user', async () => {
		getMomentMediaUploadAccess.mockResolvedValue('FORBIDDEN');
		const { POST } = await import('./+server.js');
		expect((await POST({ params: { id: 'moment-1' }, locals: { user: { id: 'user-2' } }, request: request(imageFile()) } as never)).status).toBe(403);
		expect(uploadImage).not.toHaveBeenCalled();
	});

	it('returns 400 for missing, invalid, oversized, or fifth files', async () => {
		const { POST } = await import('./+server.js');
		const event = (file?: File, contentLength?: string) => POST({ params: { id: 'moment-1' }, locals: { user: { id: 'user-1' } }, request: request(file, contentLength) } as never);
		expect((await event()).status).toBe(400);
		expect((await event(imageFile('image/gif'))).status).toBe(400);
		expect((await event(imageFile(), String(4 * 1024 * 1024 + 1))).status).toBe(413);
		getMomentMediaUploadAccess.mockResolvedValue('FULL');
		expect((await event(imageFile())).status).toBe(400);
	});

	it('uploads and persists a valid owner image', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST({ params: { id: 'moment-1' }, locals: { user: { id: 'user-1' } }, request: request(imageFile()) } as never);
		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({ url: 'https://cdn.example/images/moments/a/1080.jpg' });
		expect(uploadImage).toHaveBeenCalledWith(expect.any(File), 'moments');
		expect(appendMomentMedia).toHaveBeenCalledWith({ momentId: 'moment-1', authorId: 'user-1', key: 'images/moments/a/1080.jpg', url: 'https://cdn.example/images/moments/a/1080.jpg' });
	});

	it('cleans up R2 variants when the locked append rejects a raced fifth upload', async () => {
		appendMomentMedia.mockResolvedValue(false);
		const { POST } = await import('./+server.js');
		const response = await POST({ params: { id: 'moment-1' }, locals: { user: { id: 'user-1' } }, request: request(imageFile()) } as never);
		expect(response.status).toBe(400);
		expect(deleteImageVariants).toHaveBeenCalledWith('images/moments/a/1080.jpg');
	});

	it('cleans up R2 variants when transactional persistence errors', async () => {
		appendMomentMedia.mockRejectedValue(new Error('database unavailable'));
		const { POST } = await import('./+server.js');
		const response = await POST({ params: { id: 'moment-1' }, locals: { user: { id: 'user-1' } }, request: request(imageFile()) } as never);
		expect(response.status).toBe(500);
		expect(deleteImageVariants).toHaveBeenCalledWith('images/moments/a/1080.jpg');
	});
});
