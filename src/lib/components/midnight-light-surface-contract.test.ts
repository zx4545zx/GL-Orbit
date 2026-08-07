import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const menus = readFileSync('src/routes/[lang=lang]/(app)/menus/+page.svelte', 'utf8');
const shareButton = readFileSync('src/lib/components/ShareButton.svelte', 'utf8');
const shipDetail = readFileSync('src/routes/[lang=lang]/(app)/ships/[id]/+page.svelte', 'utf8');
const artistDetail = readFileSync('src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte', 'utf8');

describe('Midnight light-surface contrast contracts', () => {
	it('uses a dark semantic foreground for inactive white language cards', () => {
		expect(menus).toContain("'border-lavender/30 bg-white text-[color:var(--orbit-rail)] hover:bg-lavender/10'");
	});

	it('keeps the orbit share control and its white menu content dark on light surfaces', () => {
		expect(shareButton).toContain('bg-[#f0ebf8] p-3 text-left text-[color:var(--orbit-rail)]');
		expect(shareButton).toContain("'bg-white text-[color:var(--orbit-rail)]'");
		expect(shareButton).toContain("variant === 'orbit' ? `text-[color:var(--orbit-rail)]");
		expect(shareButton).toContain("variant === 'orbit' ? 'text-[color:var(--orbit-rail)]' : 'text-plum'");
		expect(shareButton).toContain('focus-visible:text-[color:var(--orbit-rail)]');
	});

	it('uses Midnight ink for ship hero text against the dark rail', () => {
		expect(shipDetail).toContain(":global([data-theme='midnight']) .sh-hero {");
		expect(shipDetail).toContain('color: var(--orbit-ink);');
	});

	it('uses Midnight ink for artist hero text against the dark rail', () => {
		expect(artistDetail).toContain(":global([data-theme='midnight']) .ad-hero {");
		expect(artistDetail).toContain(
			':global([data-theme=\'midnight\']) .ad-hero :is(.ad-back, .ad-hero-chip, .ad-kicker, .ad-photo-cap, .ad-meta-no, .ad-meta-n) {'
		);
	});
});
