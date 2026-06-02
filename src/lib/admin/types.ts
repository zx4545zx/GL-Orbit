export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
