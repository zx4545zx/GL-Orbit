import { describe, expect, it } from 'vitest';

describe('GET /robots.txt', () => {
	it('allows public discovery while blocking localized private routes', async () => {
		const { GET } = await import('./+server.js');

		const response = (await GET({
			url: new URL('https://gl-orbit.com/robots.txt')
		} as never)) as Response;
		const body = await response.text();

		expect(response.headers.get('content-type')).toContain('text/plain');
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
		expect(body).toContain('Disallow: /api/');
		expect(body).toContain('Disallow: /th/admin/');
		expect(body).toContain('Disallow: /en/admin/');
		expect(body).toContain('Disallow: /th/login');
		expect(body).toContain('Disallow: /en/register');
		expect(body).toContain('Disallow: /th/profile');
		expect(body).toContain('Disallow: /en/notifications');
		expect(body).not.toContain('Disallow: /th/series');
		expect(body).toContain('Sitemap: https://gl-orbit.com/sitemap.xml');
		expect(body).toContain('# LLM context: https://gl-orbit.com/llms.txt');
	});
});
