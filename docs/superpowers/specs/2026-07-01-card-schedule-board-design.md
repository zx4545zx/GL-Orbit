# Card Schedule Board — ดีไซน์มุมมองตารางฉายแบบการ์ด

## สรุปความต้องการ

เพิ่มมุมมองใหม่ในหน้า `/calendar` ชื่อ **“การ์ด”** แสดงตารางฉายซีรีส์รายสัปดาห์ในรูปแบบบอร์ด 7 วัน (จันทร์–อาทิตย์) โดยแต่ละวันมีการ์ดซีรีส์ซ้อนลงมาตามเวลาฉาย แต่ละการ์ดมีภาพ poster, ชื่อซีรีส์, EP, และเวลาฉาย

## เป้าหมายหลัก

- เพิ่มทางเลือกในการดูตารางฉายที่เน้นภาพและอ่านง่าย
- รักษาความสอดคล้องกับ design system ของ GL-Orbit (glass-card, coral/lavender/mint)
- ใช้งานได้ดีทั้ง desktop และ mobile โดยไม่ต้อง scroll นิ้วซ้าย–ขวา

## สถาปัตยกรรม

- เพิ่ม view mode ใหม่ `card` ใน `src/routes/(app)/calendar/+page.svelte`
- สร้าง component ย่อย `CardScheduleBoard.svelte` ภายในโฟลเดอร์หน้า calendar
- แชร์ชุดควบคุมสัปดาห์กับ List view โดยใช้ component ร่วม `CalendarWeekHeader.svelte`
- ไม่แก้ไข backend — ใช้ `data.calendar.scheduleByDay` ที่มีอยู่แล้ว

## Component หลัก

### 1. CalendarWeekHeader.svelte (ใหม่)

Extract ส่วน header ของ List view ออกมาเป็น component ร่วม โดย List view และ Card view ใช้ component นี้:

- ลูกศรเปลี่ยนสัปดาห์ก่อน/ถัดไป
- ปุ่ม “สัปดาห์นี้”
- ข้อความแสดงช่วงวันที่ (เช่น “23–29 มิถุนายน 2568”)
- Props:
  - `currentWeek: Date`
  - `onPrevWeek: () => void`
  - `onNextWeek: () => void`
  - `onThisWeek: () => void`

### 2. CardScheduleBoard.svelte (ใหม่)

รับ props:

- `scheduleByDay: ScheduleDay[]`
- `weekStart: Date`

ภายในแบ่งเป็น:

- `DayColumn` (ภายในไฟล์เดียวกัน) สำหรับแต่ละวัน
- `SeriesCard` (ภายในไฟล์เดียวกัน) สำหรับแต่ละซีรีส์

## Desktop Layout (md ขึ้นไป)

- Grid 7 คอลัมน์ (`grid-cols-7`) แยกตามวัน
- แต่ละคอลัมน์มี header แสดงชื่อวัน + วันที่
- การ์ดซ้อนจากบนลงล่างตามเวลาฉาย
- วันว่างแสดง empty state สั้นๆ

## Mobile Layout

- Day Tab Bar ด้านบน: แถบ จ อ พ พฤ ศ ส อา
- กดวันไหนก็แสดงการ์ดของวันนั้นด้านล่าง
- Default เป็นวันแรกในสัปดาห์ที่มีซีรีส์ฉาย หรือวันนี้ถ้าอยู่ในช่วงสัปดาห์นั้น
- Indicator สี coral เลื่อนตาม tab ที่เลือก

## SeriesCard

แต่ละการ์ดประกอบด้วย:

- Poster ซีรีส์ (แนวตั้ง 2:3, rounded-xl, object-cover)
- ชื่อซีรีส์ (truncate 2 บรรทัด)
- EP (เช่น “EP.05”)
- เวลาฉาย (เช่น “20:30”) เน้นด้วยสี coral-dark
- ป้าย Uncut ถ้ามี
- Badge แพลตฟอร์มหลัก 1 อัน

## สไตล์

- การ์ด: `glass-card-strong` + hover:shadow-lg + hover:-translate-y-1
- สีพื้นหลังคอลัมน์: วันละโทนอ่อน (ต่อยอดจาก List view)
  - จันทร์: coral/10
  - อังคาร: orange-300/10
  - พุธ: lavender/10
  - พฤหัสบดี: emerald-300/10
  - ศุกร์: teal-300/10
  - เสาร์: blue-300/10
  - อาทิตย์: rose-300/10
- วันหยุด (เสาร์–อาทิตย์): เน้นสี coral-dark ใน header
- Animation: cards fade-in แบบ stagger เมื่อโหลด/เปลี่ยนสัปดาห์
- Loading state: skeleton card 7 ใบ

## Accessibility

- Tabs บน mobile ใช้ `role="tablist"` / `role="tab"` / `role="tabpanel"`
- การ์ดเป็น `<article>` พร้อม `aria-label`
- เคารพ `prefers-reduced-motion`
- ขนาด touch target ไม่น้อยกว่า 44×44px

## ข้อมูลที่ใช้

ใช้ `CalendarApiResponse.scheduleByDay` จาก `+page.server.ts` ซึ่งมีโครงสร้าง:

```ts
interface ScheduleDay {
  day: string;        // เช่น "จันทร์"
  items: CalendarEvent[];
}
```

## ขอบเขตที่ไม่ทำในครั้งนี้

- ไม่เพิ่ม backend query ใหม่
- ไม่แก้ไขมุมมอง Grid, Calendar, List ที่มีอยู่ (นอกจาก refactor header ร่วม)
- ไม่เพิ่มฟิลเตอร์หรือการค้นหาในหน้า calendar
