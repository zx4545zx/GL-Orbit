import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl } from './youtube.js';

describe('parseYouTubeUrl', () => {
	it.each([
		'https://youtube.com/watch?v=dQw4w9WgXcQ',
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=orbit',
		'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
		'https://youtu.be/dQw4w9WgXcQ?t=12',
		'https://youtube.com/shorts/dQw4w9WgXcQ?si=tracking',
		'https://www.youtube.com/shorts/dQw4w9WgXcQ',
		'https://m.youtube.com/shorts/dQw4w9WgXcQ'
	])('canonicalizes %s', (input) => {
		expect(parseYouTubeUrl(input)).toEqual({
			canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			videoId: 'dQw4w9WgXcQ'
		});
	});

	it.each([
		'', 'http://youtube.com/watch?v=dQw4w9WgXcQ',
		'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtube.com:8443/watch?v=dQw4w9WgXcQ',
		'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
		'https://evil.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtube-nocookie.com/embed/dQw4w9WgXcQ',
		'https://youtube.com/embed/dQw4w9WgXcQ',
		'https://youtube.com/live/dQw4w9WgXcQ',
		'https://youtube.com/watch/dQw4w9WgXcQ',
		'https://youtube.com/shorts/dQw4w9WgXcQ/extra',
		'https://youtu.be/dQw4w9WgXcQ/extra',
		'https://youtu.be/dQw4w9WgXc',
		'https://youtu.be/dQw4w9WgXcQQ',
		'https://youtu.be/dQw4w9Wg%58cQ',
		'https://youtu.be/#dQw4w9WgXcQ',
		'https://youtube.com/playlist?list=abc',
		'https://youtube.com/watch?list=abc'
	])('rejects %s', (input) => expect(parseYouTubeUrl(input)).toBeNull());
});
