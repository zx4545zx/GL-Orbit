import { describe, expect, it } from 'vitest';
import { _parseExploreMode } from './+page.server.js';

describe('parseExploreMode', () => {
	it('keeps a clean URL in overview mode', () => {
		expect(_parseExploreMode(new URLSearchParams())).toBe('overview');
	});

	it.each(['series', 'artists', 'ships'] as const)('restores %s mode from the query', (mode) => {
		expect(_parseExploreMode(new URLSearchParams({ view: mode }))).toBe(mode);
	});

	it('defaults a search or status query to series', () => {
		expect(_parseExploreMode(new URLSearchParams({ search: 'gap' }))).toBe('series');
		expect(_parseExploreMode(new URLSearchParams({ status: 'ongoing' }))).toBe('series');
	});

	it('ignores unsupported modes unless a listing query exists', () => {
		expect(_parseExploreMode(new URLSearchParams({ view: 'nope' }))).toBe('overview');
		expect(_parseExploreMode(new URLSearchParams({ view: 'nope', search: 'x' }))).toBe('series');
	});
});
