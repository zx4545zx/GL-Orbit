export function contentSecurityPolicy(): string {
	return [
		"default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'", "frame-ancestors 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' https: data:", "font-src 'self'", "connect-src 'self'", "frame-src https://www.youtube-nocookie.com"
	].join('; ');
}
