# Homepage Content Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add useful, visible homepage content so `/` better explains GL-Orbit and clears thin-content SEO warnings.

**Architecture:** Add static content data arrays to `src/routes/(app)/+page.svelte` and render one new informational section after the hero section. The section uses existing Tailwind/glassmorphism styling, no new dependencies, and no inline `style=` attributes.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind CSS 4.

## Global Constraints

- Modify only `src/routes/(app)/+page.svelte`.
- Preserve existing homepage visual design and behavior.
- Add visible, useful Thai-first copy with natural English terms: GL series, Girls' Love, schedule, timezone, streaming platform.
- Do not add hidden SEO-only text.
- Do not add inline `style=` attributes.
- Do not change database loading, countdown logic, featured series logic, schedule logic, auth, sitemap, robots, or `llms.txt`.
- Verification commands: `rg -n 'style=' 'src/routes/(app)/+page.svelte'`, visible text estimate script, and `npm run check`.

---

## File Structure

- Modify `src/routes/(app)/+page.svelte`: Add static content arrays and render a new homepage informational section after the hero section.

---

### Task 1: Add Homepage Content Data

**Files:**
- Modify: `src/routes/(app)/+page.svelte`

**Interfaces:**
- Consumes: No external data.
- Produces: `homepageGuideCards` and `homepageFaqs` arrays used by the new homepage content section.

- [ ] **Step 1: Add static content arrays in the script block**

Insert this code after the `schedulePalette` constant and before the existing `stagger80Classes` constant:

```ts
const homepageGuideCards = [
	{
		title: 'ติดตามตารางฉาย GL แบบไม่พลาดตอนใหม่',
		description:
			'GL-Orbit รวมตารางฉายซีรีส์ GL และ Girls\' Love series ไว้ในที่เดียว พร้อมข้อมูลวัน เวลา แพลตฟอร์ม และสถานะ Uncut เพื่อช่วยให้แฟนคลับวางแผนดูตอนใหม่ได้ง่ายขึ้น'
	},
	{
		title: 'ค้นหาซีรีส์ นักแสดง และสตูดิโอที่เกี่ยวข้อง',
		description:
			'หน้าแรกเชื่อมต่อไปยังฐานข้อมูลซีรีส์ รายชื่อนักแสดง และรายละเอียดผลงาน เพื่อให้ผู้ใช้สำรวจจักรวาล GL ได้ต่อเนื่องจากเรื่องที่กำลังฉายไปจนถึงเรื่องที่กำลังจะมา'
	},
	{
		title: 'เช็กลิงก์รับชม แพลตฟอร์ม และเวอร์ชัน Uncut',
		description:
			'ข้อมูลของแต่ละตอนออกแบบให้ช่วยตอบคำถามสำคัญของผู้ชม เช่น ฉายที่ไหน เวลาใด มีเวอร์ชัน Uncut หรือไม่ และควรกลับมาเช็กตารางอีกครั้งเมื่อไร'
	}
] as const;

const homepageFaqs = [
	{
		question: 'GL-Orbit เหมาะกับใคร?',
		answer:
			'เหมาะกับแฟนซีรีส์ Girls\' Love ทั้งคนที่ติดตามอยู่แล้วและผู้ชมใหม่ที่อยากเริ่มสำรวจซีรีส์ GL ผ่านตารางฉาย รายชื่อซีรีส์ นักแสดง สตูดิโอ และแพลตฟอร์มสตรีมมิ่งที่เกี่ยวข้อง'
	},
	{
		question: 'ตารางฉายใน GL-Orbit ช่วยอะไร?',
		answer:
			'ตารางฉายช่วยรวมข้อมูลตอนใหม่ไว้ในรูปแบบที่อ่านง่าย ผู้ใช้สามารถดูซีรีส์ที่กำลังจะออกอากาศ รายการที่ใกล้ฉาย และรายละเอียดเวลาออกอากาศโดยไม่ต้องค้นหาจากหลายแหล่งพร้อมกัน'
	},
	{
		question: 'คำว่า Uncut บนเว็บไซต์หมายถึงอะไร?',
		answer:
			'ป้าย Uncut ใช้บอกว่าตอนหรือรอบฉายนั้นมีเวอร์ชันที่ไม่ตัดทอน ซึ่งเป็นข้อมูลที่แฟนซีรีส์ GL มักต้องการตรวจสอบก่อนเลือกช่องทางรับชมบน streaming platform ต่าง ๆ'
	},
	{
		question: 'ทำไมควรกลับมาเช็ก GL-Orbit เป็นประจำ?',
		answer:
			'ตารางฉายและข้อมูลแพลตฟอร์มอาจเปลี่ยนได้ตามประกาศของผู้ผลิตหรือผู้ให้บริการสตรีมมิ่ง การกลับมาเช็ก GL-Orbit ช่วยให้ผู้ชมเห็นข้อมูลล่าสุดและไม่พลาดตอนสำคัญ'
	},
	{
		question: 'เว็บไซต์นี้ต่างจากรายการแนะนำซีรีส์ทั่วไปอย่างไร?',
		answer:
			'GL-Orbit ไม่ได้เป็นแค่ลิสต์แนะนำ แต่ทำหน้าที่เป็นศูนย์กลางข้อมูลสำหรับการติดตามซีรีส์ GL ทั้งตารางฉาย countdown รายชื่อนักแสดง ลิงก์รับชม และบริบทของแต่ละเรื่องในชุมชนแฟนคลับ'
	}
] as const;
```

