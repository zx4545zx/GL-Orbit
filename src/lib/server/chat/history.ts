import { and, asc, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { chatConversationMessages, chatConversations } from '$lib/server/db/schema.js';

const HISTORY_DAYS = 30;
const DEFAULT_TITLE = '\u0e41\u0e0a\u0e15\u0e43\u0e2b\u0e21\u0e48';

export type ChatConversationSummary = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
};

export type ChatMessageItem = {
	id: string;
	role: 'USER' | 'ASSISTANT';
	content: string;
	createdAt: string;
};

function nextExpiry() {
	return new Date(Date.now() + HISTORY_DAYS * 24 * 60 * 60 * 1000);
}

function titleFromInput(input: string) {
	const cleaned = input.replace(/\s+/g, ' ').trim();
	if (!cleaned) return DEFAULT_TITLE;
	return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
}

export async function listChatConversations(userId: string, limit = 40): Promise<ChatConversationSummary[]> {
	const db = await getDb();
	const rows = await db
		.select({
			id: chatConversations.id,
			title: chatConversations.title,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt
		})
		.from(chatConversations)
		.where(and(eq(chatConversations.userId, userId), gt(chatConversations.expiresAt, new Date())))
		.orderBy(desc(chatConversations.updatedAt))
		.limit(limit);

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString()
	}));
}

export async function createChatConversation(userId: string, title = DEFAULT_TITLE) {
	const db = await getDb();
	const [emptyConversation] = await db
		.select({
			id: chatConversations.id,
			title: chatConversations.title,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt
		})
		.from(chatConversations)
		.leftJoin(chatConversationMessages, eq(chatConversationMessages.conversationId, chatConversations.id))
		.where(and(
			eq(chatConversations.userId, userId),
			gt(chatConversations.expiresAt, new Date()),
			isNull(chatConversationMessages.id)
		))
		.orderBy(desc(chatConversations.updatedAt))
		.limit(1);

	if (emptyConversation) {
		return {
			id: emptyConversation.id,
			title: emptyConversation.title,
			createdAt: emptyConversation.createdAt.toISOString(),
			updatedAt: emptyConversation.updatedAt.toISOString()
		};
	}

	const [row] = await db
		.insert(chatConversations)
		.values({ userId, title: titleFromInput(title), expiresAt: nextExpiry() })
		.returning({
			id: chatConversations.id,
			title: chatConversations.title,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt
		});

	return {
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString()
	};
}

export async function getOwnedConversation(userId: string, conversationId: string) {
	const db = await getDb();
	const [row] = await db
		.select({
			id: chatConversations.id,
			title: chatConversations.title,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt
		})
		.from(chatConversations)
		.where(and(
			eq(chatConversations.id, conversationId),
			eq(chatConversations.userId, userId),
			gt(chatConversations.expiresAt, new Date())
		))
		.limit(1);

	return row
		? {
				id: row.id,
				title: row.title,
				createdAt: row.createdAt.toISOString(),
				updatedAt: row.updatedAt.toISOString()
			}
		: null;
}

export async function renameChatConversation(userId: string, conversationId: string, title: string) {
	const db = await getDb();
	const [row] = await db
		.update(chatConversations)
		.set({ title: titleFromInput(title), updatedAt: new Date(), expiresAt: nextExpiry() })
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
		.returning({
			id: chatConversations.id,
			title: chatConversations.title,
			createdAt: chatConversations.createdAt,
			updatedAt: chatConversations.updatedAt
		});

	return row
		? {
				id: row.id,
				title: row.title,
				createdAt: row.createdAt.toISOString(),
				updatedAt: row.updatedAt.toISOString()
			}
		: null;
}

export async function deleteChatConversation(userId: string, conversationId: string) {
	const db = await getDb();
	const rows = await db
		.delete(chatConversations)
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
		.returning({ id: chatConversations.id });
	return rows.length > 0;
}

export async function getChatMessages(userId: string, conversationId: string): Promise<ChatMessageItem[] | null> {
	const conversation = await getOwnedConversation(userId, conversationId);
	if (!conversation) return null;

	const db = await getDb();
	const rows = await db
		.select({
			id: chatConversationMessages.id,
			role: chatConversationMessages.role,
			content: chatConversationMessages.content,
			createdAt: chatConversationMessages.createdAt
		})
		.from(chatConversationMessages)
		.where(eq(chatConversationMessages.conversationId, conversationId))
		.orderBy(asc(chatConversationMessages.createdAt));

	return rows.map((row) => ({
		id: row.id,
		role: row.role === 'ASSISTANT' ? 'ASSISTANT' : 'USER',
		content: row.content,
		createdAt: row.createdAt.toISOString()
	}));
}

export async function getRecentChatContext(userId: string, conversationId: string, turns = 6) {
	const messages = await getChatMessages(userId, conversationId);
	if (!messages) return null;
	return messages.slice(-turns * 2);
}

export async function appendChatExchange(userId: string, conversationId: string, question: string, reply: string) {
	const conversation = await getOwnedConversation(userId, conversationId);
	if (!conversation) return false;

	const db = await getDb();
	await db.insert(chatConversationMessages).values([
		{ conversationId, role: 'USER', content: question },
		{ conversationId, role: 'ASSISTANT', content: reply }
	]);

	const shouldSetTitle = conversation.title === DEFAULT_TITLE;
	await db
		.update(chatConversations)
		.set({
			title: shouldSetTitle ? titleFromInput(question) : conversation.title,
			updatedAt: sql`now()`,
			expiresAt: nextExpiry()
		})
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));

	return true;
}
