type MomentAuthorRow = {
	id: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	email?: string;
	role?: 'ADMIN' | 'USER';
};

export function serializeMomentAuthor(author: MomentAuthorRow) {
	return { id: author.id, username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl };
}
