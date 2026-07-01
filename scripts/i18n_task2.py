#!/usr/bin/env python3
"""Task 2: translate landing page."""
import json
import re
import sys
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
PAGE = ROOT / 'src/routes/[lang=lang]/(app)/+page.svelte'
IMPORT_STMT = "import { m } from '$lib/i18n/paraglide.js';\n"

MESSAGES = {
    'nav_home': {'th': 'หน้าแรก', 'en': 'Home'},
    'status_ongoing': {'th': 'กำลังฉาย', 'en': 'Ongoing'},
    'status_upcoming': {'th': 'เร็วๆ นี้', 'en': 'Coming soon'},
    'status_ended': {'th': 'จบแล้ว', 'en': 'Ended'},
    'common_see_all': {'th': 'ดูทั้งหมด', 'en': 'See all'},
    'common_load_more': {'th': 'ดูเพิ่มเติม', 'en': 'Load more'},
    'home_chat_aria_label': {'th': 'เปิด AI Chat', 'en': 'Open AI Chat'},
    'home_hero_badge': {'th': 'ยินดีต้อนรับสู่จักรวาล GL', 'en': 'Welcome to the GL universe'},
    'home_hero_title_start': {'th': 'ค้นพบซีรีส์', 'en': 'Discover series'},
    'home_hero_title_end': {'th': 'ที่คุณรัก', 'en': 'you love'},
    'home_hero_subtitle': {'th': 'ติดตามตารางฉาย ข้อมูลซีรีส์ และลิงก์รับชม<br class="hidden md:block" />ที่อัปเดตแบบเรียลไทม์', 'en': 'Follow schedules, series info, and watch links<br class="hidden md:block" />updated in real time'},
    'home_hero_description': {'th': "GL-Orbit รวมตารางฉายซีรีส์ Girls' Love จากแพลตฟอร์มยอดนิยม เช่น YouTube, iQIYI, GagaOOLala และ WeTV พร้อมเวลาออกอากาศตาม timezone ไทย ข้อมูลนักแสดง และสถานะ Uncut ในที่เดียว", 'en': "GL-Orbit gathers Girls' Love series schedules from popular platforms such as YouTube, iQIYI, GagaOOLala, and WeTV, with air times in Thailand timezone, cast info, and Uncut status all in one place"},
    'home_cta_schedule': {'th': 'ดูตารางฉาย', 'en': 'View schedule'},
    'home_cta_explore': {'th': 'สำรวจซีรีส์', 'en': 'Explore series'},
    'home_hero_guide_prompt': {'th': 'อยากรู้ว่า GL-Orbit ช่วยติดตามซีรีส์ GL อย่างไร?', 'en': 'Want to know how GL-Orbit helps track GL series?'},
    'home_hero_guide_link': {'th': 'อ่านคู่มือฉบับเต็ม', 'en': 'Read the full guide'},
    'home_scroll_hint': {'th': 'เลื่อนลง', 'en': 'Scroll down'},
    'home_countdown_title_plain': {'th': 'ใกล้', 'en': 'Airing'},
    'home_countdown_title_accent': {'th': 'ฉายแล้ว', 'en': 'soon'},
    'home_countdown_subtitle': {'th': 'นับถอยหลังสู่ตอนใหม่ · ภายใน 24 ชั่วโมง', 'en': 'Countdown to new episodes · within 24 hours'},
    'home_countdown_airing_in': {'th': 'ออกอากาศในอีก', 'en': 'Airing in'},
    'home_countdown_hours_short': {'th': 'ชม.', 'en': 'hr'},
    'home_countdown_minutes_short': {'th': 'นาที', 'en': 'min'},
    'home_countdown_seconds_short': {'th': 'วิ', 'en': 'sec'},
    'home_featured_title_plain': {'th': 'ซีรีส์', 'en': 'Featured'},
    'home_featured_title_accent': {'th': 'แนะนำ', 'en': 'series'},
    'home_featured_subtitle': {'th': 'ซีรีส์ GL ที่น่าติดตามในตอนนี้', 'en': 'GL series worth following right now'},
    'home_featured_empty_title': {'th': 'ยังไม่มีซีรีส์', 'en': 'No series yet'},
    'home_featured_empty_desc': {'th': 'ซีรีส์จะปรากฏที่นี่เมื่อมีข้อมูลในระบบ', 'en': 'Series will appear here when data is available'},
    'home_schedule_title_plain': {'th': 'ตารางฉาย', 'en': 'Upcoming'},
    'home_schedule_title_accent': {'th': 'เร็วๆ นี้', 'en': 'schedule'},
    'home_schedule_subtitle': {'th': 'ไม่พลาดทุกตอนสำคัญ', 'en': "Don't miss any important episode"},
    'home_schedule_empty_title': {'th': 'ไม่มีตารางฉายเร็วๆ นี้', 'en': 'No upcoming schedule'},
    'home_schedule_empty_desc': {'th': 'ตารางฉายจะปรากฏเมื่อมีซีรีส์ที่กำหนดฉาย', 'en': 'Schedule will appear when series have air dates'},
    'home_schedule_cta': {'th': 'ดูตารางฉายทั้งหมด', 'en': 'View full schedule'},
}

