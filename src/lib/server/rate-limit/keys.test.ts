import { describe, expect, it } from 'vitest';
import { rateLimitKey } from './keys.js';

describe('rateLimitKey', () => {
	it('scopes a limit to action and user', () => {
		expect(rateLimitKey('moment:create', 'user-1')).toBe('moment:create:user-1');
	});
});
