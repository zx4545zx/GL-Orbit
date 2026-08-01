# GL-Orbit Redesign Concepts

**Status:** Proposal (รอเลือกทิศทาง)
**Date:** 2026-07-24

ข้อเสนอ design language ใหม่ 21 ทิศทางสำหรับทั้งแอป (G-I เป็นชุด minimal pastel, J เป็น Liquid Glass สไตล์ Apple, K เป็น pink aesthetic, L เป็นซากุระญี่ปุ่น, M-R เป็นชุดธีมเฉพาะทาง, S-U เป็นชุด Orbit/อวกาศตามชื่อแบรนด์) แต่ละทิศทางครอบคลุม palette, typography, geometry, motion และ signature components พร้อม mockup เปิดดูได้จริงใน `mockups/`

ทุกทิศทางยังคงสัญญาเดิมของผลิตภัณฑ์: ไทยเป็นภาษาหลัก, รองรับ light/dark หรือ theme เดิมได้, touch target อย่างน้อย 44px, focus เห็นชัด, รองรับ `prefers-reduced-motion`, และไม่เปลี่ยน route/data/business behavior

---

## Concept A — Midnight Broadcast

> "สถานีแพร่ภาพของแฟนซีรีส์ GL ยามค่ำคืน"

**Mood:** เทคนิค, ตื่นเต้น, เหมือนหน้าจอสถานีโทรทัศน์/สตรีมมิงยามดึก ข้อมูลตารางฉายคือหัวใจ

| หมวด | รายละเอียด |
|---|---|
| Palette | พื้นหลังดำอมม่วง `#0d0a14`, panel `#171224`, ink `#f2ecfa`, muted `#9d8fb8`, accent coral `#ff4d7e`, cyan `#5ff2e0`, amber สำหรับ ON AIR |
| Typography | `Chakra Petch` (รองรับไทย, อารมณ์จอมอนิเตอร์) สำหรับ display/UI, `Chivo Mono` สำหรับเวลา/ตาราง/countdown |
| Geometry | เหลี่ยมคม, เส้นขอบ 1px เรืองแสงบางๆ, corner tick ที่มุม panel, scanline texture opacity ต่ำ |
| Motion | ไฟ ON AIR กะพริบช้า, countdown tick ทุกวินาที, panel เข้าแบบ stagger สั้นๆ |
| Signature | ป้าย ON AIR + countdown ถ่ายทอดสด, ตารางฉายแบบ TV guide คอลัมน์ mono, focus ring เรืองแสง cyan |

**เหมาะเมื่อ:** อยากให้ countdown/calendar เป็นพระเอก และอยากได้ dark-first identity ที่ต่างจากแอปแฟนคลับทั่วไป
**ความเสี่ยง:** dark-only อาจขัดกับ pastel themes เดิม ต้องออกแบบ light variant เพิ่ม; ฟอนต์ tech อ่านไทยยาวๆ อาจเหนื่อย ต้องใช้ body font แยก

**Mockup:** `mockups/concept-a-midnight-broadcast.html`

---

## Concept B — Fan Zine

> "สมุดสแครป/ซีนที่แฟนคลับทำด้วยมือ"

**Mood:** อบอุ่น, ขี้เล่น, ใกล้ชิด เหมือนซีนที่แฟนคลับแปะสติกเกอร์ เขียนกำกับ และส่งต่อกัน

| หมวด | รายละเอียด |
|---|---|
| Palette | กระดาษครีม `#fbf3e4`, กระดาษเข้ม `#f3e7cf`, ink น้ำตาล `#3b2a20`, coral `#e4572e`, เหลือง washi `#f2c14e`, ชมพู `#f49bc1`, ฟ้า `#7fb5d5` |
| Typography | `Mali` เป็น display (ลายมือไทย) + `Sarabun` เป็น body อ่านยาวสบาย |
| Geometry | การ์ดเอียงเล็กน้อย (±1.5deg), ขอบฉีก/เทปแปะ, เฟรม polaroid มี caption, สติกเกอร์ badge หมุนได้เฉพาะ decoration |
| Motion | การ์ดยกขึ้น/หมุนตรงตำแหน่งตอน hover, sticker pop ตอนกด; ปิดทั้งหมดใน reduced-motion |
| Signature | section header เป็นเทป washi, ป้าย "จิ้นแห่งสัปดาห์" เป็นสติกเกอร์, doodle หัวใจ/ดาว SVG ที่ไม่บัง content |

**เหมาะเมื่อ:** อยากเน้นความรู้สึกชุมชน Orbit Halo และความ affectionate ของฐานแฟน
**ความเสี่ยง:** การเอียง/ฉีกมากไปจะดูรกและอ่านยากบนจอเล็ก ต้องจำกัดองศาและใช้กับ cell ใหญ่เท่านั้น

**Mockup:** `mockups/concept-b-fan-zine.html`

---

## Concept C — Gallery

> "นิทรรศการผลงานซีรีส์ GL ในแกลเลอรีเงียบสงบ"

