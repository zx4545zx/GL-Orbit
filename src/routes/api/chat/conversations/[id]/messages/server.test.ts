import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallMiniMax = vi.fn();
const mockRunReadOnlyQuery = vi.fn();
const mockAppendChatExchange = vi.fn();
const mockGetChatMessages = vi.fn();
const mockGetRecentChatContext = vi.fn();
const mockGetSeriesCatalogText = vi.fn();

const SERIES_ID = '11111111-1111-4111-8111-111111111111';
const ARTIST_ID = '22222222-2222-4222-8222-222222222222';

vi.mock('$lib/server/chat/minimax.js', () => ({
	MiniMaxConfigError: class MiniMaxConfigError extends Error {},
	callMiniMax: mockCallMiniMax
}));

vi.mock('$lib/server/chat/read-only-db.js', () => ({
	runReadOnlyQuery: mockRunReadOnlyQuery
}));

vi.mock('$lib/server/chat/history.js', () => ({
	appendChatExchange: mockAppendChatExchange,
	getChatMessages: mockGetChatMessages,
	getRecentChatContext: mockGetRecentChatContext
}));

vi.mock('$lib/server/chat/catalog.js', () => ({
	getSeriesCatalogText: mockGetSeriesCatalogText
}));

async function jsonBody(response: Response) {
	return await response.json() as Record<string, unknown>;
}

function event(body: unknown, user: unknown = { id: 'user-1' }) {
	return {
		locals: { user },
		params: { id: 'conversation-1' },
		request: new Request('http://localhost/api/chat/conversations/conversation-1/messages', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'Content-Type': 'application/json' }
		})
	} as never;
}

describe('POST /api/chat/conversations/[id]/messages latency path', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCallMiniMax.mockReset();
		mockRunReadOnlyQuery.mockReset();
		mockAppendChatExchange.mockResolvedValue(true);
		mockGetRecentChatContext.mockResolvedValue([]);
		mockGetSeriesCatalogText.mockResolvedValue('CATALOG');
		delete process.env.CHAT_PERF_LOG;
		delete process.env.CHAT_ENABLE_FOLLOWUP_SUGGESTIONS;
	});

	it('uses a deterministic SQL shortcut for today schedule questions instead of calling MiniMax to generate SQL', async () => {
		mockRunReadOnlyQuery.mockResolvedValueOnce([{ series_id: SERIES_ID, title_en: 'Girl Rules', air_time: '20:30' }]);
		mockCallMiniMax.mockResolvedValueOnce('วันนี้มี Girl Rules เวลา 20:30 น.');

		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'ตารางฉายวันนี้มีอะไรบ้าง?' })) as Response;

		expect(response.status).toBe(200);
		expect(mockGetSeriesCatalogText).not.toHaveBeenCalled();
		expect(mockCallMiniMax).toHaveBeenCalledTimes(1);
		expect(mockRunReadOnlyQuery).toHaveBeenCalledTimes(1);
		expect(mockRunReadOnlyQuery.mock.calls[0][0]).toContain('series_schedules');
		expect(mockRunReadOnlyQuery.mock.calls[0][0]).toContain('episode_schedules');
		expect(mockAppendChatExchange).toHaveBeenCalledWith(
			'user-1',
			'conversation-1',
			'ตารางฉายวันนี้มีอะไรบ้าง?',
			'วันนี้มี Girl Rules เวลา 20:30 น.',
			{ type: 'schedule', seriesIds: [SERIES_ID] }
		);
		expect(await jsonBody(response)).toEqual({
			reply: 'วันนี้มี Girl Rules เวลา 20:30 น.',
			suggestions: [],
			context: { type: 'schedule', seriesIds: [SERIES_ID] }
		});
	});

	it('does not call MiniMax for follow-up suggestions by default', async () => {
		mockCallMiniMax.mockResolvedValueOnce('มี Namtan และ Film ค่ะ');
		mockRunReadOnlyQuery.mockResolvedValueOnce([{ artist_id: ARTIST_ID, nickname: 'Namtan' }, { nickname: 'Film' }]);

		const { POST } = await import('./+server.js');
		const response = await POST(event({ message: 'นักแสดงเรื่อง Pluto มีใครบ้าง' })) as Response;

		expect(response.status).toBe(200);
		expect(mockCallMiniMax).toHaveBeenCalledTimes(1);
		expect(mockGetSeriesCatalogText).not.toHaveBeenCalled();
		expect(await jsonBody(response)).toEqual({
			reply: 'มี Namtan และ Film ค่ะ',
			suggestions: [],
			context: { type: 'artist', artistIds: [ARTIST_ID] }
		});
	});

	it('writes timing logs when CHAT_PERF_LOG is enabled', async () => {
		process.env.CHAT_PERF_LOG = 'true';
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
		mockCallMiniMax
			.mockResolvedValueOnce('SELECT title_en FROM series WHERE deleted_at IS NULL')
			.mockResolvedValueOnce('มี Pluto ค่ะ');
		mockRunReadOnlyQuery.mockResolvedValueOnce([{ title_en: 'Pluto' }]);

		try {
			const { POST } = await import('./+server.js');
			const response = await POST(event({ message: 'มีซีรีส์อะไรบ้าง' })) as Response;

			expect(response.status).toBe(200);
			expect(infoSpy).toHaveBeenCalledWith(
				'[chat:perf]',
				expect.objectContaining({
					conversationId: 'conversation-1',
					messageLength: 'มีซีรีส์อะไรบ้าง'.length,
					steps: expect.any(Array),
					totalMs: expect.any(Number)
				})
			);
		} finally {
			infoSpy.mockRestore();
			delete process.env.CHAT_PERF_LOG;
		}
	});
});
