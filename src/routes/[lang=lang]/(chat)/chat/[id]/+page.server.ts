import { error, redirect } from '@sveltejs/kit';
import {
	getChatMessages,
	getOwnedConversation,
	listChatConversations
} from '$lib/server/chat/history.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(303, '/login');

	const [conversations, activeConversation, messages] = await Promise.all([
		listChatConversations(locals.user.id),
		getOwnedConversation(locals.user.id, params.id),
		getChatMessages(locals.user.id, params.id)
	]);

	if (!activeConversation || !messages) throw error(404, 'ไม่พบแชตนี้');

	return {
		conversations,
		activeConversation,
		messages
	};
};