**Mood:** เรียบหรู, โปร่ง, ให้ artwork เป็นศูนย์กลาง เหมือนเดินชมนิทรรศการที่จัดวางอย่างพิถีพิถัน

| หมวด | รายละเอียด |
|---|---|
| Palette | ผนังแกลเลอรี `#f6f4ef`, ink `#1c1a16`, muted taupe `#8a8175`, accent เดียว vermilion `#c2402a` ใช้เฉพาะจุดสำคัญ |
| Typography | `Fraunces` (serif มีนิสัย) + `Trirong` (serif ไทยสง่างาม) สำหรับ display, `Sarabun` body |
| Geometry | เส้น hairline 1px, เฟรมภาพมี mat กว้างเหมือนภาพในกรอบ, index numeral ขนาดใหญ่, ช่องว่างเยอะ |
| Motion | แทบไม่มี; เฉพาะ fade เข้าแบบช้าสั้นๆ และ underline ขยายตอน hover |
| Signature | ซีรีส์ที่กำลังฉาย = "Current Exhibition" พร้อมหมายเลข 001, museum label (ชื่อ, สตูดิโอ, ปี, ตอน) ใต้ภาพ, ปฏิทินเป็น exhibition calendar |

**เหมาะเมื่อ:** อยากยกระดับภาพลักษณ์ให้ premium และแยกตัวจากแอปแฟนคลับที่สีสันจัดจ้าน
**ความเสี่ยง:** อาจรู้สึกเย็นชา/ห่างเหินกับชุมชนถ้าใช้ accent น้อยเกิน; ต้องระวัง hierarchy ของ action หลัก

**Mockup:** `mockups/concept-c-gallery.html`

---

## Concept D — Night Market

> "ตลาดนัดกลางคืนของคนรักซีรีส์ เปิดทุกคืน"

**Mood:** ครึกครื้น, เป็นกันเอง, นีออนไทย หลอดไฟตลาดนัด ป้ายร้านเรืองแสง

| หมวด | รายละเอียด |
|---|---|
| Palette | ค่ำคืน `#16101f`, panel `#1f1730`, ink ครีม `#fff3e0`, neon pink `#ff5ea8`, gold `#ffc233`, green `#52e0a8`, violet `#9d6bff` |
| Typography | `Kanit` display (ไทยหนาอ่านง่าย) + `Sarabun` body |
| Geometry | ป้ายนีออนกรอบเรืองแสง, กระเช้าร้าน (awning stripe), หลอดไฟเรียงแถวเป็น decoration |
| Motion | หลอดไฟกะพริบสลับสี, neon glow ตอน hover; ปิดใน reduced-motion |
| Signature | ซีรีส์ = "ร้านค้า" มีกระเช้า, ตารางฉาย = "ตารางเปิดร้าน", halo = "เสียงคุยหน้าร้าน" |

**เหมาะเมื่อ:** อยากได้ความสนุกแบบไทยๆ และเน้นกิจวัตร "ดูซีรีส์ตอนกลางคืน"
**ความเสี่ยง:** สี neon หลายสีต้องคุม contrast ให้ผ่าน AA; อาจรู้สึกจัดจ้านใน light mode

**Mockup:** `mockups/concept-d-night-market.html`

---

## Concept E — Y2K Diary

> "บล็อกไดอารี่ยุคอินเทอร์เน็ต 2000 ของแฟนคลับ"

**Mood:** nostalgic, ขี้เล่น, retro internet: หน้าต่างโปรแกรม, guestbook, chrome gradient, pixel font

| หมวด | รายละเอียด |
|---|---|
| Palette | chrome pastel `#ffd6f5/#b8f0ff/#d9c8ff`, ink `#241a3a`, hot pink `#ff3fbf`, blue `#3f7dff`, พื้นตาราง grid `#e8e6f5` |
| Typography | `Silkscreen` (pixel) สำหรับ accent/label + `Prompt` body ไทย |
| Geometry | หน้าต่าง window มี title bar, กรอบดำ 2px + hard drop shadow เยื้อง, dashed border |
| Motion | window ยกขึ้นตอน hover แบบขยับทันที; ไม่มี animation วนซ้ำ |
| Signature | countdown อยู่ในหน้าต่าง `now_airing.txt`, ตารางฉาย = guestbook, ซีรีส์ = แผ่น CD |

**เหมาะเมื่อ:** อยากตีตลาดความ nostalgic/community-driven เหมือนเว็บแฟนคลับยุคบล็อก
**ความเสี่ยง:** pixel font ไม่รองรับไทย ต้องใช้เฉพาะ Latin accent; อาจดูแก่สำหรับกลุ่มผู้ใช้บางส่วน

**Mockup:** `mockups/concept-e-y2k-diary.html`

---

## Concept F — Bauhaus Orbit

> "วงโคจรของรูปทรงเรขาคณิต โมเดิร์นนิสต์ที่ขี้เล่น"

**Mood:** สนุกแบบมีระบบ, โปสเตอร์โมเดิร์นนิสต์, สี primary จัดใจ, รูปทรงพื้นฐานคือ "วงโคจร"

