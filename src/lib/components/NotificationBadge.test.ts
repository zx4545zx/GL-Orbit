// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, it, expect } from 'vitest';
import NotificationBadge from './NotificationBadge.svelte';

describe('NotificationBadge', () => {
	afterEach(cleanup);
	it('should render when count > 0', () => {
		render(NotificationBadge, { count: 3 });
		const badge = screen.getByLabelText(/notifications|การแจ้งเตือน/i);
		expect(badge.classList.contains('orbit-badge')).toBe(true);
		expect(badge.textContent).toContain('3');
	});

	it('should not render when count = 0', () => {
		render(NotificationBadge, { count: 0 });
		expect(screen.queryByLabelText(/notifications|การแจ้งเตือน/i)).toBeNull();
	});

	it('should show 99+ when count > 99', () => {
		render(NotificationBadge, { count: 100 });
		expect(screen.getByLabelText(/notifications|การแจ้งเตือน/i).textContent).toContain('99+');
	});
});
