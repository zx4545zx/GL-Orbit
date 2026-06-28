import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const layoutSource = readFileSync('src/routes/(chat)/+layout.svelte', 'utf-8');
const chatSource = readFileSync('src/lib/components/chat/ChatApp.svelte', 'utf-8');

describe('chat iOS keyboard gap regression', () => {
	it('locks document scrolling without fixing the body height', () => {
		expect(layoutSource).toContain("body.style.overflow = 'hidden';");
		expect(layoutSource).toContain("body.style.overscrollBehavior = 'none';");
		expect(layoutSource).not.toContain("body.style.position = 'fixed';");
		expect(layoutSource).not.toContain("body.style.inset = '0';");
		expect(layoutSource).not.toContain("body.style.height = '100%';");
	});

	it('does not manually scroll the document on textarea blur', () => {
		expect(chatSource).not.toContain('onblur={resetIOSKeyboardGap}');
		expect(chatSource).not.toContain('window.scrollTo');
		expect(chatSource).not.toContain('document.body.scrollTop');
		expect(chatSource).not.toContain('document.documentElement.scrollTop');
	});
});
