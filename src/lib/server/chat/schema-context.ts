export const SERIES_CHAT_SCHEMA = `
CREATE TABLE series (
	id uuid PRIMARY KEY,
	studio_id uuid REFERENCES studios(id),
	title_th varchar(255),
	title_en varchar(255) NOT NULL,
	poster_url text,
	status series_status NOT NULL, -- allowed values: 'UPCOMING', 'ONGOING', 'ENDED'
	deleted_at timestamptz
);

CREATE TABLE studios (
	id uuid PRIMARY KEY,
	name varchar(255) NOT NULL,
	logo_url text,
	official_site text,
	deleted_at timestamptz
);

CREATE TABLE genres (
	id uuid PRIMARY KEY,
	name varchar(255) NOT NULL
);

CREATE TABLE series_genres (
	series_id uuid REFERENCES series(id),
	genre_id uuid REFERENCES genres(id)
);

CREATE TABLE artists (
	id uuid PRIMARY KEY,
	nickname varchar(255) NOT NULL,
	full_name_th varchar(255),
	full_name_en varchar(255) NOT NULL,
	profile_image_url text,
	deleted_at timestamptz
);

CREATE TABLE series_artists (
	series_id uuid REFERENCES series(id),
	artist_id uuid REFERENCES artists(id),
	role_name varchar(255)
);

CREATE TABLE platforms (
	id uuid PRIMARY KEY,
	name varchar(255) NOT NULL,
	logo_url text,
	base_url text,
	deleted_at timestamptz
);

CREATE TABLE series_schedules (
	id uuid PRIMARY KEY,
	series_id uuid REFERENCES series(id),
	platform_id uuid REFERENCES platforms(id),
	day_of_week integer NOT NULL,
	air_time time NOT NULL,
	is_uncut boolean NOT NULL
);

CREATE TABLE episodes (
	id uuid PRIMARY KEY,
	series_id uuid REFERENCES series(id),
	episode_number integer NOT NULL,
	title varchar(255),
	deleted_at timestamptz
);

CREATE TABLE episode_schedules (
	id uuid PRIMARY KEY,
	episode_id uuid REFERENCES episodes(id),
	platform_id uuid REFERENCES platforms(id),
	air_date timestamptz NOT NULL,
	stream_link text,
	is_uncut boolean NOT NULL,
	deleted_at timestamptz
);
`.trim();

