export function contentSecurityPolicy(isDevelopment = false): string {
	const inline = isDevelopment ? " 'unsafe-inline'" : '';
	return [
		"default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'", "frame-ancestors 'self'", `script-src 'self'${inline}`, `style-src 'self'${inline}`, "img-src 'self' https: data:", "font-src 'self'", "connect-src 'self'", "frame-src https://www.youtube-nocookie.com"
	].join('; ');
}
