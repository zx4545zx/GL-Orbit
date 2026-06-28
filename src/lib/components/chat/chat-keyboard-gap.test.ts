import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const layoutSource = readFileSync('src/routes/(chat)/+layout.svelte', 'utf-8');
const chatSource = readFileSync('src/lib/components/chat/ChatApp.svelte', 'utf-8');

describe('chat iOS keyboard gap regression', () => {
	it('locks document scrolling at the chat route shell', () => {
		expect(layoutSource).toContain("body.style.position = 'fixed';");
		expect(layoutSource).toContain("body.style.inset = '0';");
		expect(layoutSource).toContain("body.style.overflow = 'hidden';");
	});

	it('does not manually scroll the document on textarea blur while body is fixed', () => {
		expect(chatSource).not.toContain('onblur={resetIOSKeyboardGap}');
		expect(chatSource).not.toContain('window.scrollTo');
		expect(chatSource).not.toContain('document.body.scrollTop');
		expect(chatSource).not.toContain('document.documentElement.scrollTop');
	});
});
