# Menus UI Design — Orbit Hub + Compact

## Goal

ปรับหน้า `src/routes/[lang=lang]/(app)/menus/+page.svelte` ให้เข้ากับ visual language ของ GL-Orbit มากขึ้น โดยยังคงใช้งานเร็วบนมือถือ ไม่สูงหรือรกเกินไป และไม่เปลี่ยน data flow เดิม

## Direction

ใช้แนวทาง **Orbit Hub + Compact**: หน้าเมนูเป็น command hub ขนาดกะทัดรัดสำหรับบัญชีและภาษา พร้อมบรรยากาศ orbit/glassmorphism ที่สอดคล้องกับหน้า home, navigation และ design tokens ของโปรเจกต์

## Scope

- ปรับ UI เฉพาะหน้า `menus/+page.svelte`
- ใช้ i18n keys เดิม ไม่เพิ่มข้อความใหม่ถ้าไม่จำเป็น
- คง behavior เดิม:
  - ผู้ใช้ที่ login แล้วเห็น profile card
  - ผู้ใช้ที่ยังไม่ login เห็น login/register cards
  - เปลี่ยนภาษาได้ และบันทึก preferred language สำหรับผู้ใช้ที่ login แล้ว
- แก้ syntax artifact ที่หลุดในไฟล์ (`003e`) หากยังอยู่

## Visual Design

- Wrapper เต็ม viewport แบบ compact ใช้ `bg-gradient-mesh`, soft coral/lavender/mint glows และ overflow-safe layout
- Header สั้นและชัด: title + subtitle พร้อม decorative orbit mark ขนาดเล็ก
- Primary card ใช้ glass-card strong feeling, rounded corners, subtle hover lift, arrow affordance
- Language card เป็น compact control module พร้อม active state ที่เห็นชัด แต่ไม่กินพื้นที่มาก
- ใช้ project colors เท่านั้น: coral, lavender, mint, plum, cream
- Motion เป็น micro-interaction เบา ๆ ผ่าน Tailwind transitions และ respects global reduced-motion CSS

## Accessibility

- รักษา semantic links/buttons เดิม
- Buttons มี `aria-pressed` สำหรับ language active state
- Touch target อย่างน้อย 44px ผ่าน `.touch-target`
- Decorative SVG/background elements ต้องไม่รบกวน screen reader (`aria-hidden` หรือ pointer-events none)

## Technical Notes

- ใช้ Svelte 5 runes เดิม ไม่ใช้ `export let`
- ไม่เพิ่ม server load/action
- ไม่แก้ schema/database/auth
- ใช้ `localizedHref` และ `switchLanguageHref` เดิม
- ระวัง mobile overflow เพราะมี recent commit แก้ overflow แล้ว

## Verification

- รัน `npm run check`
- ตรวจว่า route `/th/menus` และ `/en/menus` compile ผ่าน
- ตรวจว่า language switching ยังเรียก `/api/user/language` เมื่อมี user และ navigate ถูก path
