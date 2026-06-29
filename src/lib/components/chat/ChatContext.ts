export type ChatContextPayload =
	| { type: 'schedule'; seriesIds: string[] }
	| { type: 'artist'; artistIds: string[] }
	| { type: 'series'; seriesIds: string[] }
	| null;
