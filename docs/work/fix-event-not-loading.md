# อีเวนต์โหลดไม่ขึ้น

เป็นการตรวจสอบเท่านั้น ไม่มีการเปลี่ยนโค้ดแอปพลิเคชัน ความล้มเหลวบน production เป็นของจริง แต่โค้ดไม่ได้บอกว่าความล้มเหลวจากภายนอกแบบใดเป็นสาเหตุ

## รายงานต้นฉบับ

Slack `#report-bug` โพสต์โดย Nattapon (GitHub `zx4545zx`) เมื่อ 2026-10-08 ประมาณ 01:22 Asia/Bangkok เธรดไม่มีข้อความตอบกลับ ไม่มีภาพหน้าจอ ไม่มีขั้นตอน และไม่มีบันทึกสภาพแวดล้อม

ภาษาไทย:

> bug: event โหลดไม่ขึ้น

ภาษาอังกฤษ:

> bug: events don't load / don't show up

## สิ่งที่ตรวจสอบ

อีเวนต์ของ What's On คือส่วนของผลิตภัณฑ์ที่ตรงกับรายงานนี้ ไม่ใช่ตารางฉาย

- หน้า: `src/routes/[lang=lang]/(app)/whats-on/+page.svelte` ที่ `/th/whats-on` และ `/en/whats-on`
- การโหลด: `+page.server.ts` เรียก `getWhatsOnData()` ใน `src/lib/server/queries/whats-on.ts`
- ข่าวมาจากฐานข้อมูลของแอปผ่าน `listPublishedNews()`
- อีเวนต์มาจากตาราง Supabase REST ภายนอก `GET {WHATS_ON_API_URL}/rest/v1/events` โดยใช้ `WHATS_ON_API_URL` และ `WHATS_ON_API_KEY` ที่อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
- คิวรีเลือก `event_id,title,performer,full_title,starts_at,ends_at,all_day,location,event_type,pairing_id,actress_id,company_id,source_timezone,lat,lng` กรอง `starts_at` ให้อยู่ในช่วงของมุมมอง และเรียงตาม `starts_at`
- config error ที่ถูก throw หรือ response ของอีเวนต์ที่ล้มเหลวจะถูก catch หน้ายังเรนเดอร์ได้ โดย `sourceStatus.events` ถูกตั้งเป็น `unavailable` และ `events` ถูกตั้งเป็น `[]` รายละเอียดเดียวอยู่ใน server log: `What's On <source> source unavailable: <message>`
- จากนั้นมุมมอง "all" จะเก็บอีเวนต์ที่วันสิ้นสุดตรงกับหรืออยู่หลังวันอ้างอิงของ Bangkok และแสดง 5 รายการแรกพร้อมตัวควบคุมโหลดเพิ่ม
- ประวัติ Git: `fetchEvents` ถูกเพิ่มใน `4a4e8d5` (2026-08-03) และไม่ได้ถูกเปลี่ยนเมื่อข่าวย้ายเข้าฐานข้อมูลของแอปใน `21ba363` (2026-08-08)

ตรวจบนระบบจริงเมื่อ 2026-10-07 18:25 UTC (2026-10-08 01:25 Asia/Bangkok) ขณะไม่ได้ล็อกอิน:

- `https://gl-orbit.vercel.app/th/whats-on` (Vercel cache miss)
- `https://gl-orbit.com/th/whats-on`
- `https://gl-orbit.vercel.app/th/whats-on?view=week&date=2026-10-08`
- `https://gl-orbit.vercel.app/th/calendar`

## สิ่งที่พบ

What's On บน production กำลัง fail closed ฝั่งอีเวนต์ ในขณะที่ข่าวยังโหลดได้

ข้อมูลหน้าที่ serialize แล้วบน `/th/whats-on`:

- `sourceStatus: { news: "live", events: "unavailable" }`
- `events: []`
- `params.anchorDate: "2026-10-08"`
- จำนวนข่าวในหน้าที่เรนเดอร์: 9

ส่วนอีเวนต์แสดง **0 อีเวนต์** และข้อความ `โหลดอีเวนต์จากแหล่งข้อมูลภายนอกไม่ได้ในขณะนี้` (`whats_on_events_unavailable`) payload `events: "unavailable"` ชุดเดียวกันอยู่บน apex domain และบนมุมมอง week ทั้งสองโลแคลใช้ server load นี้ ดังนั้น `/en/whats-on` จึงเดินเส้นทางอีเวนต์เดียวกัน

สถานะนี้ถูกตั้งเฉพาะเมื่อ `getConfig()` throw หรือ `fetchEvents()` reject ไม่ใช่สถานะของรายการว่าง เส้นทางเหล่านี้ถูกตัดออกแล้วสำหรับหน้า production ปัจจุบัน:

