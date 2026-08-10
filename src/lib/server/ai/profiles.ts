import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { aiModelProfiles, aiProviderConfigs } from '$lib/server/db/schema.js';
import { decryptAiCredential, encryptAiCredential } from './crypto.js';
import { validateProviderBaseUrl } from './base-url.js';
import type { ProviderType } from './providers/index.js';

const providerTypes = new Set<ProviderType>(['OPENROUTER', 'GOOGLE', 'OPENAI_COMPATIBLE']);
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export type PublicProviderConfig = { id: string; type: ProviderType; name: string; baseUrl: string | null; createdAt: string; updatedAt: string };
export type PublicModelProfile = { id: string; providerConfigId: string; name: string; modelId: string; isDefault: boolean; createdAt: string; updatedAt: string };

function providerDto(row: typeof aiProviderConfigs.$inferSelect): PublicProviderConfig { return { id: row.id, type: row.type, name: row.name, baseUrl: row.baseUrl, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }
function profileDto(row: typeof aiModelProfiles.$inferSelect): PublicModelProfile { return { id: row.id, providerConfigId: row.providerConfigId, name: row.name, modelId: row.modelId, isDefault: row.isDefault, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }

export async function listAiSettings(userId: string) {
	const db = await getDb();
	const [providers, profiles] = await Promise.all([
		db.select().from(aiProviderConfigs).where(eq(aiProviderConfigs.userId, userId)).orderBy(desc(aiProviderConfigs.updatedAt)),
		db.select().from(aiModelProfiles).where(eq(aiModelProfiles.userId, userId)).orderBy(desc(aiModelProfiles.updatedAt))
	]);
	return { providers: providers.map(providerDto), profiles: profiles.map(profileDto) };
}

export async function createAiProvider(userId: string, input: Record<string, unknown>) {
	const type = input.type;
	const name = clean(input.name, 120);
	const apiKey = clean(input.apiKey, 4096);
	if (typeof type !== 'string' || !providerTypes.has(type as ProviderType) || !name || !apiKey) throw new Error('Provider type, name, and API key are required');
	const baseUrl = type === 'OPENAI_COMPATIBLE' ? validateProviderBaseUrl(input.baseUrl) : null;
	const db = await getDb();
	const id = crypto.randomUUID();
	const [row] = await db.insert(aiProviderConfigs).values({ id, userId, type: type as ProviderType, name, baseUrl, credential: encryptAiCredential(apiKey, `ai-provider:${userId}:${id}:v2`) }).returning();
	return providerDto(row);
}

export async function deleteAiProvider(userId: string, id: string) {
	const db = await getDb();
	return (await db.delete(aiProviderConfigs).where(and(eq(aiProviderConfigs.id, id), eq(aiProviderConfigs.userId, userId))).returning({ id: aiProviderConfigs.id })).length > 0;
}

export async function createAiProfile(userId: string, input: Record<string, unknown>) {
	const providerConfigId = clean(input.providerConfigId, 64); const name = clean(input.name, 120); const modelId = clean(input.modelId, 255);
	if (!providerConfigId || !name || !modelId) throw new Error('Provider, profile name, and model ID are required');
	const db = await getDb();
	const [provider] = await db.select({ id: aiProviderConfigs.id }).from(aiProviderConfigs).where(and(eq(aiProviderConfigs.id, providerConfigId), eq(aiProviderConfigs.userId, userId))).limit(1);
	if (!provider) throw new Error('Provider was not found');
	return db.transaction(async (tx) => {
		const [existing] = await tx.select({ id: aiModelProfiles.id }).from(aiModelProfiles).where(and(eq(aiModelProfiles.userId, userId), eq(aiModelProfiles.isDefault, true))).limit(1);
		const [row] = await tx.insert(aiModelProfiles).values({ userId, providerConfigId, name, modelId, isDefault: !existing }).returning();
		return profileDto(row);
	});
}

export async function setDefaultAiProfile(userId: string, id: string) {
	const db = await getDb();
	return db.transaction(async (tx) => {
		const [target] = await tx.select().from(aiModelProfiles).where(and(eq(aiModelProfiles.id, id), eq(aiModelProfiles.userId, userId))).limit(1);
		if (!target) return null;
		await tx.update(aiModelProfiles).set({ isDefault: false, updatedAt: new Date() }).where(and(eq(aiModelProfiles.userId, userId), eq(aiModelProfiles.isDefault, true)));
		const [row] = await tx.update(aiModelProfiles).set({ isDefault: true, updatedAt: new Date() }).where(eq(aiModelProfiles.id, id)).returning();
		return profileDto(row);
	});
}

export async function deleteAiProfile(userId: string, id: string) {
	const db = await getDb();
	return db.transaction(async (tx) => {
		const [removed] = await tx.delete(aiModelProfiles).where(and(eq(aiModelProfiles.id, id), eq(aiModelProfiles.userId, userId))).returning();
		if (removed?.isDefault) {
			const [next] = await tx.select().from(aiModelProfiles).where(eq(aiModelProfiles.userId, userId)).orderBy(desc(aiModelProfiles.updatedAt)).limit(1);
			if (next) await tx.update(aiModelProfiles).set({ isDefault: true, updatedAt: new Date() }).where(eq(aiModelProfiles.id, next.id));
		}
		return Boolean(removed);
	});
}

export async function getOwnedAiProfile(userId: string, profileId?: string | null) {
	const db = await getDb();
	const where = profileId ? and(eq(aiModelProfiles.id, profileId), eq(aiModelProfiles.userId, userId)) : and(eq(aiModelProfiles.userId, userId), eq(aiModelProfiles.isDefault, true));
	const [row] = await db.select({ profile: aiModelProfiles, provider: aiProviderConfigs }).from(aiModelProfiles).innerJoin(aiProviderConfigs, and(eq(aiModelProfiles.providerConfigId, aiProviderConfigs.id), eq(aiModelProfiles.userId, aiProviderConfigs.userId))).where(where).limit(1);
	if (!row) return null;
	return { profile: profileDto(row.profile), provider: { type: row.provider.type, baseUrl: row.provider.baseUrl, apiKey: decryptAiCredential(row.provider.credential, `ai-provider:${userId}:${row.provider.id}:v2`) } };
}

export async function getOwnedAiProvider(userId: string, providerId: string) {
	const db = await getDb();
	const [row] = await db.select().from(aiProviderConfigs).where(and(eq(aiProviderConfigs.id, providerId), eq(aiProviderConfigs.userId, userId))).limit(1);
	if (!row) return null;
	return { type: row.type, baseUrl: row.baseUrl, apiKey: decryptAiCredential(row.credential, `ai-provider:${userId}:${row.id}:v2`) };
}