| หมวด | รายละเอียด |
|---|---|
| Palette | กระดาษ `#f2efe7`, ink `#14120e`, red `#e0301e`, blue `#1e46c8`, yellow `#f5b700` ใช้ทีละสีต่อจุด |
| Typography | `Archivo` (ExtraBold display) + `Anuphan` body ไทย |
| Geometry | กริดเส้นหนา 2px, วงกลม/ครึ่งวง/สามเหลี่ยมเป็น hero shape และ nav icon แทนไอคอนทั่วไป |
| Motion | hover = เปลี่ยนสีพื้น/กรอบทันที, ไม่มี perpetual animation |
| Signature | วงกลมแดงคือโลโก้ "orbit", nav ใช้รูปทรงเรขาคณิต, แถว live = พื้นเหลืองทั้งแถว |

**เหมาะเมื่อ:** อยากได้ identity ที่สดใหม่ เป็นศิลปะ และผูกกับชื่อ "Orbit" โดยตรง
**ความเสี่ยง:** สี primary จัดต้องระวัง contrast บนพื้นเหลือง/แดง; รูปทรงต้องไม่แทนที่ icon ที่สื่อความหมาย

**Mockup:** `mockups/concept-f-bauhaus-orbit.html`

---

## Concept G — Peach Studio (Minimal Pastel)

> "สตูดิโอสีพีชยามเช้า ขาวสะอาดและนุ่มนวล"

**Mood:** สะอาด, อบอุ่น, ทันสมัยแบบ Korean café minimal เน้นช่องว่างและของกลมนุ่ม

| หมวด | รายละเอียด |
|---|---|
| Palette | ครีม `#fdf8f4`, ขาว `#ffffff`, ink `#3a2e2a`, peach `#f7b8a0`, peach เข้ม `#e08a6c`, peach อ่อน `#fdeae2` |
| Typography | `DM Serif Display` (display สั้นๆ) + `Bai Jamjuree` body ไทย |
| Geometry | radius นุ่ม 18-22px, เส้นแบ่งบางสีอ่อน, การ์ดขาวลอยบนพื้นครีม, bottom nav แบบ floating pill |
| Motion | ยกการ์ดขึ้นนิดเดียว + shadow อุ่นตอน hover; ไม่มี animation วนซ้ำ |
| Signature | วงแหวน countdown conic, ตารางฉายเป็นชิปกลม, ขีดใต้หัวข้อสั้นสีพีช |

**เหมาะเมื่อ:** อยากได้ความ minimal ที่ยังอบอุ่นและเป็นมิตร เข้ากับ pastel themes เดิมได้ง่ายที่สุดในชุดนี้
**ความเสี่ยง:** radius ใหญ่แตกต่างจาก geometry เดิมโดยตรง; peach อ่อนต้องเช็ก contrast ของข้อความเล็ก

**Mockup:** `mockups/concept-g-peach-studio.html`

---

## Concept H — Lavender Mist (Minimal Pastel)

> "หมอกลาเวนเดอร์ลอยเบาๆ เหนือท้องฟ้าพลบค่ำ"

**Mood:** ละมุน, ฝันๆ, glassy การ์ดใสทับ gradient pastel นุ่ม

| หมวด | รายละเอียด |
|---|---|
| Palette | gradient พื้น `#efe8fd → #e2edff → #fbe9f4`, ink `#3c3552`, lavender `#a78bfa/#7c5ce8`, sky `#93c5fd`, rose `#f0a6c0` |
| Typography | `Quicksand` (display กลมนุ่ม) + `Prompt` body ไทย |
| Geometry | glass card (`backdrop-filter blur`), radius 20-30px, blob gradient จางๆ เป็นบรรยากาศ, ไม่มีเส้นขอบหนา |
| Motion | hover ยกการ์ดช้ากว่าปกติเล็กน้อย; blob คงที่ไม่เคลื่อนไหว; reduced-motion ปิดทั้งหมด |
| Signature | ตัวเลข countdown gradient, progress bar บาง gradient, nav active เป็น pill gradient |

**เหมาะเมื่อ:** อยากได้อารมณ์นุ่มฝันเหนือ pastel ทั่วไป และยังคุม content density ได้
**ความเสี่ยง:** `backdrop-filter` มีค่า performance บนอุปกรณ์อ่อนและต้องมี fallback; ข้อความบน glass ต้องเช็ก contrast เมื่อ gradient ด้านหลังเปลี่ยน

**Mockup:** `mockups/concept-h-lavender-mist.html`

---

## Concept I — Matcha Zakka (Minimal Pastel)

> "ร้านของชำญี่ปุ่น เงียบสงบ เรียบง่าย เป็นธรรมชาติ"

**Mood:** สงบ, อบอุ่นแบบธรรมชาติ, เขียวมัทฉะจืด + ดินเผา เส้นบางและช่องว่างเยอะ

