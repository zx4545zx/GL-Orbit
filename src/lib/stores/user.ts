import { writable } from 'svelte/store';

export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	role: 'ADMIN' | 'USER';
}

export const user = writable<User | null>(null);
export const userLoading = writable(true);
