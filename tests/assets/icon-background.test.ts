import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

type Rgba = [number, number, number, number];

interface PngImage {
	width: number;
	height: number;
	pixel(x: number, y: number): Rgba;
}

function paethPredictor(left: number, up: number, upperLeft: number) {
	const p = left + up - upperLeft;
	const pa = Math.abs(p - left);
	const pb = Math.abs(p - up);
	const pc = Math.abs(p - upperLeft);
	if (pa <= pb && pa <= pc) return left;
	if (pb <= pc) return up;
	return upperLeft;
}

function readRgbaPng(path: string): PngImage {
	const bytes = readFileSync(path);
	expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

	let offset = 8;
	let width = 0;
	let height = 0;
	let colorType = -1;
	let bitDepth = -1;
	const idatChunks: Buffer[] = [];

	while (offset < bytes.length) {
		const length = bytes.readUInt32BE(offset);
		const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
		const chunk = bytes.subarray(offset + 8, offset + 8 + length);
		offset += length + 12;

		if (type === 'IHDR') {
			width = chunk.readUInt32BE(0);
			height = chunk.readUInt32BE(4);
			bitDepth = chunk[8];
			colorType = chunk[9];
		} else if (type === 'IDAT') {
			idatChunks.push(Buffer.from(chunk));
		} else if (type === 'IEND') {
			break;
		}
	}

	expect(bitDepth).toBe(8);
	expect(colorType).toBe(6);

	const bytesPerPixel = 4;
	const stride = width * bytesPerPixel;
	const inflated = inflateSync(Buffer.concat(idatChunks));
	const rows: Uint8Array[] = [];
	let readOffset = 0;
	let previous = new Uint8Array(stride);

	for (let y = 0; y < height; y += 1) {
		const filter = inflated[readOffset];
		readOffset += 1;
		const scanline = inflated.subarray(readOffset, readOffset + stride);
		readOffset += stride;
		const row = new Uint8Array(stride);

		for (let x = 0; x < stride; x += 1) {
			const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
			const up = previous[x];
			const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
			const value = scanline[x];

			if (filter === 0) row[x] = value;
			else if (filter === 1) row[x] = (value + left) & 255;
			else if (filter === 2) row[x] = (value + up) & 255;
			else if (filter === 3) row[x] = (value + Math.floor((left + up) / 2)) & 255;
			else if (filter === 4) row[x] = (value + paethPredictor(left, up, upperLeft)) & 255;
			else throw new Error(`Unsupported PNG filter ${filter}`);
		}

		rows.push(row);
		previous = row;
	}

	return {
		width,
		height,
		pixel(x: number, y: number) {
			const index = x * 4;
			const row = rows[y];
			return [row[index], row[index + 1], row[index + 2], row[index + 3]];
		}
	};
}

function isWhite([red, green, blue, alpha]: Rgba) {
	return alpha === 255 && red >= 250 && green >= 250 && blue >= 250;
}

function isSplashBackground([red, green, blue, alpha]: Rgba) {
	return alpha === 255 && Math.abs(red - 255) <= 1 && Math.abs(green - 245) <= 1 && Math.abs(blue - 247) <= 1;
}

describe('app icon backgrounds', () => {
	const iconPaths = [
		'static/icons/pwa-192x192.png',
		'static/icons/pwa-512x512.png',
		'static/icons/apple-touch-icon-180x180.png',
		'static/icons/gl-orbit-icon.png'
	];

	it.each(iconPaths)('%s uses branded color at the outer corners instead of a white canvas', (iconPath) => {
		const image = readRgbaPng(join(process.cwd(), iconPath));
		const corners = [
			image.pixel(0, 0),
			image.pixel(image.width - 1, 0),
			image.pixel(0, image.height - 1),
			image.pixel(image.width - 1, image.height - 1)
		];

		expect(corners.some(isWhite), `${iconPath} has a white canvas corner`).toBe(false);
	});

	it.each(iconPaths)('%s uses the splash background color around the outer icon area', (iconPath) => {
		const image = readRgbaPng(join(process.cwd(), iconPath));
		const outerSamples = [
			image.pixel(0, 0),
			image.pixel(image.width - 1, 0),
			image.pixel(0, image.height - 1),
			image.pixel(image.width - 1, image.height - 1),
			image.pixel(Math.floor(image.width * 0.5), Math.floor(image.height * 0.05)),
			image.pixel(Math.floor(image.width * 0.95), Math.floor(image.height * 0.5)),
			image.pixel(Math.floor(image.width * 0.5), Math.floor(image.height * 0.95)),
			image.pixel(Math.floor(image.width * 0.05), Math.floor(image.height * 0.5))
		];

		expect(
			outerSamples.every(isSplashBackground),
			`${iconPath} outer area should match #FFF5F7 so it blends into the splash screen`
		).toBe(true);
	});
});
