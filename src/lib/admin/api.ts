import { adminFetch } from './action-feedback.js';
import type { ApiResponse, PaginatedResponse } from './types.js';

const BASE = '/api/admin';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
	try {
		const res = await adminFetch(url, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...options?.headers
			}
		});
		const json = await res.json();
		if (!res.ok) {
			return { success: false, error: json.error || `HTTP ${res.status}` };
		}
		// Some admin endpoints already return { success, data }, while paginated GET
		// endpoints return raw { data, page, limit, total, totalPages }. Normalize
		// successful responses so callers can always rely on ApiResponse<T>.
		if (json && typeof json === 'object' && 'success' in json) {
			return json;
		}
		return { success: true, data: json as T };
	} catch {
		return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
	}
}

export function createAdminApi<T>(resource: string) {
	return {
		list: (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<T>>> =>
			fetchJson<PaginatedResponse<T>>(`${BASE}/${resource}?page=${page}&limit=${limit}`),
		listAll: (): Promise<ApiResponse<PaginatedResponse<T>>> =>
			fetchJson<PaginatedResponse<T>>(`${BASE}/${resource}?limit=999`),
		create: (body: unknown): Promise<ApiResponse<T>> =>
			fetchJson<T>(`${BASE}/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
		update: (id: string, body: unknown): Promise<ApiResponse<T>> =>
			fetchJson<T>(`${BASE}/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
		remove: (id: string): Promise<ApiResponse<void>> =>
			fetchJson<void>(`${BASE}/${resource}/${id}`, { method: 'DELETE' })
	};
}
