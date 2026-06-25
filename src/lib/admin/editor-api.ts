import { adminFetch } from './action-feedback.js';
import type { ApiResult } from './editor-types.js';

async function req<T = unknown>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
	try {
		const res = await adminFetch(url, {
			credentials: 'include',
			headers: { 'Content-Type': 'application/json', ...options?.headers },
			...options
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
		}
		return { ok: true, data: json as T };
	} catch {
		return { ok: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
	}
}

/**
 * API helpers สำหรับ Series Editor — ครอบคลุมทุก mutation
 * หลังเรียกแต่ละฟังก์ชัน component ควรเรียก refresh() (invalidateAll)
 */
export const editorApi = {
	// ── ข้อมูลหลักของซีรีส์ ──────────────────────────────
	updateSeries: (id: string, body: Record<string, unknown>) =>
		req<{ success: boolean }>(`/api/admin/series/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

	// ── นักแสดง (cast) ──────────────────────────────────
	addArtist: (seriesId: string, artistId: string, roleName: string | null) =>
		req('/api/admin/series-artists', {
			method: 'POST',
			body: JSON.stringify({ seriesId, artistId, roleName })
		}),
	removeArtist: (seriesId: string, artistId: string) =>
		req(`/api/admin/series-artists?seriesId=${seriesId}&artistId=${artistId}`, { method: 'DELETE' }),

	// ── ตอน (episodes) ──────────────────────────────────
	addEpisode: (seriesId: string, episodeNumber: number, title: string | null) =>
		req('/api/admin/episodes', {
			method: 'POST',
			body: JSON.stringify({ seriesId, episodeNumber, title })
		}),
	updateEpisode: (
		id: string,
		body: { seriesId: string; episodeNumber: number; title: string | null; coverUrl: string | null; trailerUrl: string | null }
	) => req(`/api/admin/episodes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
	removeEpisode: (id: string) => req(`/api/admin/episodes/${id}`, { method: 'DELETE' }),

	// ── ช่องทาง/ลิงก์สตรีมของแต่ละตอน ───────────────────
	addEpisodeSchedule: (body: {
		episodeId: string;
		platformId: string;
		airDate: string;
		streamLink: string | null;
		isUncut: boolean;
	}) => req('/api/admin/episode-schedules', { method: 'POST', body: JSON.stringify(body) }),
	updateEpisodeSchedule: (id: string, body: {
		episodeId: string;
		platformId: string;
		airDate: string;
		streamLink: string | null;
		isUncut: boolean;
	}) => req(`/api/admin/episode-schedules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
	removeEpisodeSchedule: (id: string) => req(`/api/admin/episode-schedules/${id}`, { method: 'DELETE' }),
	addSchedule: (body: {
		seriesId: string;
		platformId: string;
		dayOfWeek: number;
		airTime: string;
		isUncut: boolean;
	}) => req('/api/admin/schedules', { method: 'POST', body: JSON.stringify(body) }),
	removeSchedule: (id: string) => req(`/api/admin/schedules/${id}`, { method: 'DELETE' }),

	// ── สร้าง entity ใหม่ (inline) ───────────────────────
	createStudio: (name: string) =>
		req<{ id: string; name: string }>('/api/admin/studios', { method: 'POST', body: JSON.stringify({ name }) }),
	createPlatform: (name: string) =>
		req<{ data: { id: string; name: string } }>('/api/admin/platforms', { method: 'POST', body: JSON.stringify({ name }) }),
	createArtist: (nickname: string, fullNameEn: string, fullNameTh: string | null, profileImageUrl: string | null) =>
		req<{ id: string; nickname: string }>('/api/admin/artists', {
			method: 'POST',
			body: JSON.stringify({ nickname, fullNameEn, fullNameTh, profileImageUrl })
		}),
	createGenre: (name: string) =>
		req<{ success: boolean; data: { id: string; name: string } }>('/api/admin/genres', {
			method: 'POST',
			body: JSON.stringify({ name })
		})
};

/** คลี่ response ของการสร้าง entity ให้เป็น {id, name} แบบเท่ากันทุกประเภท */
export function unwrapCreated<T extends { id: string; name?: string; nickname?: string }>(
	res: ApiResult<unknown>,
	fallbackName?: string
): { ok: true; value: T } | { ok: false; error: string } {
	if (!res.ok || !res.data) {
		return { ok: false, error: res.error ?? 'เกิดข้อผิดพลาด' };
	}
	const d = res.data as Record<string, unknown>;
	// platforms ห่อด้วย { data: {...} }
	const inner = (d.data as Record<string, unknown>) ?? d;
	const value = {
		id: inner.id as string,
		name: (inner.name as string) ?? (inner.nickname as string) ?? fallbackName
	} as unknown as T;
	return { ok: true, value };
}
