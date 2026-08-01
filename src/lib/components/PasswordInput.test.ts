// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import PasswordInput from './PasswordInput.svelte';

describe('PasswordInput', () => {
	afterEach(cleanup);
	it('associates label, uses control class, and toggles visibility', async () => {
		render(PasswordInput, {
			id: 'password-test',
			label: 'Password',
			autocomplete: 'current-password'
		});
		const input = screen.getByLabelText('Password');
		expect(input.classList.contains('orbit-control')).toBe(true);
		expect(input.classList.contains('orbit-input')).toBe(true);
		expect(input.getAttribute('autocomplete')).toBe('current-password');
		const toggle = screen.getByRole('button', { name: /show password|แสดงรหัสผ่าน/i });
		toggle.click();
		await tick();
		expect(input.getAttribute('type')).toBe('text');
		expect(screen.getByRole('button', { name: /hide password|ซ่อนรหัสผ่าน/i })).toBeTruthy();
	});
});
