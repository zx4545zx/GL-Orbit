// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import type { DeviceSessionItem } from '$lib/types.js';
import SessionDeviceManager from './SessionDeviceManager.svelte';

const gotoMock = vi.hoisted(() => vi.fn());

vi.mock('$app/navigation', () => ({ goto: gotoMock }));

const currentSession: DeviceSessionItem = {
	id: '11111111-1111-4111-8111-111111111111',
	browser: 'Safari',
	operatingSystem: 'macOS',
	deviceType: 'desktop',
	maskedIp: '203.0.113.xxx',
	city: 'Bangkok',
	countryCode: 'TH',
	createdAt: '2026-07-20T08:00:00.000Z',
	lastSeenAt: '2026-07-21T08:30:00.000Z',
	expiresAt: '2026-08-20T08:00:00.000Z',
	isCurrent: true
};

const otherSession: DeviceSessionItem = {
	id: '22222222-2222-4222-8222-222222222222',
	browser: null,
	operatingSystem: null,
	deviceType: 'unknown',
	maskedIp: null,
	city: null,
	countryCode: null,
	createdAt: '2026-07-19T08:00:00.000Z',
	lastSeenAt: '2026-07-20T09:30:00.000Z',
	expiresAt: '2026-08-19T08:00:00.000Z',
	isCurrent: false
};

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

afterEach(cleanup);

beforeEach(() => {
	vi.restoreAllMocks();
	gotoMock.mockReset();
});

describe('SessionDeviceManager', () => {
	it('shows loading, then renders the current session first with privacy-safe metadata', async () => {
		let resolveFetch!: (value: Response) => void;
		globalThis.fetch = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)));
		render(SessionDeviceManager, { props: { lang: 'th' } });

		expect(screen.getByText(/กำลังโหลด session|loading sessions/i)).toBeTruthy();
		resolveFetch(jsonResponse({ sessions: [otherSession, currentSession] }));

		const currentBadge = await screen.findByText(/เครื่องนี้|this device/i);
		expect(currentBadge.closest('li')?.textContent).toContain('Safari');
		expect(screen.getByText(/203\.0\.113\.xxx/)).toBeTruthy();
		expect(screen.getByText(/Bangkok, TH/)).toBeTruthy();
		expect(screen.getByText(/เบราว์เซอร์ไม่ทราบชื่อ|unknown browser/i)).toBeTruthy();
		expect(screen.getAllByRole('button', { name: /ออกจากระบบ$|^log out$/i })).toHaveLength(1);
		expect(screen.getByText(/ไม่ใช้เพื่อโฆษณาหรือติดตามข้ามบริการ|not used for advertising or cross-service tracking/i)).toBeTruthy();
	});

	it('keeps a session visible while revocation is pending, then removes it after success', async () => {
		const user = userEvent.setup();
		let resolveDelete!: (value: Response) => void;
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ sessions: [currentSession, otherSession] }))
			.mockImplementationOnce(() => new Promise((resolve) => (resolveDelete = resolve)));
		globalThis.fetch = fetchMock;
		render(SessionDeviceManager, { props: { lang: 'th' } });

		await user.click(await screen.findByRole('button', { name: /ออกจากระบบ$|^log out$/i }));
		await user.click(screen.getByRole('button', { name: /ยืนยัน|confirm/i }));

		expect(fetchMock).toHaveBeenLastCalledWith(
			`/api/profile/sessions/${encodeURIComponent(otherSession.id)}`,
			{ method: 'DELETE' }
		);
		expect(screen.getByText(/เบราว์เซอร์ไม่ทราบชื่อ|unknown browser/i)).toBeTruthy();
		expect((screen.getByRole('button', { name: /ออกจากระบบอุปกรณ์อื่น|log out other devices/i }) as HTMLButtonElement).disabled).toBe(true);

		resolveDelete(jsonResponse({ success: true, revokedCount: 1 }));
		await waitFor(() => {
			expect(screen.queryByText(/เบราว์เซอร์ไม่ทราบชื่อ|unknown browser/i)).toBeNull();
			expect(screen.getByRole('status').textContent).toMatch(/1 session/i);
		});
	});

	it('confirms the other-session count and keeps only the current session after bulk logout', async () => {
		const user = userEvent.setup();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ sessions: [currentSession, otherSession] }))
			.mockResolvedValueOnce(jsonResponse({ success: true, revokedCount: 1 }));
		globalThis.fetch = fetchMock;
		render(SessionDeviceManager, { props: { lang: 'th' } });

		await user.click(await screen.findByRole('button', { name: /ออกจากระบบอุปกรณ์อื่น|log out other devices/i }));
		expect(screen.getByRole('dialog').textContent).toMatch(/1 session/i);
		await user.click(screen.getByRole('button', { name: /ยืนยัน|confirm/i }));

		await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
			'/api/profile/sessions/logout-others',
			{ method: 'POST' }
		));
		expect(await screen.findByText(/เครื่องนี้|this device/i)).toBeTruthy();
		expect(screen.queryByText(/เบราว์เซอร์ไม่ทราบชื่อ|unknown browser/i)).toBeNull();
	});

	it('retains rows after errors, supports retry, and redirects on 401', async () => {
		const user = userEvent.setup();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ sessions: [currentSession, otherSession] }))
			.mockResolvedValueOnce(jsonResponse({ error: 'failed' }, 500))
			.mockResolvedValueOnce(jsonResponse({ sessions: [currentSession, otherSession] }))
			.mockResolvedValueOnce(jsonResponse({ error: 'unauthorized' }, 401));
		globalThis.fetch = fetchMock;
		render(SessionDeviceManager, { props: { lang: 'th' } });

		await user.click(await screen.findByRole('button', { name: /ออกจากระบบ$|^log out$/i }));
		await user.click(screen.getByRole('button', { name: /ยืนยัน|confirm/i }));
		expect(await screen.findByRole('alert')).toBeTruthy();
		expect(screen.getByText(/เบราว์เซอร์ไม่ทราบชื่อ|unknown browser/i)).toBeTruthy();

		await user.click(screen.getByRole('button', { name: /ลองอีกครั้ง|try again/i }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
		await user.click(screen.getByRole('button', { name: /ออกจากระบบอุปกรณ์อื่น|log out other devices/i }));
		await user.click(screen.getByRole('button', { name: /ยืนยัน|confirm/i }));
		await waitFor(() => expect(gotoMock).toHaveBeenCalledWith('/th/login'));
	});
});
