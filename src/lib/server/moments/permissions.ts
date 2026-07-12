type MomentActor = { id: string; role: 'ADMIN' | 'USER' };

export function canManageMoment(actor: MomentActor, authorId: string): boolean {
	return actor.role === 'ADMIN' || actor.id === authorId;
}
