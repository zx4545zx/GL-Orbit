import { writable } from 'svelte/store';

type ToastType = 'loading' | 'success' | 'error';

export type AdminToast = {
	id: number;
	type: ToastType;
	title: string;
	message?: string;
};

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let nextId = 1;

export const adminToasts = writable<AdminToast[]>([]);
export const adminActiveActions = writable(0);

function actionLabel(method: string, pathname: string) {
	if (method === 'POST' && pathname.endsWith('/episodes')) return 'กำลังเพิ่มตอน';
	if (method === 'PUT' && pathname.includes('/episodes/')) return 'กำลังบันทึกตอน';
	if (method === 'DELETE' && pathname.includes('/episodes/')) return 'กำลังลบตอน';
	if (method === 'POST' && pathname.endsWith('/episode-schedules')) return 'กำลังเพิ่มลิงก์สตรีม';
	if (method === 'DELETE' && pathname.includes('/episode-schedules/')) return 'กำลังลบลิงก์สตรีม';
	if (method === 'POST' && pathname.endsWith('/schedules')) return 'กำลังเพิ่มตารางฉาย';
	if (method === 'DELETE' && pathname.includes('/schedules/')) return 'กำลังลบตารางฉาย';
	if (pathname.includes('/series-artists')) return method === 'DELETE' ? 'กำลังนำนักแสดงออก' : 'กำลังเพิ่มนักแสดง';
	if (pathname.includes('/artist-socials')) return method === 'DELETE' ? 'กำลังลบโซเชียล' : 'กำลังบันทึกโซเชียล';
	if (pathname.includes('/studio-socials')) return method === 'DELETE' ? 'กำลังลบช่องทาง' : 'กำลังบันทึกช่องทาง';
	if (pathname.includes('/artists')) return method === 'DELETE' ? 'กำลังลบนักแสดง' : 'กำลังบันทึกนักแสดง';
	if (pathname.includes('/series')) return method === 'DELETE' ? 'กำลังลบซีรีส์' : 'กำลังบันทึกซีรีส์';
	if (pathname.includes('/studios')) return method === 'DELETE' ? 'กำลังลบสตูดิโอ' : 'กำลังบันทึกสตูดิโอ';
	if (pathname.includes('/platforms')) return method === 'DELETE' ? 'กำลังลบแพลตฟอร์ม' : 'กำลังบันทึกแพลตฟอร์ม';
	if (pathname.includes('/genres')) return method === 'DELETE' ? 'กำลังลบประเภท' : 'กำลังบันทึกประเภท';
	return 'กำลังบันทึกข้อมูล';
}

function successLabel(method: string) {
	if (method === 'POST') return 'เพิ่มข้อมูลแล้ว';
	if (method === 'PUT' || method === 'PATCH') return 'บันทึกข้อมูลแล้ว';
	if (method === 'DELETE') return 'ลบข้อมูลแล้ว';
	return 'ดำเนินการสำเร็จ';
}

function addToast(type: ToastType, title: string, message?: string) {
	const id = nextId++;
	adminToasts.update((toasts) => [{ id, type, title, message }, ...toasts].slice(0, 4));
	return id;
}

function updateToast(id: number, type: ToastType, title: string, message?: string) {
	adminToasts.update((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, type, title, message } : toast)));
	if (type !== 'loading') {
		setTimeout(() => {
			adminToasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
		}, type === 'success' ? 1800 : 4200);
	}
}

async function readError(res: Response) {
	const json = await res.clone().json().catch(() => null);
	return (json as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
}

function requestInfo(input: RequestInfo | URL, init?: RequestInit) {
	const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
	const rawUrl = input instanceof Request ? input.url : input.toString();
	const url = new URL(rawUrl, globalThis.location?.origin ?? 'http://localhost');
	if (!mutatingMethods.has(method) || !url.pathname.startsWith('/api/admin')) return null;
	return { method, pathname: url.pathname };
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
	const info = requestInfo(input, init);
	if (!info) return fetch(input, init);

	adminActiveActions.update((count) => count + 1);
	const id = addToast('loading', actionLabel(info.method, info.pathname), 'โปรดรอสักครู่ ระบบกำลังประมวลผล');

	try {
		const res = await fetch(input, init);
		if (res.ok) {
			updateToast(id, 'success', successLabel(info.method));
		} else {
			updateToast(id, 'error', 'ดำเนินการไม่สำเร็จ', await readError(res));
		}
		return res;
	} catch (err) {
		updateToast(id, 'error', 'เชื่อมต่อไม่สำเร็จ', 'กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
		throw err;
	} finally {
		adminActiveActions.update((count) => Math.max(0, count - 1));
	}
}
