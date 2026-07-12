export function rateLimitKey(action: string, userId: string): string {
	return `${action}:${userId}`;
}
