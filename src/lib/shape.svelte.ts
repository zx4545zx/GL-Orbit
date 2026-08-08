import { browser } from '$app/environment';

export type ShapeName = 'sharp' | 'rounded';
export const SHAPE_NAMES = ['sharp', 'rounded'] as const satisfies readonly ShapeName[];
export const DEFAULT_SHAPE: ShapeName = 'sharp';
export const SHAPE_STORAGE_KEY = 'shape';

export function isShapeName(value: unknown): value is ShapeName {
	return typeof value === 'string' && (SHAPE_NAMES as readonly string[]).includes(value);
}

export function parseShapeName(value: unknown): ShapeName {
	return isShapeName(value) ? value : DEFAULT_SHAPE;
}

export function readStoredShape(storage?: Storage): ShapeName {
	try {
		return parseShapeName((storage ?? (browser ? localStorage : undefined))?.getItem(SHAPE_STORAGE_KEY));
	} catch {
		return DEFAULT_SHAPE;
	}
}

export const shapeState = $state<{ shape: ShapeName }>({
	shape: browser && typeof document !== 'undefined'
		? parseShapeName(document.documentElement.dataset.shape)
		: DEFAULT_SHAPE
});

export function applyShape(shape: ShapeName): void {
	if (!browser) return;
	document.documentElement.dataset.shape = parseShapeName(shape);
}

export function setShape(next: ShapeName, persist = true, storage?: Storage): void {
	const shape = parseShapeName(next);
	shapeState.shape = shape;
	applyShape(shape);
	if (persist && browser) try { (storage ?? localStorage).setItem(SHAPE_STORAGE_KEY, shape); } catch {}
}
