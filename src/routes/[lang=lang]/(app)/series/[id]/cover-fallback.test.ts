import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('series hero cover fallback', () => {
	it('reuses a small poster candidate for the blurred fallback cover', () => {
		expect(source).toContain(
			'<Picture src={series.poster} type="posters" sizes="240px" alt="" width={1920} height={960} loading="eager" fetchpriority="high" class="sd-cover-img sd-cover-fb" />'
		);
	});
});
