import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const root = new URL('../../../routes/[lang=lang]/(orbit-halo)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('Orbit Halo UI', () => {
	it('keeps its dedicated shell separate from the information-app navigation', () => {
		const shell = read('+layout.svelte');
		expect(shell).toContain('grid-cols-[210px_minmax(0,740px)]');
		expect(shell).toContain('safe-area-bottom');
		expect(shell).not.toContain('Navigation.svelte');
		expect(shell).not.toContain('BottomNav.svelte');
	});

	it('offers source-linked composer, safe preview and detail comments', () => {
		expect(read('../../../lib/components/moments/MomentComposer.svelte')).toContain('type="url"');
		expect(read('../../../lib/components/moments/EmbedPreview.svelte')).toContain('rel="noreferrer"');
		expect(read('halo/moments/[id]/+page.svelte')).toContain('expanded');
	});
});
