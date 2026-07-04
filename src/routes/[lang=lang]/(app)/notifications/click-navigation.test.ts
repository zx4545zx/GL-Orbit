import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const notificationsPagePath = resolve(__dirname, '+page.svelte');
const dropdownPath = resolve(
	__dirname,
	'../../../../lib/components/NotificationDropdown.svelte'
);

function extractFunctionBody(source: string, fnName: string): string[] {
	const lines = source.split('\n');
	const startIdx = lines.findIndex((l) => l.includes(`function ${fnName}`) || l.includes(`async function ${fnName}`));
	if (startIdx === -1) return [];

	const body: string[] = [];
	let depth = 0;
	let started = false;

	for (let i = startIdx; i < lines.length; i++) {
		const line = lines[i];
		body.push(line);
		for (const ch of line) {
			if (ch === '{') depth++;
			if (ch === '}') depth--;
		}
		if (depth === 0 && started) break;
		started = true;
	}
	return body;
}

describe('notification click navigation — immediate goto before mark-read fetch', () => {
	const pageSource = readFileSync(notificationsPagePath, 'utf-8');
	const dropdownSource = readFileSync(dropdownPath, 'utf-8');

	it('notifications page markRead calls goto before fetch', () => {
		const body = extractFunctionBody(pageSource, 'markRead');

		const gotoIdx = body.findIndex((l) => l.includes('goto('));
		const fetchIdx = body.findIndex((l) => l.includes('await fetch'));

		expect(gotoIdx).toBeGreaterThanOrEqual(0);
		expect(fetchIdx).toBeGreaterThanOrEqual(0);
		// goto must appear BEFORE await fetch for immediate navigation
		expect(gotoIdx).toBeLessThan(fetchIdx);
	});

	it('NotificationDropdown markRead calls goto before fetch', () => {
		const body = extractFunctionBody(dropdownSource, 'markRead');

		const gotoIdx = body.findIndex((l) => l.includes('goto('));
		const fetchIdx = body.findIndex((l) => l.includes('await fetch'));

		expect(gotoIdx).toBeGreaterThanOrEqual(0);
		expect(fetchIdx).toBeGreaterThanOrEqual(0);
		expect(gotoIdx).toBeLessThan(fetchIdx);
	});
});