- [ ] **Step 2: Run a quick TypeScript syntax check through Svelte validation**

Run:

```bash
npm run check
```

Expected: exit status 0. Existing unrelated Svelte warnings may remain.

---

### Task 2: Render the New Homepage SEO Content Section

**Files:**
- Modify: `src/routes/(app)/+page.svelte`

**Interfaces:**
- Consumes: `homepageGuideCards` and `homepageFaqs` from Task 1.
- Produces: A visible homepage content section between the hero and countdown/featured content.

- [ ] **Step 1: Insert the content section after the hero section**

Find the closing `</section>` for the hero section, immediately before the comment:

```svelte
<!-- Countdown: ซีรีส์ที่จะฉายภายใน 24 ชั่วโมง (สูงสุด 3 เรื่อง, หายไปเมื่อถึงเวลาฉาย) -->
```

Insert this full section between them:

```svelte
<!-- About GL-Orbit: SEO-friendly guide content -->
<section class="relative -mx-4 px-4 py-12 sm:py-16 content-visibility-auto">
	<div class="absolute inset-0 bg-gradient-to-b from-white/30 via-lavender/5 to-transparent pointer-events-none"></div>
	<div class="relative mx-auto max-w-6xl">
		<div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
			<div class="glass-card-strong rounded-[2rem] p-6 sm:p-8 lg:p-10">
				<div class="inline-flex items-center gap-2 mb-4 rounded-full bg-coral/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">
					<span class="h-2 w-2 rounded-full bg-coral"></span>
					Guide to GL-Orbit
				</div>
				<h2 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum leading-tight">
					GL-Orbit คืออะไร
				</h2>
				<div class="mt-5 space-y-4 text-sm sm:text-base leading-7 text-plum-light">
					<p>
						GL-Orbit คือเว็บศูนย์กลางสำหรับแฟนซีรีส์ Girls' Love หรือ GL series ที่ต้องการติดตามข่าวสารแบบเป็นระบบ ตั้งแต่ตารางฉายตอนใหม่ รายละเอียดซีรีส์ นักแสดง สตูดิโอ ไปจนถึงช่องทางรับชมบน streaming platform ต่าง ๆ จุดตั้งต้นของเว็บคือการทำให้การตามซีรีส์ GL ง่ายขึ้นสำหรับผู้ชมไทยและแฟนต่างประเทศที่อยากรู้ว่าเรื่องไหนกำลังฉาย เรื่องไหนกำลังจะมา และควรดูตอนใหม่เมื่อไร
					</p>
					<p>
						หน้าแรกของ GL-Orbit ออกแบบให้เป็นเหมือนแผงควบคุมของจักรวาล GL ผู้ใช้สามารถเริ่มจากตารางฉายประจำวัน ดู countdown ของตอนที่ใกล้ออกอากาศ สำรวจซีรีส์แนะนำ แล้วคลิกต่อไปยังหน้ารายละเอียดเพื่อดูข้อมูลเพิ่มเติม เช่น สถานะเรื่อง จำนวนตอน แพลตฟอร์มรับชม และป้าย Uncut ที่ช่วยบอกว่ารอบนั้นมีเวอร์ชันไม่ตัดทอนหรือไม่
					</p>
					<p>
						เราให้ความสำคัญกับข้อมูลที่อ่านง่ายและเป็นประโยชน์จริง ไม่ใช่แค่รายชื่อเรื่องแบบสั้น ๆ เพราะแฟนคลับมักต้องการบริบทมากกว่านั้น ทั้งชื่อไทย ชื่ออังกฤษ ศิลปินที่เกี่ยวข้อง และเวลาฉายที่สัมพันธ์กับ timezone ของผู้ชม การกลับมาเช็ก GL-Orbit เป็นประจำจึงช่วยลดโอกาสพลาดตอนสำคัญและช่วยให้ค้นพบซีรีส์ GL เรื่องใหม่ได้ต่อเนื่อง
					</p>
				</div>
			</div>

			<div class="space-y-4">
				{#each homepageGuideCards as card}
					<article class="glass-card rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-lavender/20">
						<h3 class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">{card.title}</h3>
						<p class="mt-2 text-sm sm:text-base leading-7 text-plum-light">{card.description}</p>
					</article>
				{/each}
			</div>
		</div>

		<div class="mt-8 glass-card rounded-[2rem] p-6 sm:p-8">
			<div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p class="text-[11px] font-bold uppercase tracking-[0.2em] text-lavender-dark">FAQ</p>
					<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum">คำถามที่พบบ่อยเกี่ยวกับ GL-Orbit</h2>
				</div>
				<p class="max-w-xl text-sm leading-6 text-plum-light">คำตอบสั้น ๆ สำหรับผู้ใช้ใหม่ที่อยากรู้ว่าเว็บไซต์นี้ช่วยติดตามซีรีส์ GL ได้อย่างไร</p>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				{#each homepageFaqs as faq}
					<article class="rounded-2xl border border-white/70 bg-white/60 p-4 sm:p-5 shadow-sm shadow-lavender/10">
						<h3 class="font-semibold text-plum">{faq.question}</h3>
						<p class="mt-2 text-sm leading-7 text-plum-light">{faq.answer}</p>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>
```