REPLACEMENTS = [
    # comments
    ('<!-- light gradient base (ตาม theme project) -->', '<!-- light gradient base (per project theme) -->'),
    ('<!-- Countdown: ซีรีส์ที่จะฉายภายใน 24 ชั่วโมง (สูงสุด 3 เรื่อง, หายไปเมื่อถึงเวลาฉาย) -->', '<!-- Countdown: series airing within 24 hours (max 3, disappears at air time) -->'),
    ('<!-- orbital halo + HH:MM:SS (จอแสดงผลหลัก — ไม่มีวัน เพราะใกล้ฉายภายใน 24 ชม.) -->', '<!-- orbital halo + HH:MM:SS (main display — no day, airing within 24h) -->'),
    ('<!-- playful lightning badge: ใกล้ฉายมาก -->', '<!-- playful lightning badge: airing very soon -->'),
    # JSON-LD language
    ("inLanguage: 'th-TH'", "inLanguage: page.data.lang === 'th' ? 'th-TH' : 'en-US'"),
    # breadcrumb
    ("name: 'หน้าแรก'", "name: m.nav_home()"),
    # status config
    ("ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' }", "ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' }"),
    ("UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' }", "UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' }"),
    ("ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }", "ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }"),
    # chat fab
    ('aria-label="เปิด AI Chat"', 'aria-label={m.home_chat_aria_label()}'),
    ('<span class="sr-only">เปิด AI Chat</span>', '{m.home_chat_aria_label()}'),
    # hero
    ('<span class="text-xs sm:text-sm font-medium text-plum-light">ยินดีต้อนรับสู่จักรวาล GL</span>', '<span class="text-xs sm:text-sm font-medium text-plum-light">{m.home_hero_badge()}</span>'),
    ('\t\t\tค้นพบซีรีส์\n', '\t\t\t{m.home_hero_title_start()}\n'),
    ('\t\t\tที่คุณรัก\n', '\t\t\t{m.home_hero_title_end()}\n'),
    ('\t\t\tติดตามตารางฉาย ข้อมูลซีรีส์ และลิงก์รับชม<br class="hidden md:block" />\n', '\t\t\t{@html m.home_hero_subtitle()}\n'),
    ('\t\t\tที่อัปเดตแบบเรียลไทม์\n', ''),
    ('\t\t\tGL-Orbit รวมตารางฉายซีรีส์ Girls\' Love จากแพลตฟอร์มยอดนิยม เช่น YouTube, iQIYI, GagaOOLala และ WeTV พร้อมเวลาออกอากาศตาม timezone ไทย ข้อมูลนักแสดง และสถานะ Uncut ในที่เดียว\n', '\t\t\t{m.home_hero_description()}\n'),
    ('\t\t\t\tดูตารางฉาย\n', '\t\t\t\t{m.home_cta_schedule()}\n'),
    ('\t\t\t\tสำรวจซีรีส์\n', '\t\t\t\t{m.home_cta_explore()}\n'),
    ('\t\t\tอยากรู้ว่า GL-Orbit ช่วยติดตามซีรีส์ GL อย่างไร?\n', '\t\t\t{m.home_hero_guide_prompt()}\n'),
    ('\t\t\t\tอ่านคู่มือฉบับเต็ม\n', '\t\t\t\t{m.home_hero_guide_link()}\n'),
    ('<span class="text-[10px] uppercase tracking-[0.25em]">เลื่อนลง</span>', '<span class="text-[10px] uppercase tracking-[0.25em]">{m.home_scroll_hint()}</span>'),
    # countdown
    ('\t\t\t\t\t\tใกล้<span class="text-coral">ฉายแล้ว</span>\n', '\t\t\t\t\t\t<span>{m.home_countdown_title_plain()}</span><span class="text-coral">{m.home_countdown_title_accent()}</span>\n'),
    ('\t\t\t\t\t\tนับถอยหลังสู่ตอนใหม่ · ภายใน 24 ชั่วโมง\n', '\t\t\t\t\t\t{m.home_countdown_subtitle()}\n'),
    ('\t\t\t\t\t\tดูทั้งหมด\n', '\t\t\t\t\t\t{m.common_see_all()}\n'),
    ('<p class="text-[11px] font-semibold uppercase tracking-wider text-plum-light/70 mb-2">ออกอากาศในอีก</p>', '<p class="text-[11px] font-semibold uppercase tracking-wider text-plum-light/70 mb-2">{m.home_countdown_airing_in()}</p>'),
    ("{@render timeUnit(pad(c.hours), 'ชม.')}", "{@render timeUnit(pad(c.hours), m.home_countdown_hours_short())}"),
    ("{@render timeUnit(pad(c.minutes), 'นาที')}", "{@render timeUnit(pad(c.minutes), m.home_countdown_minutes_short())}"),
    ("{@render timeUnit(pad(c.seconds), 'วิ')}", "{@render timeUnit(pad(c.seconds), m.home_countdown_seconds_short())}"),
    ('\t\t\t\tดูเพิ่มเติม\n', '\t\t\t\t{m.common_load_more()}\n'),
    # featured
    ('\t\t\t\t\t\t<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">กำลังฉาย</span>\n', '\t\t\t\t\t\t<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.status_ongoing()}</span>\n'),
    ('\t\t\t\t\tซีรีส์<span class="text-coral">แนะนำ</span>\n', '\t\t\t\t\t<span>{m.home_featured_title_plain()}</span><span class="text-coral">{m.home_featured_title_accent()}</span>\n'),
    ('\t\t\t\t\tซีรีส์ GL ที่น่าติดตามในตอนนี้\n', '\t\t\t\t\t{m.home_featured_subtitle()}\n'),
    ('\t\t\t\t\tดูทั้งหมด\n', '\t\t\t\t\t{m.common_see_all()}\n'),
    ('<h3 class="font-semibold text-plum mb-1">ยังไม่มีซีรีส์</h3>', '<h3 class="font-semibold text-plum mb-1">{m.home_featured_empty_title()}</h3>'),
    ('<p class="text-sm text-plum-light">ซีรีส์จะปรากฏที่นี่เมื่อมีข้อมูลในระบบ</p>', '<p class="text-sm text-plum-light">{m.home_featured_empty_desc()}</p>'),
    # schedule
    ('\t\t\t\t\tตารางฉาย<span class="text-coral">เร็วๆ นี้</span>\n', '\t\t\t\t\t<span>{m.home_schedule_title_plain()}</span><span class="text-coral">{m.home_schedule_title_accent()}</span>\n'),
    ('\t\t\t\t\tไม่พลาดทุกตอนสำคัญ\n', '\t\t\t\t\t{m.home_schedule_subtitle()}\n'),
    ('<h3 class="font-semibold text-plum mb-1">ไม่มีตารางฉายเร็วๆ นี้</h3>', '<h3 class="font-semibold text-plum mb-1">{m.home_schedule_empty_title()}</h3>'),
    ('<p class="text-sm text-plum-light">ตารางฉายจะปรากฏเมื่อมีซีรีส์ที่กำหนดฉาย</p>', '<p class="text-sm text-plum-light">{m.home_schedule_empty_desc()}</p>'),
    ('\t\t\t\tดูตารางฉายทั้งหมด\n', '\t\t\t\t{m.home_schedule_cta()}\n'),
]

