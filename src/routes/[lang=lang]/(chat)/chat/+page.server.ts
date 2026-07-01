import { redirect } from '@sveltejs/kit';
import { listChatConversations } from '$lib/server/chat/history.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	return {
		conversations: await listChatConversations(locals.user.id),
		activeConversation: null,
		messages: []
	};
};