| หมวด | รายละเอียด |
|---|---|
| Palette | ครีมเขียว `#f3f4ec`, ขาวอุ่น `#fafaf4`, ink `#39412f`, matcha `#8fa876/#5d7a48`, ดินเผา `#c8a288` |
| Typography | `Marcellus` (display serif นุ่ม) + `Sarabun` body ไทย |
| Geometry | radius เล็ก 10-14px, เส้นแบ่ง 1px สีอ่อน, accent bar แนวตั้งสีเขียวเข้ม, แทบไม่มีเงา |
| Motion | ยก artwork นิดเดียวตอน hover; นิ่งเป็นหลัก |
| Signature | จุดกลมเล็กในชื่อแบรนด์, ตารางเป็นแถวเส้นบางเรียงตัว, indicator ขีดสั้นเหนือ nav item |

**เหมาะเมื่อ:** อยากได้ minimal ที่สุดของทั้ง 9 แบบ อ่านง่าย น้ำหนักเบา และแปลงเป็น dark mode ได้ธรรมชาติ
**ความเสี่ยง:** อาจดูเงียบเกินสำหรับชุมชนแฟนคลับ; สีเขียวจืดต้องระวัง state ที่ต้องเด่น (error/live)

**Mockup:** `mockups/concept-i-matcha-zakka.html`

---

## Concept J — Liquid Glass (สไตล์ Apple iOS 26)

> "กระจกโปร่งแสงที่หักเหและสะท้อนแสงรอบตัว"

**Mood:** premium, ลื่นไหล, ทันสมัยสุดๆ — ชั้นกระจกใสลอยอยู่เหนือ wallpaper สีสด แสงสะท้อนขอบบน

| หมวด | รายละเอียด |
|---|---|
| Palette | wallpaper gradient สด (rose/violet/sky/peach บนพื้นเข้ม), กระจก `rgba(255,255,255,0.16)`, ขอบแสง `rgba(255,255,255,0.35)` |
| Typography | system-like: `Prompt` weight เบา-กลาง, hierarchy ด้วย size/weight ล้วน |
| Geometry | radius ใหญ่ต่อเนื่อง (20-44px), dock pill ลอย, specular highlight ขอบบนทุกชั้นกระจก, inner shadow บาง |
| Motion | scale การ์ดเบาๆ ตอน hover; ไม่มี perpetual animation |
| Signature | กระจก `backdrop-filter: blur + saturate`, ขอบ specular ด้วย inset shadow + gradient sweep, nav เป็น floating dock ทรง pill |

**เหมาะเมื่อ:** อยากได้ความรู้สึก native iOS ที่ทันสมัยที่สุด และเน้น artwork/wallpaper เป็นพื้นหลังมีชีวิต
**ความเสี่ยง:** ต้องมี fallback เมื่อ `backdrop-filter` ไม่รองรับ (mockup ใส่ไว้แล้ว); contrast ข้อความบนกระจกขึ้นกับ wallpaper ด้านหลังต้องคุมเข้ม; performance blur หลายชั้นบนมือถืออ่อน

**Mockup:** `mockups/concept-j-liquid-glass.html`

---

## Concept K — Coquette Pink (Pink Aesthetic)

> "ความหวานละมุนแบบ Pinterest pink aesthetic ผูกโบว์ไว้ทุกมุม"

**Mood:** หวาน, ฝันๆ, coquette vibe: โบว์, lace, ตัวหนังสือ serif italic, หัวใจจิ๋ว — เหมือน moodboard สีชมพูของแฟนคลับ

| หมวด | รายละเอียด |
|---|---|
| Palette | blush `#fdf1f5`, ขาวชมพู `#fffafc`, ink กะปิเข้ม `#5c3040`, rose `#e97fa3/#c9517c`, rose อ่อน `#fadce8`, cream `#fff4ee` |
| Typography | `Cormorant Garamond` (serif italic สำหรับหัวข้อ/quote) + `Sarabun` body ไทย |
| Geometry | radius นุ่ม 18-22px, เส้น dashed ลาย lace, หัวข้อกึ่งกลางมีเส้นประกบสองข้าง, nav pill ลอย |
| Motion | hover ยกการ์ดเบาๆ; ไม่มี perpetual animation |
| Signature | ประดับ โบว์/หัวใจ (decoration เท่านั้น ไม่แทนที่ label), quote จาก Halo เป็น serif italic, section title ภาษาอังกฤษ italic |

**เหมาะเมื่อ:** อยากได้ vibe aesthetic ชมพูที่เข้ากับวัฒนธรรมแฟนคลับ GL โดยตรง และโดดเด่นบน social share
**ความเสี่ยง:** โบว์/ลูกเล่นต้องไม่บัง content และต้องจำกัดจำนวน; serif italic ไม่รองรับไทย หัวข้อไทยต้อง fallback เป็นตัวธรรมดา; ชมพูอ่อนต้องเช็ก contrast

**Mockup:** `mockups/concept-k-coquette-pink.html`

---

## Concept L — Sakura (ซากุระญี่ปุ่น)

> "ฤดูซากุระบาน กลีบดอกร่วงหล่นเบาๆ บนกระดาษ washi"

**Mood:** งดงาม สงบ มีพิธีกรรมเล็กๆ แบบญี่ปุ่น — กระดาษ washi สีงาช้าง, ตราประทับสีชู (vermillion), กลีบซากุระร่วง

