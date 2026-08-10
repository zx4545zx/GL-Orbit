import { generateText } from 'ai';
import { json } from '@sveltejs/kit';
import { getOwnedAiProvider } from '$lib/server/ai/profiles.js';
import { createChatModel } from '$lib/server/ai/providers/index.js';
import { checkRateLimit } from '$lib/server/rate-limit/index.js';
import { rateLimitKey } from '$lib/server/rate-limit/keys.js';
import { PROVIDER_REQUEST_TIMEOUT_MS } from '$lib/server/ai/providers/index.js';
import type { RequestHandler } from './$types.js';
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	const rate = await checkRateLimit(rateLimitKey('ai-provider-test', locals.user.id), 5, 60);
	if (!rate.allowed) return json({ error: 'Too many tests' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
	try {
		const body = await request.json() as { modelId?: unknown };
		const provider = await getOwnedAiProvider(locals.user.id, params.id);
		if (!provider || typeof body.modelId !== 'string' || !body.modelId.trim()) return json({ error: 'Choose an owned provider and model ID' }, { status: 400 });
		await generateText({ model: createChatModel(provider, body.modelId.trim()), prompt: 'Reply with OK.' , maxOutputTokens: 8, abortSignal: AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS) });
		return json({ ok: true });
	} catch { return json({ error: 'Provider connection failed' }, { status: 502 }); }
};
