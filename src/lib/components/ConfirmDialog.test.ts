// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog.svelte';

describe('ConfirmDialog', () => {
	afterEach(cleanup);
	it('keeps dialog semantics and invokes confirm/cancel callbacks', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(ConfirmDialog, { open: true, title: 'Delete?', message: 'Really?', onconfirm, oncancel });
		const dialog = screen.getByRole('dialog');
		expect(dialog.classList.contains('orbit-dialog')).toBe(true);
		const panel = dialog.querySelector('.orbit-dialog-panel');
		expect(panel).toBeTruthy();
		expect(panel?.classList.contains('glass-card-strong')).toBe(false);
		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(screen.getByText('Delete?')).toBeTruthy();
		expect(screen.getByText('Really?')).toBeTruthy();
		const cancel = screen.getByTestId('confirm-cancel');
		await waitFor(() => expect(document.activeElement).toBe(cancel));
		cancel.click();
		expect(oncancel).toHaveBeenCalledOnce();
		render(ConfirmDialog, { open: true, title: 'Delete?', message: 'Really?', onconfirm, oncancel });
		screen.getAllByRole('button').at(-1)?.click();
		expect(onconfirm).toHaveBeenCalledOnce();
	});
});