| หมวด | รายละเอียด |
|---|---|
| Palette | washi `#faf6f0`, ขาวอุ่น `#fffdf9`, ink `#2f2a28`, sakura `#f2b8c6/#fce7ec`, shu `#c73e3a`, gold `#c9a25e` |
| Typography | `Shippori Mincho` (serif ญี่ปุ่นสำหรับ display) + `Sarabun` body ไทย, หัวข้อคู่ภาษาญี่ปุ่น-ไทย |
| Geometry | กรอบซ้อนเส้นบาง (double frame), accent bar สี sakura, เหลี่ยมเรียบไม่มี radius หรือ radius เล็กมาก |
| Motion | กลีบซากุระร่วงช้าๆ (CSS-only, pointer-inert, ปิดใน reduced-motion), hover ยกการ์ดเบาๆ |
| Signature | ตราประทับ hanko 「軌道」「新作」「人気」, เส้นกิ่งซากุระใต้โลโก้, หัวข้อสองภาษา เช่น 番組表 · ตารางฉาย |

**เหมาะเมื่อ:** อยากได้อารมณ์ญี่ปุ่นที่สง่างามกว่า K (coquette) และอบอุ่นกว่า I (matcha) เหมาะกับธีม Sakura ที่มีอยู่แล้วในแอป
**ความเสี่ยง:** อักษรญี่ปุ่นประกอบต้องเป็น decoration/คำสั้นเท่านั้น ไม่แทนที่ label ไทย-อังกฤษหลัก; petal animation ต้องปิดใน reduced-motion และไม่กิน performance

**Mockup:** `mockups/concept-l-sakura.html`

---

## Concept M — Art Deco

> "ยุคทองของการแสดง 1920s ทองและมรกต"

**Mood:** หรูหรา, มีพิธีการ, ทองบนเขียวเข้ม ลายพัดและเส้นประกอบแบบ Gatsby

| หมวด | รายละเอียด |
|---|---|
| Palette | เขียวเกือบดำ `#101a17`, panel `#16241f`, ink ครีม `#f0e6cf`, ทอง `#d4af5a`, มรกต `#1f5c46` |
| Typography | `Cinzel` (display ตัวพิมพ์ใหญ่เว้นวรรคกว้าง) + `Sarabun` body ไทย |
| Geometry | กรอบซ้อนเส้นทองบาง, มุมตกแต่ง corner ticks, ลายพัด conic ใต้โลโก้, เหลี่ยมสมมาตร |
| Motion | แทบนิ่ง; hover เปลี่ยนเฉพาะสีขอบเป็นทอง |
| Signature | letter-spacing กว้างสไตล์ป้ายโรงละคร, quote จาก Halo มีเครื่องหมาย ❝❞ ทอง, แถว live พื้นทองจาง |

**เหมาะเมื่อ:** อยากได้ความพรีเมียมเหนือ C (Gallery) โดยยัง dark และเป็นพิธี
**ความเสี่ยง:** Cinzel ไม่รองรับไทย หัวข้อไทยต้อง fallback; ทองบนเข้มต้องเช็ก contrast ข้อความเล็ก

**Mockup:** `mockups/concept-m-art-deco.html`

---

## Concept N — Ocean Breeze

> "ลมทะเลยามเย็น สดชื่นและโปร่ง"

**Mood:** สดชื่น, ผ่อนคลาย, ฟ้าอควา + ปะการัง โค้งมนเป็นมิตร

| หมวด | รายละเอียด |
|---|---|
| Palette | ฟ้าอ่อน `#eef7fa`, ขาว, ink `#14384a`, ทะเล `#1f9ab8/#0d6d8a`, ปะการัง `#ff8a70`, ทราย `#fdf3e2` |
| Typography | `Comfortaa` (display กลม) + `Prompt` body ไทย |
| Geometry | radius นุ่ม 18-26px, ลูกคลื่น scallop, ชิป pill, halo card พื้นทราย |
| Motion | hover ยกการ์ด + เงาฟ้า; ไม่มี perpetual animation |
| Signature | hero countdown gradient ทะเลทั้งใบ, หัวข้อมีเครื่องหมายคลื่น 〜, nav pill ฟ้าอ่อน |

**เหมาะเมื่อ:** อยากได้โทนเย็นสบายที่สดใสกว่า I และเป็นธรรมชาติกว่า H
**ความเสี่ยง:** ขาวบน gradient ทะเลต้องเช็ก contrast; ลูกเล่นคลื่นต้องไม่รกบนจอเล็ก

**Mockup:** `mockups/concept-n-ocean-breeze.html`

---

## Concept O — Swiss Brutalist

> "หนังสือพิมพ์สวิส ขาวดำเส้นหนา แดงเพียงจุดเดียว"

**Mood:** ดิบ, แม่นยำ, เสียงดังด้วย typography — กริดเส้น 3px, mono, ไม่มีเงาไล่สี

