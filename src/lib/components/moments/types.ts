export type HaloComment = {
	id: string;
	author: string;
	body: string;
	time: string;
	reply?: HaloComment;
};

export type HaloMoment = {
	id: string;
	author: string;
	handle: string;
	initial: string;
	time: string;
	body: string;
	source: string;
	provider: 'YouTube' | 'TikTok' | 'X' | 'Link';
	tags: string[];
	likes: number;
	comments: HaloComment[];
	saved?: boolean;
};

export const sampleMoments: HaloMoment[] = [
	{
		id: 'moonlit-premiere', author: 'Mali S.', handle: 'maliscene', initial: 'M', time: '12m',
		body: 'The quiet look after the credits… I am still thinking about it. ✦',
		source: 'https://www.youtube.com/', provider: 'YouTube', tags: ['#Pluto', '#FirstKhaotung'], likes: 142,
		comments: [{ id: 'c1', author: 'Nina', body: 'Same. That final frame was everything.', time: '8m', reply: { id: 'r1', author: 'Mali S.', body: 'Exactly the feeling!', time: '4m' } }]
	},
	{
		id: 'soft-launch', author: 'June', handle: 'junebug', initial: 'J', time: '1h',
		body: 'New behind-the-scenes photos made the whole timeline softer today.',
		source: 'https://x.com/', provider: 'X', tags: ['#TheSecretOfUs', '#LingOrm'], likes: 88,
		comments: [{ id: 'c2', author: 'Koi', body: 'Saving these for a difficult day.', time: '46m' }]
	}
];
