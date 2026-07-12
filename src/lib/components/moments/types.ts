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
	following?: boolean;
};

export const sampleMoments: HaloMoment[] = [
	{
		id: 'moonlit-premiere', author: 'Mali S.', handle: 'maliscene', initial: 'M', time: '12m',
		body: 'The quiet look after the credits… I am still thinking about it. ✦',
		source: 'https://youtu.be/qWfsiUJtIIw?si=4JKiVP0SrVAjvSEd', provider: 'YouTube', tags: ['#Pluto', '#FirstKhaotung'], likes: 142,
		comments: [{ id: 'c1', author: 'Nina', body: 'Same. That final frame was everything.', time: '8m', reply: { id: 'r1', author: 'Mali S.', body: 'Exactly the feeling!', time: '4m' } }],
		following: true
	},
	{
		id: 'soft-launch', author: 'June', handle: 'junebug', initial: 'J', time: '1h',
		body: 'New behind-the-scenes photos made the whole timeline softer today.',
		source: 'https://x.com/peachiipunch/status/2076182266154475740?s=20', provider: 'X', tags: ['#TheSecretOfUs', '#LingOrm'], likes: 88,
		comments: [{ id: 'c2', author: 'Koi', body: 'Saving these for a difficult day.', time: '46m' }]
	},
	{
		id: 'shorts-glow', author: 'Aom', handle: 'aomorbit', initial: 'A', time: '2h',
		body: 'โมเมนต์สั้น ๆ ที่ดูซ้ำได้ไม่รู้จบ ✦',
		source: 'https://youtube.com/shorts/MBkH-2GaTX4?si=rWQ2EbowesfbbUVo', provider: 'YouTube', tags: ['#GLShorts', '#OrbitHalo'], likes: 64,
		comments: [{ id: 'c3', author: 'Mali S.', body: 'ดูวนไปหลายรอบแล้วค่ะ 🥹', time: '1h' }],
		following: true
	},
	{
		id: 'x-stage-moment', author: 'Niky', handle: 'nikymajesty', initial: 'N', time: '3h',
		body: 'อีกหนึ่งโมเมนต์จากหน้าเวทีที่ต้องเก็บไว้ ✦',
		source: 'https://x.com/nikymajesty/status/2076189734314082815?s=20', provider: 'X', tags: ['#GLMoment', '#StageMoment'], likes: 51,
		comments: [{ id: 'c4', author: 'June', body: 'โมเมนต์นี้น่ารักมาก!', time: '2h' }]
	}
];