def merge_messages():
    th = json.loads((MESSAGES_DIR / 'th.json').read_text(encoding='utf-8'))
    en = json.loads((MESSAGES_DIR / 'en.json').read_text(encoding='utf-8'))
    for key, vals in MESSAGES.items():
        th[key] = vals['th']
        en[key] = vals['en']
    (MESSAGES_DIR / 'th.json').write_text(json.dumps(th, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (MESSAGES_DIR / 'en.json').write_text(json.dumps(en, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Added {len(MESSAGES)} message keys")

def apply_replacements():
    content = PAGE.read_text(encoding='utf-8')
    if IMPORT_STMT.strip() not in content:
        m = re.search(r'(<script[^>]*>\n?)', content)
        if m:
            content = content[:m.end()] + IMPORT_STMT + content[m.end():]
    mapping = {}
    parts = []
    for old, new in REPLACEMENTS:
        mapping[old] = new
        parts.append(re.escape(old))
    if not parts:
        return
    pattern = re.compile('|'.join(sorted(parts, key=len, reverse=True)))
    new_content = pattern.sub(lambda m: mapping[m.group(0)], content)
    PAGE.write_text(new_content, encoding='utf-8')
    print(f"Applied {len(REPLACEMENTS)} replacements to {PAGE}")

if __name__ == '__main__':
    merge_messages()
    apply_replacements()
