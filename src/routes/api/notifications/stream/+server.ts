import { subscribeUserNotifications } from '$lib/server/notifications-sse.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'กรุณาเข้าสู่ระบบ' }), { status: 401 });
	}

	const userId = locals.user.id;
	let cleanup: (() => void) | undefined;
	let keepAlive: ReturnType<typeof setInterval> | undefined;

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
				return;
			}

			// Keep connection alive every 30s; EventSource ignores comment lines
			keepAlive = setInterval(() => {
				try {
					controller.enqueue(new TextEncoder().encode(':keepalive\n\n'));
				} catch {
					cleanup?.();
				}
			}, 30000);
		},
		cancel() {
			if (keepAlive) clearInterval(keepAlive);
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