| หมวด | รายละเอียด |
|---|---|
| Palette | ขาวเทา `#f4f4f0`, ดำ `#111111`, แดง `#e8290b` เฉพาะจุดสำคัญ |
| Typography | `IBM Plex Sans Thai` (หนักหัวข้อ) + `IBM Plex Mono` (label/เวลา) |
| Geometry | เส้นแบ่งหนา 3px, ไม่มี radius, แถว live มี bar แดงด้านซ้าย, nav ดำเต็มแถบ |
| Motion | marquee ตัววิ่งแถบเดียว (ปิดใน reduced-motion), hover = invert สีทันที |
| Signature | ตัวเลข countdown พื้นแดงเต็มบล็อก, การ์ดซีรีส์ลายเฉียงขาวดำ/แดง, issue number แนวตั้ง |

**เหมาะเมื่อ:** อยากได้ identity ที่แข็งแกร่ง อ่านง่าย และต่างจากทุกแอปในตลาด
**ความเสี่ยง:** อาจรู้สึกดุ/ไม่เป็นมิตรกับชุมชนแฟนคลับ; ต้องคุมน้ำหนักตัวหนาไม่ให้ทับเนื้อหาไทย

**Mockup:** `mockups/concept-o-swiss-brutalist.html`

---

## Concept P — Candy Pop

> "ถ้วยขนมหวานสีสันสดใสสำหรับ Gen Z"

**Mood:** สนุกสุดขีด, สติกเกอร์, neo-brutal สีหวาน — กรอบดำหนา เงาเยื้องสีลูกกวาด

| หมวด | รายละเอียด |
|---|---|
| Palette | ครีม `#fff6ec`, ink ม่วงเข้ม `#37204a`, pink `#ff5c9e`, orange `#ff9b3d`, mint `#2fd6a3`, grape `#9b5de5`, sky `#4bb7f0` |
| Typography | `Baloo 2` (display อ้วนนุ่ม) + `Prompt` body ไทย |
| Geometry | กรอบดำ 3px + hard shadow สีเยื้อง, radius นุ่ม 16-22px, หัวข้อเป็น pill มีเงา, badge เอียง |
| Motion | hover ยก + เอียงนิดเดียว; ไม่มี perpetual animation |
| Signature | ตัวอักษรโลโก้คนละสี, nav active พื้นดำ, เงาสีเปลี่ยนตาม section |

**เหมาะเมื่อ:** กลุ่มเป้าหมายเด็ก/Gen Z และอยากได้ความสนุกที่แตกต่างจาก D (neon ไทย)
**ความเสี่ยง:** สีหลายสีต้องกำหนด semantic ชัดเจนไม่ให้สื่อ state ผิด; กรอบหนาหลายชั้นกินพื้นที่จอเล็ก

**Mockup:** `mockups/concept-p-candy-pop.html`

---

## Concept Q — Twilight Garden

> "สวนกลางคืนที่หิ่งห้อยเรืองแสงระหว่างใบเฟิร์น"

**Mood:** ลึกลับ, โรแมนติก, เขียวเข้ม + หิ่งห้อยเหลืองอ่อน + กล้วยไม้ม่วง

| หมวด | รายละเอียด |
|---|---|
| Palette | เขียวดำ `#0f1b14`, panel `#152419`, ink `#e9f0e2`, หิ่งห้อย `#e8d98a`, เฟิร์น `#5d9c72`, กล้วยไม้ `#b98ad4` |
| Typography | `Cormorant` (serif italic ละมุน) + `Sarabun` body ไทย |
| Geometry | radius เล็ก 4px, เส้นบาง, vine divider มี ❦, แถว live พื้นเฟิร์นจาง |
| Motion | หิ่งห้อยลอยช้าๆ (CSS-only, ปิดใน reduced-motion), hover เปลี่ยนขอบเขียว |
| Signature | ตัวเลขเวลา/countdown สีหิ่งห้อย, quote จาก Halo เป็น italic serif, หัวข้อเว้นวรรคกว้าง |

**เหมาะเมื่อ:** อยากได้ dark theme ที่โรแมนติกและเป็นธรรมชาติ ต่างจาก A (tech) และ D (neon)
**ความเสี่ยง:** ข้อความเหลืองอ่อนบนเขียวเข้มต้องเช็ก contrast; อาจมืดเกินสำหรับ daytime usage

**Mockup:** `mockups/concept-q-twilight-garden.html`

---

## Concept R — Travel Journal

> "จดหมายเหตุการเดินทางผ่านโลกของซีรีส์"

**Mood:** อบอุ่น, คิดถึง, กระดาษคราฟท์ + ตราไปรษณีย์ + airmail — ทุกตอนคือ "เที่ยวเดินทาง"

| หมวด | รายละเอียด |
|---|---|
| Palette | คราฟท์ `#e9dcc3/#f7efdc`, ink น้ำตาล `#43392a`, แสตมป์ `#b4553c`, airmail `#3c5a8a` |
| Typography | `Special Elite` (typewriter สำหรับ accent/เวลา) + `Anuphan` body ไทย |
| Geometry | กระดาษมีบรรทัดบางๆ, เส้นประ, การ์ดเอียงเล็กน้อย, ตราประทับวงกลม dashed |
| Motion | การ์ดหมุนกลับตรงตอน hover; ไม่มี perpetual animation |
| Signature | แถบ airmail แดง-น้ำเงินด้านบน, countdown = "next departure" มีตรา FIRST AIRING, halo = จดหมาย PAR AVION |

