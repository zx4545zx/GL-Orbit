import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const componentsDir = 'src/lib/components';

describe('PendingShell removal — (app)/+layout.svelte', () => {
	const content = readFileSync('src/routes/(app)/+layout.svelte', 'utf-8');

	it('no longer imports any PendingShell components', () => {
		expect(content).not.toMatch(/PendingShell/);
	});

	it('no longer uses showShell state or shell switching', () => {
		expect(content).not.toMatch(/showShell/);
		expect(content).not.toMatch(/\{\#if showShell/);
	});

	it('directly renders children without conditional shell', () => {
		// Must have @render children() not inside an #if block
		const lines = content.split('\n');
		const renderLine = lines.findIndex(l => l.includes('@render children()'));
		expect(renderLine).toBeGreaterThanOrEqual(0);
		// Should not have any PendingShell component reference
		expect(content).not.toMatch(/HomePendingShell|SeriesPendingShell|SeriesDetailPendingShell|CalendarPendingShell/);
	});
});

describe('PendingShell removal — admin/+layout.svelte', () => {
	const content = readFileSync('src/routes/admin/+layout.svelte', 'utf-8');

	it('no longer imports any Admin*PendingShell components', () => {
		expect(content).not.toMatch(/PendingShell/);
	});

	it('no longer uses shellMap or pendingAdminShell', () => {
		expect(content).not.toMatch(/shellMap/);
		expect(content).not.toMatch(/pendingAdminShell/);
	});

	it('directly renders children without conditional shell switch', () => {
		expect(content).not.toMatch(/AdminSeriesPendingShell/);
		expect(content).not.toMatch(/AdminArtistsPendingShell/);
		expect(content).not.toMatch(/AdminStudiosPendingShell/);
		expect(content).not.toMatch(/AdminPlatformsPendingShell/);
		expect(content).not.toMatch(/AdminEpisodesPendingShell/);
		expect(content).not.toMatch(/AdminSchedulesPendingShell/);
	});
});

describe('PendingShell removal — calendar/+page.svelte', () => {
	const content = readFileSync('src/routes/(app)/calendar/+page.svelte', 'utf-8');

	it('no longer imports CalendarPendingShell', () => {
		expect(content).not.toMatch(/CalendarPendingShell/);
	});

	it('no longer uses isNavigating for shell display', () => {
		expect(content).not.toMatch(/isNavigating/);
	});

	it('no longer has conditional shell rendering block', () => {
		expect(content).not.toMatch(/\{\#if isNavigating\}/);
	});
});

describe('PendingShell file deletion', () => {
	const files = readdirSync(componentsDir);

	it('no *PendingShell*.svelte files remain', () => {
		const pendingShellFiles = files.filter(f => f.includes('PendingShell') && f.endsWith('.svelte'));
		expect(pendingShellFiles).toHaveLength(0);
	});

	it('no PublicBaseShell.svelte file remains', () => {
		expect(existsSync(join(componentsDir, 'PublicBaseShell.svelte'))).toBe(false);
	});

	it('no AdminBaseShell.svelte file remains', () => {
		expect(existsSync(join(componentsDir, 'AdminBaseShell.svelte'))).toBe(false);
	});
});