- แถวที่ `parseEvent` ไม่ผ่านจะยังเป็น `sourceStatus.events: "live"`
- response ที่สำเร็จแต่ไม่มีแถวในช่วงวันที่ จะเรนเดอร์ `ยังไม่มีอีเวนต์ในช่วงนี้` ไม่ใช่ข้อความ unavailable
- CSS และปุ่มโหลดเพิ่มไม่ได้ซ่อนแถว payload จากเซิร์ฟเวอร์เป็นรายการว่างอยู่แล้ว
- ตารางฉายเป็นคิวรีคนละชุด (`src/lib/server/queries/calendar.ts`) `/th/calendar` ตอนนี้เรนเดอร์รายการตารางฉายอยู่ (วันนี้ 1 รายการ สัปดาห์นี้ 6 รายการ รวม Moon Shadow)
- CSP ฝั่งไคลเอนต์ไม่ได้บล็อกคำขอนี้ การดึงอีเวนต์ทำงานบนเซิร์ฟเวอร์

`getConfig()` จะ throw เมื่อไม่มี `WHATS_ON_API_URL` หรือ `WHATS_ON_API_KEY` เมื่อ URL ไม่ใช่ HTTPS ที่ถูกต้อง หรือเมื่อ URL มี credentials `fetchEvents()` จะ throw เมื่อได้ response ที่ไม่ OK เมื่อ body ไม่ใช่ array เมื่อเกิด network error หรือเมื่อครบ timeout 8 วินาที หน้าแสดงสถานะ unavailable เดียวกันสำหรับทุกกรณีเหล่านี้ HTTP status หรือข้อความ config มีอยู่เฉพาะใน Vercel function log

workspace นี้ไม่มี `.env` ในเครื่อง และ repository ไม่เคยมี host จริงของ What's On การตรวจสอบครั้งนี้จึงเรียกตารางภายนอกไม่ได้

## การแก้

ไม่มี. ไม่พบข้อบกพร่องที่ยืนยันได้ในคิวรีหรือในตัวเรนเดอร์ การเปลี่ยนรายการ select ช่วงวันที่ หรือ UI ของ error จะเป็นการเดา ข้อเท็จจริงถัดไปที่ต้องการคือบรรทัด server log หรือ HTTP status ของคำขอ `events` จากภายนอก

## วิธียืนยัน

บั๊กปัจจุบัน ขณะไม่ได้ล็อกอิน:

1. เปิด `/th/whats-on`
2. ข่าวควรยังแสดงรายการอยู่
3. จำนวนอีเวนต์ควรเป็น `0 อีเวนต์` และส่วนนั้นควรบอกว่าโหลดอีเวนต์จากแหล่งข้อมูลภายนอกไม่ได้
4. ใน Vercel function logs ของคำขอนั้น ให้หา `What's On configuration source unavailable:` หรือ `What's On events source unavailable:` ข้อความหลังเครื่องหมายโคลอนคือข้อเท็จจริงที่ยังขาด (env ที่หายไป, HTTP status, timeout หรือ JSON ที่ไม่ถูกต้อง)

หลังจากคำขอภายนอกสำเร็จ หน้าเดียวกันควรส่ง `sourceStatus.events: "live"` และเรนเดอร์แถวที่กำลังจะมาถึงในมุมมอง all, week และ calendar คำสั่ง `npm test -- src/lib/server/queries/whats-on.test.ts src/routes/[lang=lang]/(app)/whats-on/whats-on.test.ts` ครอบคลุม mapper และ window แต่ไม่ได้เรียกโปรเจกต์ Supabase จริง

## คำถามที่ยังเปิดอยู่สำหรับ Nattapon

1. `/th/whats-on` (ข่าว & อีเวนต์) คือหน้าที่หมายถึงหรือไม่? ตอนที่ตรวจ `/th/calendar` (ตารางฉาย) กำลังแสดงรายการตารางฉาย
2. ใน Vercel logs ของคำขอ `/th/whats-on` บรรทัด `What's On ... source unavailable:` แบบเต็มคืออะไร? โปรดอย่าแปะ `WHATS_ON_API_KEY` หรือ secret อื่น
3. `WHATS_ON_API_URL` และ `WHATS_ON_API_KEY` ถูกตั้งค่าบนโปรเจกต์ Vercel ของ production แล้วหรือไม่? ตอบว่าใช่หรือไม่ใช่ของแต่ละชื่อก็เพียงพอ
4. `GET {WHATS_ON_API_URL}/rest/v1/events` ด้วย key นั้นยังคืน 200 และ JSON array อยู่หรือไม่? ถ้าคืน 400, 401, 404 หรือ 503 สถานะนั้นคือสาเหตุ
5. คอลัมน์ที่ถูกเลือกเหล่านี้ยังมีอยู่บนตาราง `events` ฝั่ง remote หรือไม่: `event_id`, `all_day`, `pairing_id`, `actress_id`, `company_id`, `lat`, `lng`? คอลัมน์ที่หายไปจะทำให้ PostgREST ปฏิเสธทั้งคำขอ
6. อีเวนต์แสดงบนหน้านี้ครั้งล่าสุดเมื่อใด และเป็นก่อนหรือหลังที่ข่าวย้ายเข้า GL-Orbit (2026-08-08)?