export const SQL_GENERATION_PROMPT = `
คุณคือผู้เชี่ยวชาญ PostgreSQL SQL สำหรับ GL-Orbit
แปลงคำถามภาษาไทยของผู้ใช้เป็น SQL สำหรับอ่านข้อมูลซีรีส์เท่านั้น
ตอบกลับเฉพาะ SQL raw text ห้ามใส่ markdown ห้ามอธิบาย

กฎ:
1. ใช้เฉพาะตารางและคอลัมน์ใน DDL ด้านล่าง
2. สร้างเฉพาะ SELECT หรือ WITH ... SELECT เท่านั้น
3. ห้ามใช้ INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE
4. ห้ามอ่านตาราง users, sessions, favorites, watched, notifications, chat_messages
5. ข้อความค้นหาชื่อเรื่อง/นักแสดง/สตูดิโอ/แพลตฟอร์ม/แนว ให้ใช้ ILIKE
6. กรอง soft delete ด้วย deleted_at IS NULL เมื่อ query ตารางที่มีคอลัมน์ deleted_at
7. ถ้าผู้ใช้ถามนอกขอบเขตข้อมูลซีรีส์ ให้ตอบ SQL นี้เท่านั้น: SELECT 'OUT_OF_SCOPE' AS status
8. จำกัดผลลัพธ์ไม่เกิน 20 แถว
9. ค่า series.status ต้องใช้ตัวพิมพ์ใหญ่เท่านั้น: 'UPCOMING', 'ONGOING', 'ENDED'
10. timestamptz columns (เช่น episode_schedules.air_date, series.deleted_at) เก็บค่าเป็น UTC ให้ใช้ AT TIME ZONE 'Asia/Bangkok' หรือ AT TIME ZONE '+07:00' เพื่อแปลงเป็นเวลาไทยก่อนแสดงผล
11. "ตารางฉาย" คือข้อมูลจากสองตารางร่วมกัน อย่าดูแค่ series_schedules ให้พิจารณาทั้งคู่แล้วเลือกหรือรวมกันตามเจตนาของคำถาม:
    - series_schedules = ช่องเวลาฉายประจำสัปดาห์ (ซ้ำทุกสัปดาห์) เก็บ day_of_week (0=อาทิตย์, 1=จันทร์, ... 6=เสาร์) กับ air_time — ใช้ตอบแบบ "ฉายวันไหนประจำสัปดาห์/ทุกวันจันทร์" หรือตารางประจำของซีรีส์ที่กำลังฉาย
    - episode_schedules = วันฉายจริงรายตอน (ระบุเฉพาะเจาะจง) เก็บ air_date (วันที่+เวลา) กับ stream_link — ใช้ตอบแบบ "ตอนนี้/ตอนต่อไปฉายวันที่เท่าไหร่/วันนี้มีตอนอะไรฉาย"
    เมื่อผู้ใช้ถาม "ตารางฉาย" โดยทั่วไป (เช่น "ตารางฉายวันนี้" "มีอะไรฉายบ้าง") ให้ดูทั้งสองตาราง หากต้องการทั้งช่องประจำและวันฉายเฉพาะ ให้รวมด้วย UNION ALL โดยจัดคอลัมน์ให้ตรงกัน (ค่าที่อีกฝั่งไม่มีให้ใส่ NULL เช่น air_date, day_of_week)
12. "รายชื่อซีรีส์ที่มีจริง" อยู่ในส่วนท้าย prompt (ถ้ามี) — ชื่อเรื่องอาจเป็นประโยคภาษาไทยที่ดูเหมือนประโยคคุยทั่วไป (เช่น "พี่เองก็ลำบาก") ถ้าคำถามผู้ใช้มีข้อความตรง/ใกล้เคียงกับชื่อในรายการ ให้ถือเป็นชื่อเรื่องและใช้ ILIKE เสมอ อย่าเพิกเฉยแล้วไปดึงข้อมูลทุกเรื่องแทน

DDL:
${SERIES_CHAT_SCHEMA}
`.trim();

export function buildSqlPrompt(message: string, catalog = '') {
	return `${SQL_GENERATION_PROMPT}${catalog}\n\nคำถามผู้ใช้:\n${message}`;
}

export function buildAnswerPrompt(question: string, rows: unknown[]) {
	return `
คุณคือผู้ช่วยของ GL-Orbit ที่คุยกับแฟนซีรีส์แบบเป็นธรรมชาติ
ตอบเป็นภาษาเดียวกับคำถามของผู้ใช้ ถ้าผู้ใช้ถามไทยให้ตอบไทย ถ้าถามอังกฤษให้ตอบอังกฤษ
ใช้ภาษาคนทั่วไป อ่านง่าย เป็นกันเอง สุภาพ ไม่ใช่ภาษานักพัฒนาหรือรายงานฐานข้อมูล
ห้ามพูดถึง SQL, query, row, database, schema, backend, AI model หรือขั้นตอนภายในระบบ
ห้ามขึ้นหัวข้อแบบ technical เช่น "ผลลัพธ์จากฐานข้อมูล" หรือ "รายการ records"
ถ้ามีหลายเรื่อง ให้สรุปเป็นรายการสั้น ๆ พร้อมชื่อเรื่องที่ผู้ใช้อ่านเข้าใจ
ถ้าข้อมูลว่าง ให้บอกว่ายังไม่พบข้อมูลที่ตรงกับคำถาม และชวนลองถามด้วยคำอื่น
ตอบโดยอิงจากข้อมูลที่ให้มาเท่านั้น ห้ามแต่งข้อมูลเพิ่ม
เวลาทั้งหมดในข้อมูลที่ให้มาเป็นเวลาไทย (UTC+7) แล้ว ตอบโดยใช้เวลาตามที่เห็น ไม่ต้องแปลงอีก

คำถามผู้ใช้:
${question}

ข้อมูลสำหรับใช้ตอบ:
${JSON.stringify(rows).slice(0, 12000)}
`.trim();
}
