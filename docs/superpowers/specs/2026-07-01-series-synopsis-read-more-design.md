# Series Synopsis Read-More Toggle

## Overview
เพิ่มปุ่ม `...ดูเพิ่มเติม` ให้กับส่วนเรื่องย่อ (description) บนหน้า Series Detail เพื่อลดความยาวของข้อความที่แสดงในหน้าจอแรก

## Scope
- แก้ไขเฉพาะหน้า Series Detail: `src/routes/[lang=lang]/(app)/series/[id]/+page.svelte`
- ไม่แตะ schema, API, หรือหน้าอื่น

## Design Decisions

### Threshold
- ทุก viewport: 2 บรรทัด

### Behavior
- ใช้ CSS `-webkit-line-clamp` ตัดข้อความ
- ใช้ `ResizeObserver` ตรวจว่าข้อความจริง ๆ ถูกตัด (overflow) หรือไม่
- แสดงปุ่มเฉพาะเมื่อ overflow จริง
- ปุ่ม collapsed: `...ดูเพิ่มเติม`
- ปุ่ม expanded: `ย่อ`
- กดปุ่มแล้ว toggle state นุ่มนวลด้วย CSS transition
- เคารพ `prefers-reduced-motion`

### Implementation Approach
- Inline ใน `+page.svelte` (scope เล็ก ไม่ต้องแยก component)
- ใช้ Svelte 5 runes: `$state`, `$derived`, `$effect`
- วัด overflow โดยเปรียบเทียบ `scrollHeight > clientHeight` บน element ที่ถูก clamp
- เมื่อ expanded ให้ยังคงแสดงปุ่ม (เพราะรู้ว่าเคย overflow) และ re-measure เมื่อ collapse หรือ resize

## Accessibility
- ปุ่มเป็น `<button type="button">`
- ใช้ touch target ขั้นต่ำ 44x44px
- ไม่เปลี่ยน `aria-expanded` เพราะเป็นการขยายข้อความ ไม่ใช่ region ที่ซ่อน

## Testing
- เปิดหน้า series ที่มีเรื่องย่อสั้น → ไม่ควรมีปุ่ม
- เปิดหน้า series ที่มีเรื่องย่อยาว → ควรมีปุ่มและกดขยาย/ย่อได้
- ลด/ขยายหน้าจอ → ปุ่มควรหาย/ปรากฏตาม overflow จริง
