import { runReadOnlyQuery } from './read-only-db.js';

type SeriesCatalogRow = {
	title_th: string | null;
	title_en: string;
	status: string;
};

/**
 * ดึงรายชื่อซีรีส์จริงจาก DB เพื่อแทรกเข้า prompt สร้าง SQL
 * ทำให้ AI แยก "ชื่อเรื่อง" ออกจาก "ประโยคคุยทั่วไป" ได้
 * ตัวอย่างปัญหาที่แก้: "พี่เองก็ลำบาก ขอตารางฉายหน่อย"
 *   - ก่อนแก้: AI ตีความ "พี่เองก็ลำบาก" เป็นประโยคคุย → ดึงตารางฉายทุกเรื่อง (เรื่องอื่น)
 *   - หลังแก้: AI เห็นชื่อนี้อยู่ในรายการ → รู้ว่าเป็นชื่อเรื่อง → WHERE title ILIKE '%พี่เองก็ลำบาก%'
 *
 * Non-fatal: ถ้า query ไม่ได้ (เช่นยังไม่ตั้ง READONLY_DATABASE_URL) คืน '' เพื่อให้ flow เดิมทำงานต่อได้
 */
export async function getSeriesCatalogText(): Promise<string> {
	try {
		const rows = await runReadOnlyQuery(
			`SELECT title_th, title_en, status
			 FROM series
			 WHERE deleted_at IS NULL
			 ORDER BY title_en
			 LIMIT 500`
		) as SeriesCatalogRow[];

		if (!rows.length) return '';

		const lines = rows.map((row) => {
			const th = row.title_th ? ` (${row.title_th})` : '';
			return `- ${row.title_en}${th} [${row.status}]`;
		});

		return `\n\nรายชื่อซีรีส์ที่มีจริงในระบบ (ถ้าคำถามมีข้อความตรงหรือใกล้เคียงกับชื่อในรายการนี้ ให้ถือว่าเป็น "ชื่อเรื่อง" แล้วใช้เป็นเงื่อนไข ILIKE — เช่น "พี่เองก็ลำบาก" คือชื่อเรื่อง ไม่ใช่ประโยคคุย):\n${lines.join('\n')}`;
	} catch {
		return '';
	}
}
