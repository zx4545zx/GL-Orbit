export function contentSecurityPolicy(isDevelopment = false): string {
	const inline = isDevelopment ? " 'unsafe-inline'" : '';
	return [
		"default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'", "frame-ancestors 'self'", `script-src 'self'${inline} https://platform.x.com https://platform.twitter.com`, `style-src 'self'${inline}`, "img-src 'self' https: data:", "font-src 'self'", "connect-src 'self'", "frame-src https://www.youtube-nocookie.com https://www.tiktok.com https://platform.x.com https://platform.twitter.com"
	].join('; ');
}
