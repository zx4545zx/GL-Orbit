import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const root = new URL('../../../routes/[lang=lang]/(orbit-halo)/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('Orbit Halo UI', () => {
	it('keeps its dedicated shell separate from the information-app navigation', () => {
		const shell = read('+layout.svelte');
		expect(shell).toContain('grid-cols-[210px_minmax(0,620px)]');
		expect(shell).toContain('safe-area-bottom');
		expect(shell).not.toContain('Navigation.svelte');
		expect(shell).not.toContain('BottomNav.svelte');
	});

	it('offers source-linked composer, safe preview and detail comments', () => {
		expect(read('../../../lib/components/moments/MomentComposer.svelte')).toContain('type="url"');
		const preview = read('../../../lib/components/moments/EmbedPreview.svelte');
		expect(preview).toContain('rel="noreferrer"');
		expect(preview).toContain('www.youtube-nocookie.com/embed/');
		expect(preview).toContain('platform.x.com/widgets.js');
		expect(preview).toContain('<iframe');
		expect(read('halo/moments/[id]/+page.svelte')).toContain('expanded');
	});

	it('loads every Halo surface from real server data instead of sample Moments', () => {
		for (const page of [
			'halo/+page.svelte',
			'halo/explore/+page.svelte',
			'halo/saved/+page.svelte',
			'halo/moments/[id]/+page.svelte',
			'halo/u/[username]/+page.svelte'
		]) expect(read(page)).not.toContain('sampleMoments');

		expect(read('halo/+page.server.ts')).toContain('getMoments');
		expect(read('halo/explore/+page.server.ts')).toContain('getMoments');
		expect(read('halo/saved/+page.server.ts')).toContain('bookmarked: true');
		expect(read('halo/moments/[id]/+page.server.ts')).toContain('getMoment');
		expect(read('halo/u/[username]/+page.server.ts')).toContain('getHaloProfile');
		expect(read('+layout.server.ts')).toContain('getHaloDiscovery');
	});

	it('connects search, pagination, reports and comments to APIs', () => {
		expect(read('halo/explore/+page.svelte')).toContain('/api/${kind}?search=');
		expect(read('../../../lib/components/moments/MomentFeed.svelte')).toContain('/api/moments?');
		expect(read('../../../lib/components/moments/MomentReportDialog.svelte')).toContain('/report`');
		expect(read('../../../lib/components/moments/MomentComments.svelte')).toContain('/comments`');
	});
});
