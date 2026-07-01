#!/usr/bin/env python3
"""Task 5 (countdown): translate countdown page."""
import json
import re
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
PAGE = ROOT / 'src/routes/[lang=lang]/(app)/countdown/+page.svelte'
IMPORT_STMT = "import { m } from '$lib/i18n/paraglide.js';\n"

MESSAGES = {
    'countdown_seo_title': {'th': 'นับถอยหลังซีรีส์ GL | GL-Orbit', 'en': 'GL Series Countdown | GL-Orbit'},
    'countdown_seo_description': {'th': 'นับถอยหลังสู่ตอนใหม่ของซีรีส์ GL ที่กำลังฉายและที่กำลังจะฉาย พร้อมเวลาออกอากาศและแพลตฟอร์มรับชม', 'en': 'Countdown to new episodes of GL series currently airing and upcoming, with air times and streaming platforms'},
    'countdown_breadcrumb': {'th': 'นับถอยหลัง', 'en': 'Countdown'},
    'countdown_title_plain': {'th': 'นับถอยหลัง', 'en': 'Countdown'},
    'countdown_title_accent': {'th': 'ซีรีส์ GL', 'en': 'GL Series'},
    'countdown_subtitle': {'th': 'ติดตามทุกตอนที่กำลังจะฉาย — ซีรีส์ที่กำลังฉายและที่ยังไม่ฉาย ภายใน 7 วันข้างหน้า', 'en': 'Track every upcoming episode — airing and not-yet-aired series within the next 7 days'},
    'countdown_tracking_label': {'th': 'กำลังติดตาม', 'en': 'Tracking'},
    'countdown_tracking_suffix': {'th': 'ตอนที่จะฉาย · ภายใน 7 วัน', 'en': 'upcoming episodes · within 7 days'},
    'common_days': {'th': 'วัน', 'en': 'days'},
    'common_hours_short': {'th': 'ชม.', 'en': 'hr'},
    'common_minutes_short': {'th': 'นาที', 'en': 'min'},
    'common_seconds_short': {'th': 'วิ', 'en': 'sec'},
    'countdown_empty_title': {'th': 'ยังไม่มีตอนที่จะฉายในเร็วๆ นี้', 'en': 'No episodes airing soon'},
    'countdown_empty_desc': {'th': 'ตอนใหม่จะปรากฏที่นี่เมื่อมีกำหนดออกอากาศภายใน 7 วัน', 'en': 'New episodes will appear here when air dates are set within 7 days'},
}

REPLACEMENTS = [
    ('const SEO_TITLE = `นับถอยหลังซีรีส์ GL | ${SITE_NAME}`;', 'const SEO_TITLE = m.countdown_seo_title();'),
    ("const SEO_DESCRIPTION = 'นับถอยหลังสู่ตอนใหม่ของซีรีส์ GL ที่กำลังฉายและที่กำลังจะฉาย พร้อมเวลาออกอากาศและแพลตฟอร์มรับชม';", 'const SEO_DESCRIPTION = m.countdown_seo_description();'),
    ("{ name: 'หน้าแรก', path: '/' },", "{ name: m.nav_home(), path: '/' },"),
    ("{ name: 'นับถอยหลัง', path: '/countdown' }", "{ name: m.countdown_breadcrumb(), path: '/countdown' }"),
    ('const dayShortNames = [\'อาทิตย์\', \'จันทร์\', \'อังคาร\', \'พุธ\', \'พฤหัสบดี\', \'ศุกร์\', \'เสาร์\'];', ''),
    ("const thaiMonths = [\n\t\t'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',\n\t\t'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'\n\t];", ''),
    ('airLabel: `${dayShortNames[target.getDay()]} ${target.getDate()} ${thaiMonths[target.getMonth()]} · ${pad(target.getHours())}:${pad(target.getMinutes())} น.`,', 'airLabel: new Intl.DateTimeFormat(page.data.lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(target),'),
    ('<!-- background atmosphere (เหมือน hero หน้าแรก: mesh + floating blobs + orbit) -->', '<!-- background atmosphere (same as home hero: mesh + floating blobs + orbit) -->'),
    ('<!-- orbiting particles — signature ของ GL-Orbit -->', '<!-- orbiting particles — signature of GL-Orbit -->'),
    ('ย้อนกลับ', '{m.common_back()}'),
    ('นับถอยหลัง<span class="text-gradient">ซีรีส์ GL</span>', '{m.countdown_title_plain()}<span class="text-gradient">{m.countdown_title_accent()}</span>'),
    ('ติดตามทุกตอนที่กำลังจะฉาย — ซีรีส์ที่กำลังฉายและที่ยังไม่ฉาย ภายใน 7 วันข้างหน้า', '{m.countdown_subtitle()}'),
    ('กำลังติดตาม', '{m.countdown_tracking_label()}'),
    ('ตอนที่จะฉาย · ภายใน 7 วัน', '{m.countdown_tracking_suffix()}'),
    ('<!-- orbital days — วงแหวนโคจรรอบจำนวนวัน (สัญลักษณ์ของ GL-Orbit) -->', '<!-- orbital days — orbital ring around day count (GL-Orbit signature) -->'),
    ('{@render timeUnit(pad(c.hours), \'ชม.\')}', '{@render timeUnit(pad(c.hours), m.common_hours_short())}'),
    ('{@render timeUnit(pad(c.minutes), \'นาที\')}', '{@render timeUnit(pad(c.minutes), m.common_minutes_short())}'),
    ('{@render timeUnit(pad(c.seconds), \'วิ\')}', '{@render timeUnit(pad(c.seconds), m.common_seconds_short())}'),
    ('วัน</span>', '{m.common_days()}</span>'),
    ('ยังไม่มีตอนที่จะฉายในเร็วๆ นี้', '{m.countdown_empty_title()}'),
    ('ตอนใหม่จะปรากฏที่นี่เมื่อมีกำหนดออกอากาศภายใน 7 วัน', '{m.countdown_empty_desc()}'),
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
        m = re.search(r'(\<script[^\>]*\>\n?)', content)
        if m:
            content = content[:m.end()] + IMPORT_STMT + content[m.end():]
    mapping = {}
    parts = []
    for old, new in REPLACEMENTS:
        mapping[old] = new
        parts.append(re.escape(old))
    pattern = re.compile('|'.join(sorted(parts, key=len, reverse=True)))
    new_content = pattern.sub(lambda m: mapping[m.group(0)], content)
    PAGE.write_text(new_content, encoding='utf-8')
    print(f"Applied {len(REPLACEMENTS)} replacements to {PAGE}")

if __name__ == '__main__':
    merge_messages()
    apply_replacements()
