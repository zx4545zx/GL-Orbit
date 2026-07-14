import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./+page.server.ts', import.meta.url), 'utf8');

describe('series explore page-data privacy', () => {
	it('does not publish authenticated parent data to shared caches', () => {
		expect(source).toContain("'cache-control': 'private, no-store'");
		expect(source).not.toContain("'cache-control': 'public");

		const publicPageServers = globSync('src/routes/**/+page.server.ts').filter((path) =>
			readFileSync(path, 'utf8').includes("'cache-control': 'public")
		);
		expect(publicPageServers).toEqual([]);
	});
});
