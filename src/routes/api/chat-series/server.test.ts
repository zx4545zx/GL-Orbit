import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallMiniMax = vi.fn();
const mockRunReadOnlyQuery = vi.fn();
const mockAppendChatExchange = vi.fn();
const mockCreateChatConversation = vi.fn();
const mockListChatConversations = vi.fn();

vi.mock('$lib/server/chat/minimax.js', () => ({
	MiniMaxConfigError: class MiniMaxConfigError extends Error {},
	callMiniMax: mockCallMiniMax
}));

vi.mock('$lib/server/chat/read-only-db.js', () => ({
	runReadOnlyQuery: mockRunReadOnlyQuery
}));

vi.mock('$lib/server/chat/history.js', () => ({
	appendChatExchange: mockAppendChatExchange,
	createChatConversation: mockCreateChatConversation,
	listChatConversations: mockListChatConversations
}));

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

function event(body: unknown, user: unknown = { id: 'user-1' }) {
	return {
		locals: { user },
		request: new Request('http://localhost/api/chat-series', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'Content-Type': 'application/json' }
		})
	} as never;
}

describe('POST /api/chat-series', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCallMiniMax.mockReset();
		mockRunReadOnlyQuery.mockReset();
		mockCreateChatConversation.mockResolvedValue({ id: 'conversation-1', title: 'test' });
	});

	it('returns 401 when user is not logged in', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'test' }, null)) as Response;

		expect(response.status).toBe(401);
	});

	it('returns 400 for an empty message', async () => {
		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: '   ' })) as Response;

		expect(response.status).toBe(400);
		expect(await jsonBody(response)).toHaveProperty('error');
	});

	it('blocks unsafe generated SQL', async () => {
		mockCallMiniMax.mockResolvedValueOnce('DROP TABLE series');
		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'delete data' })) as Response;

		expect(response.status).toBe(422);
		expect(mockRunReadOnlyQuery).not.toHaveBeenCalled();
	});

	it('returns polite out-of-scope reply and stores a conversation exchange', async () => {
		mockCallMiniMax.mockResolvedValueOnce("SELECT 'OUT_OF_SCOPE' AS status");
		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'weather today' })) as Response;

		expect(response.status).toBe(200);
		const body = await jsonBody(response);
		expect(body.reply).toContain('GL-Orbit');
		expect(body.conversationId).toBe('conversation-1');
		expect(mockAppendChatExchange).toHaveBeenCalledWith('user-1', 'conversation-1', 'weather today', body.reply);
	});

	it('runs safe SQL, asks MiniMax for final answer, and stores a conversation exchange', async () => {
		mockCallMiniMax
			.mockResolvedValueOnce('SELECT title_en FROM series WHERE deleted_at IS NULL')
			.mockResolvedValueOnce('There is 1 series: Pluto');
		mockRunReadOnlyQuery.mockResolvedValueOnce([{ title_en: 'Pluto' }]);

		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'what series are available' })) as Response;

		expect(response.status).toBe(200);
		expect(mockRunReadOnlyQuery).toHaveBeenCalledWith('SELECT title_en FROM series WHERE deleted_at IS NULL LIMIT 20');
		expect(mockAppendChatExchange).toHaveBeenCalledWith('user-1', 'conversation-1', 'what series are available', 'There is 1 series: Pluto');
		expect(await jsonBody(response)).toEqual({ reply: 'There is 1 series: Pluto', conversationId: 'conversation-1' });
	});
});

describe('GET /api/chat-series', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns conversations for logged-in users', async () => {
		mockListChatConversations.mockResolvedValueOnce([{ id: '1', title: 'Chat', createdAt: 'now', updatedAt: 'now' }]);
		const { GET } = await import('./+server.js');
		const response = await GET({ locals: { user: { id: 'user-1' } } } as never) as Response;

		expect(response.status).toBe(200);
		expect(await jsonBody(response)).toEqual({
			conversations: [{ id: '1', title: 'Chat', createdAt: 'now', updatedAt: 'now' }]
		});
	});
});
