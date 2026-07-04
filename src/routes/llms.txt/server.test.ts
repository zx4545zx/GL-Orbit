import { describe, expect, it } from 'vitest';

describe('GET /llms.txt', () => {
	it('publishes localized public citation targets without deprecated schema guidance', async () => {
		const { GET } = await import('./+server.js');

		const response = (await GET({
			url: new URL('https://gl-orbit.com/llms.txt')
		} as never)) as Response;
		const body = await response.text();

		expect(response.headers.get('content-type')).toContain('text/markdown');
		expect(body).toContain('- [Thai home](https://gl-orbit.com/th)');
		expect(body).toContain('- [English home](https://gl-orbit.com/en)');
		expect(body).toContain('- [Thai series directory](https://gl-orbit.com/th/series)');
		expect(body).toContain('- [English series directory](https://gl-orbit.com/en/series)');
		expect(body).toContain('- [XML sitemap](https://gl-orbit.com/sitemap.xml)');
		expect(body).toContain('- [Robots.txt](https://gl-orbit.com/robots.txt)');
		expect(body.match(/\[[^\]]+\]\(https:\/\/gl-orbit\.com[^)]*\)/g)?.length).toBeGreaterThan(10);
		expect(body).not.toContain('https://gl-orbit.com/about');
		expect(body).not.toContain('FAQPage');
		expect(body).not.toContain('HowTo');
	});
});
