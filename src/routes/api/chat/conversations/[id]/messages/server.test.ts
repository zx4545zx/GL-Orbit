import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStartAiChat = vi.fn();
const mockRateLimit = vi.fn();
vi.mock('$lib/server/ai/chat.js', () => ({ AiChatError: class AiChatError extends Error { constructor(message: string, readonly status = 400) { super(message); } }, startAiChat: mockStartAiChat }));
vi.mock('$lib/server/rate-limit/index.js', () => ({ checkRateLimit: mockRateLimit }));

function event(body: unknown, user: unknown = { id: 'user-1', preferredLanguage: 'th' }) {
	return { locals: { user }, params: { id: 'conversation-1' }, request: new Request('http://localhost/api/chat/conversations/conversation-1/messages', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }) } as never;
}

describe('POST /api/chat/conversations/[id]/messages BYOK stream', () => {
	beforeEach(() => { vi.clearAllMocks(); mockRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }); mockStartAiChat.mockResolvedValue(new Response('stream', { status: 200 })); });
	it('requires authentication', async () => { const { POST } = await import('./+server.js'); expect((await POST(event({ message: 'hi' }, null)) as Response).status).toBe(401); });
	it('uses only authenticated ownership, selected profile, language, and request signal', async () => {
		const { POST } = await import('./+server.js'); const response = await POST(event({ message: 'hello', profileId: 'profile-1' })) as Response;
		expect(response.status).toBe(200); expect(mockStartAiChat).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', conversationId: 'conversation-1', text: 'hello', profileId: 'profile-1', language: 'th', abortSignal: expect.any(AbortSignal) }));
	});
	it('normalizes unexpected provider failures', async () => { mockStartAiChat.mockRejectedValueOnce(new Error('secret provider detail')); const { POST } = await import('./+server.js'); const response = await POST(event({ message: 'hello' })) as Response; expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: 'AI provider could not complete this request.' }); });
	it('rate limits before provider invocation', async () => { mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 60 }); const { POST } = await import('./+server.js'); const response = await POST(event({ message: 'hello' })) as Response; expect(response.status).toBe(429); expect(mockStartAiChat).not.toHaveBeenCalled(); });
});
