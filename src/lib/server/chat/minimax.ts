type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

type ChatCompletionResponse = {
	choices?: Array<{
		message?: {
			content?: string;
		};
		text?: string;
	}>;
	reply?: string;
	reply_text?: string;
};

export class MiniMaxConfigError extends Error {}

function stripReasoning(content: string) {
	return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function getMiniMaxConfig() {
	const apiKey = process.env.MINIMAX_API_KEY;
	if (!apiKey) {
		throw new MiniMaxConfigError('MINIMAX_API_KEY is not set');
	}

	return {
		apiKey,
		baseUrl: (process.env.MINIMAX_API_BASE_URL ?? 'https://api.minimax.io/v1').replace(/\/$/, ''),
		model: process.env.MINIMAX_MODEL ?? 'MiniMax-Text-01'
	};
}

export async function callMiniMax(messages: ChatMessage[]): Promise<string> {
	const config = getMiniMaxConfig();
	const response = await fetch(`${config.baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: config.model,
			messages,
			temperature: 0.1
		})
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		throw new Error(`MiniMax request failed: ${response.status} ${detail.slice(0, 300)}`);
	}

	const data = await response.json() as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? data.reply ?? data.reply_text;
	if (!content || !content.trim()) {
		throw new Error('MiniMax returned an empty response');
	}

	return stripReasoning(content);
}
