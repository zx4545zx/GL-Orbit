import { subscribeUserNotifications } from '$lib/server/notifications-sse.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'กรุณาเข้าสู่ระบบ' }), { status: 401 });
	}

	const userId = locals.user.id;
	let cleanup: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			cleanup = subscribeUserNotifications(userId, controller);

			const hello = new TextEncoder().encode(
				`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`
			);
			try {
				controller.enqueue(hello);
			} catch {
				cleanup?.();
			}
		},
		cancel() {
			cleanup?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
