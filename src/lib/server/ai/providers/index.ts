import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Agent } from 'undici';
import { resolvePublicProviderHost, validateProviderBaseUrl } from '../base-url.js';

export type ProviderType = 'OPENROUTER' | 'GOOGLE' | 'OPENAI_COMPATIBLE';
export type ProviderConfig = { type: ProviderType; baseUrl: string | null; apiKey: string };
export const PROVIDER_REQUEST_TIMEOUT_MS = 30_000;

async function safeCustomProviderFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
	for (let redirects = 0; redirects <= 3; redirects += 1) {
		const parsed = validateProviderBaseUrl(url);
		const resolved = await resolvePublicProviderHost(parsed);
		const dispatcher = new Agent({ connect: { lookup: (_host, _options, callback) => callback(null, resolved.address, resolved.family) } });
		const signals = [init?.signal, AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS)].filter(Boolean) as AbortSignal[];
		try {
			const response = await fetch(parsed, { ...init, signal: AbortSignal.any(signals), redirect: 'manual', dispatcher } as RequestInit);
			if (![301, 302, 303, 307, 308].includes(response.status)) return response;
			const location = response.headers.get('location');
			if (!location || redirects === 3) throw new Error('Provider redirect was rejected');
			url = new URL(location, parsed).toString();
		} finally { await dispatcher.close(); }
	}
	throw new Error('Provider redirect was rejected');
}

export function createChatModel(config: ProviderConfig, modelId: string) {
	if (!modelId.trim()) throw new Error('Model ID is required');
	switch (config.type) {
		case 'OPENROUTER': return createOpenRouter({ apiKey: config.apiKey }).chat(modelId);
		case 'GOOGLE': return createGoogleGenerativeAI({ apiKey: config.apiKey })(modelId);
		case 'OPENAI_COMPATIBLE': return createOpenAI({ apiKey: config.apiKey, baseURL: validateProviderBaseUrl(config.baseUrl), fetch: safeCustomProviderFetch }).chat(modelId);
	}
}
