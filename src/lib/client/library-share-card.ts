export const LIBRARY_CARD_WIDTH = 1080;
export const LIBRARY_CARD_HEIGHT = 1350;

export interface LibraryShareFavorite {
	title: string;
	poster: string | null;
}

export interface LibraryShareCardInput {
	lang: 'th' | 'en';
	displayName: string;
	avatarUrl: string | null;
	favoriteCount: number;
	watchedCount: number;
	favorites: LibraryShareFavorite[];
	createdAt: Date;
}

export interface LibraryShareCopy {
	title: string;
	text: string;
}

const COLOR = {
	paper: '#fffaf3',
	surface: '#ffffff',
	plum: '#3f2738',
	muted: '#765f70',
	line: '#d9cbd4',
	coral: '#ef6f61',
	coralSoft: '#fbe0db',
	mint: '#cfe9d8',
	lavender: '#e8dff0'
} as const;

const FONT_DISPLAY = 'Syne, Mali, system-ui, sans-serif';
const FONT_BODY = 'DM Sans, Mali, system-ui, sans-serif';

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('Image load failed'));
		image.src = url;
	});
}

function fitText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string {
	if (context.measureText(value).width <= maxWidth) return value;
	let result = value;
	while (result.length > 1 && context.measureText(`${result}…`).width > maxWidth) {
		result = result.slice(0, -1);
	}
	return `${result}…`;
}

