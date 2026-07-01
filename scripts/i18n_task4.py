#!/usr/bin/env python3
"""Task 4: translate artists pages."""
import json
import re
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
LISTING = ROOT / 'src/routes/[lang=lang]/(app)/artists/+page.svelte'
DETAIL = ROOT / 'src/routes/[lang=lang]/(app)/artists/[id]/+page.svelte'
IMPORT_STMT = "import { m } from '$lib/i18n/paraglide.js';\n"

MESSAGES = {
    'artist_search_placeholder': {'th': 'ค้นหาชื่อนักแสดง...', 'en': 'Search artists by name...'},
    'artist_search_label': {'th': 'ค้นหานักแสดง', 'en': 'Search artists'},
    'artist_list_load_error': {'th': 'โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง', 'en': 'Failed to load more. Please try again.'},
    'artist_heading_plain': {'th': 'นักแสดง', 'en': 'Artists'},
    'artist_heading_accent': {'th': 'ทั้งหมด', 'en': 'all'},
    'artist_list_subtitle': {'th': 'รวบรวมนักแสดงซีรีส์ GL พร้อมผลงานและโซเชียลมีเดีย', 'en': 'GL series artists with works and social media'},
    'artist_list_empty_title': {'th': 'ไม่พบนักแสดง', 'en': 'No artists found'},
    'artist_list_empty_search_prompt': {'th': 'ลองค้นหาด้วยคำอื่น หรือ ', 'en': 'Try another search term or '},
    'artist_list_empty_category': {'th': 'ยังไม่มีนักแสดงในระบบ', 'en': 'No artists in the system yet'},
    'artist_no_works': {'th': 'ยังไม่มีผลงาน', 'en': 'No works yet'},
    'artist_works_label': {'th': 'ผลงาน', 'en': 'works'},
    'artist_socials_label': {'th': 'ช่องทาง', 'en': 'channels'},
    'artist_detail_seo_title': {'th': '{name} | นักแสดง | GL-Orbit', 'en': '{name} | Cast | GL-Orbit'},
    'artist_detail_seo_description': {'th': '{name} — นักแสดงซีรีส์ GL พร้อมลิงก์โซเชียลมีเดียและผลงานซีรีส์ทั้งหมด', 'en': '{name} — GL series cast with social links and full filmography'},
    'artist_share_text': {'th': 'ฝากรู้จัก «{name}» นักแสดงซีรีส์ GL บน GL-Orbit — โซเชียลและผลงาน', 'en': 'Get to know «{name}», GL series cast on GL-Orbit — socials and works'},
    'artist_share_aria_label': {'th': 'แชร์นักแสดงนี้', 'en': 'Share this artist'},
    'artist_socials_heading': {'th': 'โซเชียลมีเดีย', 'en': 'Social media'},
    'artist_works_heading': {'th': 'ผลงาน', 'en': 'Filmography'},
    'artist_works_count_label': {'th': 'เรื่อง', 'en': 'titles'},
    'artist_detail_empty_title': {'th': 'ยังไม่มีผลงานในระบบ', 'en': 'No works in the system yet'},
    'artist_detail_empty_desc': {'th': 'กลับไปเริ่มสำรวจจากหน้าแรกของ GL-Orbit', 'en': 'Back to explore from the GL-Orbit home page'},
    'artist_detail_empty_back_home': {'th': 'กลับหน้าแรก', 'en': 'Back to home'},
}

LISTING_REPLACEMENTS = [
    ("loadMoreError = 'โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง';", "loadMoreError = m.artist_list_load_error();"),
    ('placeholder="ค้นหาชื่อนักแสดง..."', 'placeholder={m.artist_search_placeholder()}'),
    ('aria-label="ค้นหานักแสดง"', 'aria-label={m.artist_search_label()}'),
    ('aria-label="ล้างการค้นหา"', 'aria-label={m.common_search_clear()}'),
    ('นักแสดง<span class="text-coral">ทั้งหมด</span>', '<span>{m.artist_heading_plain()}</span><span class="text-coral">{m.artist_heading_accent()}</span>'),
    ('<p class="text-sm sm:text-base text-plum-light">รวบรวมนักแสดงซีรีส์ GL พร้อมผลงานและโซเชียลมีเดีย</p>', '<p class="text-sm sm:text-base text-plum-light">{m.artist_list_subtitle()}</p>'),
    ('{a.seriesCount} ผลงาน', '{a.seriesCount} {m.artist_works_label()}'),
    ('ยังไม่มีผลงาน', '{m.artist_no_works()}'),
    ('\t\t\t\t\tกำลังโหลด...\n', '\t\t\t\t\t{m.common_loading()}\n'),
    ('\t\t\t\t\tดูเพิ่มเติม\n', '\t\t\t\t\t{m.common_load_more()}\n'),
    ('<h3 class="font-semibold text-plum mb-1">ไม่พบนักแสดง</h3>', '<h3 class="font-semibold text-plum mb-1">{m.artist_list_empty_title()}</h3>'),
    ('ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>', '{m.artist_list_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>'),
    ('\t\t\t\t\tยังไม่มีนักแสดงในระบบ\n', '\t\t\t\t\t{m.artist_list_empty_category()}\n'),
]