- [ ] **Step 2: Run homepage inline style verification**

Run:

```bash
rg -n 'style=' 'src/routes/(app)/+page.svelte'
```

Expected: no matches.

---

### Task 3: Verify Content Increase and Project Health

**Files:**
- Verify only; no planned file edits.

**Interfaces:**
- Consumes: Homepage content section from Tasks 1-2.
- Produces: Evidence that visible content increased and project validation still passes.

- [ ] **Step 1: Run visible text estimate**

Run:

```bash
python - <<'PY'
from pathlib import Path
import re
p = Path('src/routes/(app)/+page.svelte')
txt = p.read_text()
markup = txt.split('</script>', 1)[-1]
markup = re.sub(r'<svelte:head>[\s\S]*?</svelte:head>', ' ', markup)
markup = re.sub(r'<svg[\s\S]*?</svg>', ' ', markup)
markup = re.sub(r'{#[\s\S]*?}|{/if}|{/each}|{@[^}]+}|{[^}]+}', ' ', markup)
visible = ' '.join(re.findall(r'>([^<>{}]+)<', markup))
visible = re.sub(r'\s+', ' ', visible).strip()
thai_chars = len(re.findall(r'[\u0E00-\u0E7F]', visible))
latin_words = len(re.findall(r'[A-Za-z0-9]+', visible))
approx_words = latin_words + thai_chars // 5
print(f'visible_text_chars={len(visible)}')
print(f'approx_words={approx_words}')
print(visible[:800])
PY
```

Expected: `visible_text_chars` and `approx_words` are materially higher than the pre-change baseline of roughly 526 visible characters and 96 rough words.

- [ ] **Step 2: Run Svelte/TypeScript validation**

Run:

```bash
npm run check
```

Expected: exit status 0. Existing unrelated Svelte warnings may remain.

- [ ] **Step 3: Optionally inspect homepage locally**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Open or curl:

```bash
curl -s http://127.0.0.1:5173/ | grep -E 'GL-Orbit คืออะไร|คำถามที่พบบ่อยเกี่ยวกับ GL-Orbit' | head
```

Expected: the new section headings appear in the rendered homepage HTML.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add 'src/routes/(app)/+page.svelte'
git commit -m "feat: expand homepage SEO content"
```

Expected: commit succeeds and includes only `src/routes/(app)/+page.svelte`.

---

## Self-Review

- Spec coverage: The plan adds a visible homepage guide section, feature cards, FAQ copy, natural GL/Girls' Love keywords, and verification for no inline styles plus project health.
- Placeholder scan: No unresolved implementation placeholders are present.
- Type consistency: New arrays are `as const` and consumed directly by Svelte `{#each}` blocks.