**เหมาะเมื่อ:** อยากเล่าเรื่อง "การเดินทางผ่านเรื่องราว" และให้ความรู้สึกเป็นเอกลักษณ์เฉพาะตัว
**ความเสี่ยง:** typewriter font ไม่รองรับไทยและอ่านยาวยาก ใช้เฉพาะ accent; ต้องคุมองศาการเอียง

**Mockup:** `mockups/concept-r-travel-journal.html`

---

## Concept S — Celestial Map (Orbit)

> "แผนที่ท้องฟ้าของนักดาราศาสตร์ วงโคจรคือโครงสร้างของทุกหน้า"

**Mood:** สง่างาม, แม่นยำ, เหมือน atlas ดาราศาสตร์เก่า — วงโคจรเส้นบาง, พิกัด, แคตตาล็อกวัตถุท้องฟ้า แปลตรงจากชื่อ "Orbit"

| หมวด | รายละเอียด |
|---|---|
| Palette |  parchment `#f6f3ec`, ขาวอุ่น `#fdfbf6`, ink `#23202a`, orbit indigo `#4a5aa8`, ดวงอาทิตย์ `#d4883a` |
| Typography | `Cormorant Garamond` (display) + `IBM Plex Mono` (พิกัด/เวลา) + `Sarabun` body ไทย |
| Geometry | เหลี่ยมเรียบ, เส้นบาง 1px, วงโคจรวงกลมเป็น diagram เท่านั้น, nav icon = วงกลมกลวง |
| Motion | นิ่งเป็นหลัก; hover เปลี่ยนขอบ indigo |
| Signature | orrery (ดวงอาทิตย์ GL + ดาว SERIES/HALO/YOU), ตารางฉาย = "transit/ephemeris", ซีรีส์มีเลข OBJ-xxx, พิกัดกรุงเทพใต้โลโก้ |

**เหมาะเมื่อ:** อยากยกระดับแบรนด์ Orbit ให้มีภาษาภาพของตัวเองโดยไม่ต้อง dark mode
**ความเสี่ยง:** orrery ต้องเป็น decoration ไม่กินพื้นที่ content; mono/serif ไม่รองรับไทย ต้องแยก font ชัดเจน

**Mockup:** `mockups/concept-s-celestial-map.html`

---

## Concept T — Mission Control (Orbit)

> "ศูนย์ควบคุมภารกิจติดตามซีรีส์ — T-minus ถึงเวลาออกอากาศ"

**Mood:** เท่, แม่นยำ, retro NASA: countdown T-minus, telemetry, ป้าย GO/NOMINAL, สีน้ำเงินหน่วยงานอวกาศ

| หมวด | รายละเอียด |
|---|---|
| Palette | กระดาษ console `#edeae2`, panel `#f7f5ef`, ink `#1c1f26`, NASA blue `#0b3d91`, red `#c8352b`, amber/green สำหรับ status |
| Typography | `Barlow Condensed` (หัวข้อตัวแคบหนา) + `IBM Plex Mono` (readout) + `Sarabun` body ไทย |
| Geometry | กรอบดำ 2px, ไม่มี radius, บล็อก telemetry แบ่งช่อง, nav ดำเต็มแถบ active น้ำเงิน |
| Motion | นิ่ง; hover = กรอบน้ำเงิน |
| Signature | T-minus countdown พื้น NASA blue, แถบ telemetry SIGNAL/SUBTITLES/EP REMAIN, แถวถัดไปติด GO, ซีรีส์มีเลข MSN-xx, halo = incoming transmission |

**เหมาะเมื่อ:** อยากเน้น countdown/ตารางฉายให้เป็น "ภารกิจ" และได้ identity ที่ผูกกับ Orbit อย่างขำๆ แต่จริงจัง
**ความเสี่ยง:** อาจดูจริงจังเกิน/เย็นชา; condensed font ไม่รองรับไทย หัวข้อไทยต้อง fallback

**Mockup:** `mockups/concept-t-mission-control.html`

---

## Concept U — Stargazer (Orbit)

> "นอนดูดาวบนดาดฟ้า รอตอนใหม่ไปด้วยกัน"

**Mood:** ฝันหวาน, เงียบสงบ, โรแมนติก — ท้องฟ้ากะพริบ, ดวงจันทร์, เนบิวลา ซีรีส์แต่ละเรื่องคือกลุ่มดาว

| หมวด | รายละเอียด |
|---|---|
| Palette | ราตรี `#0e1226`, panel `#161b36`, ink `#eef0fa`, ดาว `#f2d98c`, nebula `#7a6fc8` |
| Typography | `Cormorant Garamond` (display/italic) + `Sarabun` body ไทย |
| Geometry | radius นุ่ม 14px, เส้นบาง, divider มี ✦, แถว live พื้น nebula จาง |
| Motion | ดาวกะพริบช้า (CSS-only, ปิดใน reduced-motion), hover เรือง nebula |
| Signature | ดวงจันทร์ radial gradient มีหลุม, ตารางฉาย = "กลุ่มดาวประจำคืน", halo = "คำอธิษฐานถึงดาว", nav active สีดาว |