DETAIL_REPLACEMENTS = [
    ("const seoTitle = $derived(`${artist.nickname} | นักแสดง | GL-Orbit`);", "const seoTitle = $derived(m.artist_detail_seo_title({ name: artist.nickname }));"),
    ("`${artist.nickname}${artist.fullNameEn ? ` (${artist.fullNameEn})` : ''}${artist.fullNameTh ? ` · ${artist.fullNameTh}` : ''} — นักแสดงซีรีส์ GL พร้อมลิงก์โซเชียลมีเดียและผลงานซีรีส์ทั้งหมด`", "m.artist_detail_seo_description({ name: artist.nickname })"),
    ("{ name: 'หน้าแรก', path: '/' }", "{ name: m.nav_home(), path: '/' }"),
    ("{ name: 'นักแสดง', path: '/artists' }", "{ name: m.nav_artists(), path: '/artists' }"),
    ("ONGOING: { text: 'กำลังฉาย', cls: 'bg-mint/20 text-mint-dark' }", "ONGOING: { text: m.status_ongoing(), cls: 'bg-mint/20 text-mint-dark' }"),
    ("UPCOMING: { text: 'เร็วๆ นี้', cls: 'bg-lavender/20 text-lavender-dark' }", "UPCOMING: { text: m.status_upcoming(), cls: 'bg-lavender/20 text-lavender-dark' }"),
    ("ENDED: { text: 'จบแล้ว', cls: 'bg-coral/10 text-coral-dark' }", "ENDED: { text: m.status_ended(), cls: 'bg-coral/10 text-coral-dark' }"),
    ('<span class="font-medium">กลับ</span>', '<span class="font-medium">{m.common_back()}</span>'),
    ('text={`ฝากรู้จัก «${artist.nickname}» นักแสดงซีรีส์ GL บน GL-Orbit — โซเชียลและผลงาน`}', 'text={m.artist_share_text({ name: artist.nickname })}'),
    ('ariaLabel="แชร์นักแสดงนี้"', 'ariaLabel={m.artist_share_aria_label()}'),
    ('นักแสดง\n', '{m.common_cast()}\n'),
    ('{artist.series.length} ผลงาน', '{artist.series.length} {m.artist_works_label()}'),
    ('{artist.socials.length} ช่องทาง', '{artist.socials.length} {m.artist_socials_label()}'),
    ('>โซเชียลมีเดีย</h2>', '>{m.artist_socials_heading()}</h2>'),
    ('{artist.socials.length} ช่องทาง</span>', '{artist.socials.length} {m.artist_socials_label()}</span>'),
    ('>ผลงาน</h2>', '>{m.artist_works_heading()}</h2>'),
    ('{artist.series.length} เรื่อง</span>', '{artist.series.length} {m.artist_works_count_label()}</span>'),
    ('<p class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">ยังไม่มีผลงานในระบบ</p>', '<p class="font-[family-name:var(--font-display)] text-xl font-bold text-plum">{m.artist_detail_empty_title()}</p>'),
    ('<p class="mt-1 text-sm text-plum-light">กลับไปเริ่มสำรวจจากหน้าแรกของ GL-Orbit</p>', '<p class="mt-1 text-sm text-plum-light">{m.artist_detail_empty_desc()}</p>'),
    ('กลับหน้าแรก', '{m.artist_detail_empty_back_home()}'),
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

def apply_file(path: Path, replacements):
    content = path.read_text(encoding='utf-8')
    if IMPORT_STMT.strip() not in content:
        m = re.search(r'(\<script[^\>]*\>\n?)', content)
        if m:
            content = content[:m.end()] + IMPORT_STMT + content[m.end():]
    mapping = {}
    parts = []
    for old, new in replacements:
        mapping[old] = new
        parts.append(re.escape(old))
    pattern = re.compile('|'.join(sorted(parts, key=len, reverse=True)))
    new_content = pattern.sub(lambda m: mapping[m.group(0)], content)
    path.write_text(new_content, encoding='utf-8')
    print(f"Applied {len(replacements)} replacements to {path}")

if __name__ == '__main__':
    merge_messages()
    apply_file(LISTING, LISTING_REPLACEMENTS)
    apply_file(DETAIL, DETAIL_REPLACEMENTS)
