import { describe, expect, it } from 'vitest';
import { canManageMoment } from './permissions.js';

describe('canManageMoment', () => {
	it('allows only the author or an admin', () => {
		expect(canManageMoment({ id: 'author', role: 'USER' }, 'author')).toBe(true);
		expect(canManageMoment({ id: 'other', role: 'USER' }, 'author')).toBe(false);
		expect(canManageMoment({ id: 'admin', role: 'ADMIN' }, 'author')).toBe(true);
	});
});