**เหมาะเมื่อ:** อยากได้ dark theme ที่อ่อนโยนและผูกกับ Orbit/Space โดยไม่เป็น tech เหมือน A หรือ neon เหมือน D
**ความเสี่ยง:** overlap กับ theme Space ที่มีอยู่ (อาจรวมกันได้); ต้องเช็ก contrast ดาว/เนบิวลาบนพื้นเข้ม

**Mockup:** `mockups/concept-u-stargazer.html`

---

## เปรียบเทียบโดยสรุป

| | โทน | จุดขาย | ต่างจาก Orbit เดิม | ความเสี่ยงหลัก |
|---|---|---|---|---|
| A: Midnight Broadcast | dark, tech, ตื่นเต้น | countdown/ตารางฉาย | มาก (dark-first) | light theme + การอ่านไทย |
| B: Fan Zine | warm, handmade, ขี้เล่น | ชุมชน/ความใกล้ชิด | มาก (handmade) | ความรกบนจอเล็ก |
| C: Gallery | light, refined, สงบ | artwork/premium | ปานกลาง (ยัง editorial) | อารมณ์เย็นชา |
| D: Night Market | dark, neon ไทย, ครึกครื้น | บรรยากาศกลางคืน/สนุก | มาก (neon dark) | contrast + light mode |
| E: Y2K Diary | pastel chrome, retro | nostalgia/community | มาก (retro) | pixel font ไม่มีไทย |
| F: Bauhaus Orbit | light, สี primary จัด, ศิลปะ | identity ผูกชื่อ Orbit | ปานกลาง-มาก | contrast บนสีจัด |
| G: Peach Studio | cream, อบอุ่น, minimal | เข้ากับ pastel เดิมง่าย | มาก (rounded soft) | contrast ข้อความเล็ก |
| H: Lavender Mist | gradient ฝันๆ, glass | อารมณ์นุ่มเหนือ pastel | มาก (glassmorphism) | performance + fallback |
| I: Matcha Zakka | เขียวจืด, สงบ, เรียบสุด | อ่านง่าย เบา | ปานกลาง | อาจเงียบเกินไป |
| J: Liquid Glass | dark + กระจกสีสด, iOS 26 | premium native feel | มาก (glass ทั้งระบบ) | fallback + performance blur |
| K: Coquette Pink | ชมพูหวาน, coquette | vibe aesthetic เข้ากับ fandom | มาก (soft rounded) | ลูกเล่นต้องไม่รก, serif ไม่มีไทย |
| L: Sakura | washi + ชมพูซากุระ, ญี่ปุ่น | สง่างาม เข้ากับธีม Sakura เดิม | ปานกลาง-มาก | petal animation + ภาษาที่ 3 |
| M: Art Deco | dark, ทอง/มรกต, หรู | พิธีการพรีเมียม | มาก (dark เข้ม) | Cinzel ไม่มีไทย |
| N: Ocean Breeze | ฟ้าอควา สดชื่น | ผ่อนคลาย เป็นมิตร | มาก (rounded soft) | contrast บน gradient |
| O: Swiss Brutalist | ขาวดำดิบ + แดง | identity แข็งแกร่ง อ่านง่าย | มาก (brutal) | อาจดุเกินสำหรับ fandom |
| P: Candy Pop | สีลูกกวาดสดใส | Gen Z สนุกสุดขีด | มาก (neo-brutal) | สีเยอะต้องคุม semantic |
| Q: Twilight Garden | dark เขียว ลึกลับ | โรแมนติกธรรมชาติ | มาก (dark) | มืดเกินตอนกลางวัน |
| R: Travel Journal | คราฟท์ อบอุ่น | storytelling เดินทาง | มาก (vintage) | typewriter ไม่มีไทย |
| S: Celestial Map | parchment, atlas ดาราศาสตร์ | ภาษาภาพ Orbit โดยตรง (light) | ปานกลาง-มาก | diagram ต้องไม่กินเนื้อที่ |
| T: Mission Control | retro NASA, console | countdown เป็นภารกิจ | มาก | อาจจริงจัง/เย็นชา |
| U: Stargazer | dark ท้องฟ้า ฝันหวาน | โรแมนติกผูก Orbit/Space | มาก (dark) | overlap ธีม Space เดิม |

## ขั้นตอนถัดไป

1. เลือก 1 ทิศทาง (หรือผสม เช่น โครง C + อารมณ์ B)
2. ทำ spec ฉบับเต็ม: token contract, component inventory, a11y/reduced-motion rules
3. ทำ mockup หน้าอื่น (series detail, halo feed, profile) ของทิศทางที่เลือก
4. วางแผน migrate เข้า `src/app.css` + shared components โดยไม่แตะ business behavior
