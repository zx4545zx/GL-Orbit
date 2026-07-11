export type MediaPurpose = 'poster' | 'cover' | 'gallery';

export interface MediaDisplay {
	aspectClass: 'aspect-[2/3]' | 'aspect-video';
	sizes: string;
}

const displays: Record<MediaPurpose, MediaDisplay> = {
	poster: { aspectClass: 'aspect-[2/3]', sizes: '160px' },
	cover: { aspectClass: 'aspect-video', sizes: '(min-width: 640px) 320px, 100vw' },
	gallery: { aspectClass: 'aspect-video', sizes: '(min-width: 640px) 240px, 100vw' }
};

export const getMediaDisplay = (purpose: MediaPurpose): MediaDisplay => displays[purpose];