function drawCover(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const sourceWidth = image.naturalWidth || image.width;
	const sourceHeight = image.naturalHeight || image.height;
	const sourceRatio = sourceWidth / sourceHeight;
	const targetRatio = width / height;
	let sx = 0;
	let sy = 0;
	let sw = sourceWidth;
	let sh = sourceHeight;

	if (sourceRatio > targetRatio) {
		sw = sourceHeight * targetRatio;
		sx = (sourceWidth - sw) / 2;
	} else {
		sh = sourceWidth / targetRatio;
		sy = (sourceHeight - sh) / 2;
	}

	context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawBackground(context: CanvasRenderingContext2D) {
	context.fillStyle = COLOR.paper;
	context.fillRect(0, 0, LIBRARY_CARD_WIDTH, LIBRARY_CARD_HEIGHT);
	context.fillStyle = COLOR.coral;
	context.fillRect(0, 0, 28, LIBRARY_CARD_HEIGHT);
	context.strokeStyle = COLOR.plum;
	context.lineWidth = 3;
	context.strokeRect(52, 52, 976, 1246);
}

function drawHeader(context: CanvasRenderingContext2D) {
	context.fillStyle = COLOR.plum;
	context.font = `800 58px ${FONT_DISPLAY}`;
	context.textAlign = 'left';
	context.textBaseline = 'alphabetic';
	context.fillText('MY GL ORBIT', 88, 138);
	context.fillStyle = COLOR.coral;
	context.fillRect(88, 162, 180, 12);
	context.fillStyle = COLOR.muted;
	context.font = `700 24px ${FONT_BODY}`;
	context.textAlign = 'right';
	context.fillText('PERSONAL LIBRARY', 992, 132);
}

function drawAvatarPlaceholder(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
	context.fillStyle = COLOR.lavender;
	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = COLOR.plum;
	context.font = `800 ${radius}px ${FONT_DISPLAY}`;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText('O', x, y + 3);
}

async function drawIdentity(
	context: CanvasRenderingContext2D,
	displayName: string,
	avatarUrl: string | null
) {
	const avatarX = 164;
	const avatarY = 274;
	const radius = 72;
	let avatar: HTMLImageElement | null = null;
	if (avatarUrl) {
		try {
			avatar = await loadImage(avatarUrl);
		} catch {
			avatar = null;
		}
	}

	if (avatar) {
		context.save();
		context.beginPath();
		context.arc(avatarX, avatarY, radius, 0, Math.PI * 2);
		context.clip();
		drawCover(context, avatar, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
		context.restore();
	} else {
		drawAvatarPlaceholder(context, avatarX, avatarY, radius);
	}

	context.fillStyle = COLOR.muted;
	context.font = `700 24px ${FONT_BODY}`;
	context.textAlign = 'left';
	context.textBaseline = 'alphabetic';
	context.fillText('GL-ORBIT MEMBER', 272, 250);
	context.fillStyle = COLOR.plum;
	context.font = `800 48px ${FONT_DISPLAY}`;
	context.fillText(fitText(context, displayName, 700), 272, 310);
}

function drawStats(
	context: CanvasRenderingContext2D,
	favoriteCount: number,
	watchedCount: number,
	lang: 'th' | 'en'
) {
	const cards = [
		{ x: 88, color: COLOR.coralSoft, value: favoriteCount, label: lang === 'th' ? 'รายการโปรด' : 'FAVORITES' },
		{ x: 550, color: COLOR.mint, value: watchedCount, label: lang === 'th' ? 'ดูแล้ว' : 'WATCHED' }
	];
	for (const card of cards) {
		context.fillStyle = card.color;
		context.fillRect(card.x, 380, 442, 176);
		context.strokeStyle = COLOR.plum;
		context.lineWidth = 2;
		context.strokeRect(card.x, 380, 442, 176);
		context.fillStyle = COLOR.plum;
		context.font = `800 78px ${FONT_DISPLAY}`;
		context.textAlign = 'left';
		context.fillText(String(card.value), card.x + 30, 478);
		context.font = `700 24px ${FONT_BODY}`;
		context.fillText(card.label, card.x + 30, 526);
	}
}

function drawPosterPlaceholder(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	lang: 'th' | 'en'
) {
	context.fillStyle = COLOR.lavender;
	context.fillRect(x, y, width, height);
	context.fillStyle = COLOR.coral;
	context.fillRect(x + 24, y + 24, 58, 12);
	context.fillStyle = COLOR.plum;
	context.font = `800 38px ${FONT_DISPLAY}`;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText('GL', x + width / 2, y + height / 2 - 18);
	context.font = `600 18px ${FONT_BODY}`;
	context.fillText(lang === 'th' ? 'รอเรื่องโปรด' : 'NEXT FAVORITE', x + width / 2, y + height / 2 + 32);
}

async function drawFavorites(
	context: CanvasRenderingContext2D,
	favorites: LibraryShareFavorite[],
	lang: 'th' | 'en'
) {
	context.fillStyle = COLOR.plum;
	context.font = `800 30px ${FONT_DISPLAY}`;
	context.textAlign = 'left';
	context.textBaseline = 'alphabetic';
	context.fillText(lang === 'th' ? 'เรื่องโปรดล่าสุด' : 'RECENT FAVORITES', 88, 628);

	const items = favorites.slice(0, 3);
	for (let index = 0; index < 3; index += 1) {
		const favorite = items[index];
		const x = 88 + index * 310;
		const y = 666;
		const width = 286;
		const height = 414;
		let poster: HTMLImageElement | null = null;
		if (favorite?.poster) {
			try {
				poster = await loadImage(favorite.poster);
			} catch {
				poster = null;
			}
		}

		if (poster) drawCover(context, poster, x, y, width, height);
		else drawPosterPlaceholder(context, x, y, width, height, lang);
		context.strokeStyle = COLOR.plum;
		context.lineWidth = 2;
		context.strokeRect(x, y, width, height);

		context.fillStyle = COLOR.plum;
		context.font = `700 25px ${FONT_BODY}`;
		context.textAlign = 'left';
		context.textBaseline = 'alphabetic';
		const title = favorite?.title ?? (lang === 'th' ? 'ยังรอเรื่องโปรดของคุณ' : 'Your next favorite belongs here');
		context.fillText(fitText(context, title, width), x, 1124);
	}
}

function drawFooter(context: CanvasRenderingContext2D, createdAt: Date, lang: 'th' | 'en') {
	context.strokeStyle = COLOR.line;
	context.lineWidth = 2;
	context.strokeRect(88, 1190, 904, 1);
	context.fillStyle = COLOR.plum;
	context.font = `800 28px ${FONT_DISPLAY}`;
	context.textAlign = 'left';
	context.fillText('GL-ORBIT', 88, 1254);
	context.fillStyle = COLOR.muted;
	context.font = `600 20px ${FONT_BODY}`;
	context.textAlign = 'right';
	context.fillText(createdAt.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}), 992, 1252);
}

export async function createLibraryShareCard(input: LibraryShareCardInput): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = LIBRARY_CARD_WIDTH;
	canvas.height = LIBRARY_CARD_HEIGHT;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas 2D context unavailable');

	drawBackground(context);
	drawHeader(context);
	await drawIdentity(context, input.displayName, input.avatarUrl);
	drawStats(context, input.favoriteCount, input.watchedCount, input.lang);
	await drawFavorites(context, input.favorites.slice(0, 3), input.lang);
	drawFooter(context, input.createdAt, input.lang);

	return await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
	});
}

export async function shareLibraryCard(
	blob: Blob,
	copy: LibraryShareCopy
): Promise<'shared' | 'downloaded' | 'cancelled'> {
	const file = new File([blob], 'gl-orbit-library.png', { type: 'image/png' });
	if (
		typeof navigator.share === 'function' &&
		typeof navigator.canShare === 'function' &&
		navigator.canShare({ files: [file] })
	) {
		try {
			await navigator.share({ files: [file], title: copy.title, text: copy.text });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			throw error;
		}
	}

	const url = URL.createObjectURL(blob);
	try {
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'gl-orbit-library.png';
		anchor.click();
		return 'downloaded';
	} finally {
		URL.revokeObjectURL(url);
	}
}
