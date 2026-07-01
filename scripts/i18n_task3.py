#!/usr/bin/env python3
"""Task 3: translate series listing and detail pages."""
import json
import re
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
LISTING = ROOT / 'src/routes/[lang=lang]/(app)/series/+page.svelte'
DETAIL = ROOT / 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
IMPORT_STMT = "import { m } from '$lib/i18n/paraglide.js';\n"

MESSAGES = {
    'filter_all': {'th': 'ทั้งหมด', 'en': 'All'},
    'common_loading': {'th': 'กำลังโหลด...', 'en': 'Loading...'},
    'common_back': {'th': 'ย้อนกลับ', 'en': 'Back'},
    'common_today': {'th': 'วันนี้', 'en': 'Today'},
    'common_episodes': {'th': 'ตอน', 'en': 'Episodes'},
    'common_year': {'th': 'ปีฉาย', 'en': 'Year'},
    'common_cast': {'th': 'นักแสดง', 'en': 'Cast'},
    'common_schedule': {'th': 'ตารางฉาย', 'en': 'Schedule'},
    'common_expand_all': {'th': 'ขยายทั้งหมด', 'en': 'Expand all'},
    'common_collapse_all': {'th': 'ย่อทั้งหมด', 'en': 'Collapse all'},
    'common_people': {'th': 'คน', 'en': 'people'},
    'common_search_clear': {'th': 'ล้างการค้นหา', 'en': 'Clear search'},
    'series_search_placeholder': {'th': 'ค้นหาชื่อซีรีส์...', 'en': 'Search series by name...'},
    'series_search_label': {'th': 'ค้นหาซีรีส์', 'en': 'Search series'},
    'series_load_error': {'th': 'โหลดไม่สำเร็จ กรุณาลองใหม่', 'en': 'Failed to load. Please try again.'},
    'series_heading_plain': {'th': 'ซีรีส์', 'en': 'Series'},
    'series_heading_accent': {'th': 'ทั้งหมด', 'en': 'all'},
    'series_subtitle': {'th': 'รวบรวมซีรีส์ GL จากทุกสตูดิโอ', 'en': 'GL series from every studio'},
    'series_empty_title': {'th': 'ไม่พบซีรีส์', 'en': 'No series found'},
    'series_empty_search_prompt': {'th': 'ลองค้นหาด้วยคำอื่น หรือ ', 'en': 'Try another search term or '},
    'series_empty_category': {'th': 'ไม่พบซีรีส์ในหมวดหมู่นี้', 'en': 'No series in this category'},
    'series_breadcrumb_all': {'th': 'ซีรีส์ทั้งหมด', 'en': 'All series'},
    'series_detail_seo_fallback': {'th': '{title} ซีรีส์ GL จาก {studio} พร้อมข้อมูลนักแสดง จำนวนตอน ตารางฉาย และแพลตฟอร์มรับชม', 'en': '{title} — GL series from {studio} with cast, episode count, schedule, and streaming platforms'},
    'series_platform_count': {'th': '{count} แพลตฟอร์ม', 'en': '{count} platforms'},
    'series_share_title': {'th': '«{title}» บน GL-Orbit', 'en': '«{title}» on GL-Orbit'},
    'series_share_text': {'th': 'ดู «{title}» บน GL-Orbit — ข้อมูลนักแสดง ตารางฉาย แพลตฟอร์มรับชม', 'en': 'Watch «{title}» on GL-Orbit — cast, schedule, and streaming platforms'},
    'series_share_aria_label': {'th': 'แชร์ซีรีส์นี้', 'en': 'Share this series'},
    'series_genres_label': {'th': 'ประเภทซีรีส์', 'en': 'Genres'},
    'series_episode_cover_alt': {'th': 'ภาพปกตอนที่ {episode}', 'en': 'Episode {episode} cover'},
    'series_trailer_external_notice': {'th': 'ลิงก์นี้ไม่ใช่ YouTube เปิดดูในแท็บใหม่', 'en': 'This link is not YouTube; open in a new tab.'},
    'series_trailer_open': {'th': 'เปิด Trailer', 'en': 'Open Trailer'},
    'series_watch_now': {'th': 'ดูเลย', 'en': 'Watch now'},
}

LISTING_REPLACEMENTS = [
    ("ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' }", "ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' }"),
    ("UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' }", "UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' }"),
    ("ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }", "ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }"),
    ("{ key: 'ALL', label: 'ทั้งหมด' }", "{ key: 'ALL', label: m.filter_all() }"),
    ("{ key: 'ONGOING', label: 'กำลังฉาย' }", "{ key: 'ONGOING', label: m.status_ongoing() }"),
    ("{ key: 'UPCOMING', label: 'เร็วๆ นี้' }", "{ key: 'UPCOMING', label: m.status_upcoming() }"),
    ("{ key: 'ENDED', label: 'จบแล้ว' }", "{ key: 'ENDED', label: m.status_ended() }"),
    ("loadMoreError = 'โหลดไม่สำเร็จ กรุณาลองใหม่';", "loadMoreError = m.series_load_error();"),
    ('placeholder="ค้นหาชื่อซีรีส์..."', 'placeholder={m.series_search_placeholder()}'),
    ('aria-label="ค้นหาซีรีส์"', 'aria-label={m.series_search_label()}'),
    ('aria-label="ล้างการค้นหา"', 'aria-label={m.common_search_clear()}'),
    ('ซีรีส์<span class="text-coral">ทั้งหมด</span>', '<span>{m.series_heading_plain()}</span><span class="text-coral">{m.series_heading_accent()}</span>'),
    ('<p class="text-sm sm:text-base text-plum-light">รวบรวมซีรีส์ GL จากทุกสตูดิโอ</p>', '<p class="text-sm sm:text-base text-plum-light">{m.series_subtitle()}</p>'),
    ('\t\t\t\t\tกำลังโหลด...\n', '\t\t\t\t\t{m.common_loading()}\n'),
    ('\t\t\t\t\tดูเพิ่มเติม\n', '\t\t\t\t\t{m.common_load_more()}\n'),
    ('<h3 class="font-semibold text-plum mb-1">ไม่พบซีรีส์</h3>', '<h3 class="font-semibold text-plum mb-1">{m.series_empty_title()}</h3>'),
    ('ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>', '{m.series_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>'),
    ('\t\t\t\t\tไม่พบซีรีส์ในหมวดหมู่นี้\n', '\t\t\t\t\t{m.series_empty_category()}\n'),
]

DETAIL_REPLACEMENTS = [
    ("ONGOING: { text: 'กำลังฉาย', class: 'text-mint-dark', bg: 'bg-mint/20' }", "ONGOING: { text: m.status_ongoing(), class: 'text-mint-dark', bg: 'bg-mint/20' }"),
    ("UPCOMING: { text: ' upcoming', class: 'text-lavender-dark', bg: 'bg-lavender/20' }", "UPCOMING: { text: m.status_upcoming(), class: 'text-lavender-dark', bg: 'bg-lavender/20' }"),
    ("ENDED: { text: 'จบแล้ว', class: 'text-coral-dark', bg: 'bg-coral/10' }", "ENDED: { text: m.status_ended(), class: 'text-coral-dark', bg: 'bg-coral/10' }"),
    ("description || `${title} ซีรีส์ GL จาก ${series.studio} พร้อมข้อมูลนักแสดง จำนวนตอน ตารางฉาย และแพลตฟอร์มรับชม`", "description || m.series_detail_seo_fallback({ title, studio: series.studio })"),
    ("{ name: 'หน้าแรก', path: '/' }", "{ name: m.nav_home(), path: '/' }"),
    ("{ name: 'ซีรีส์ทั้งหมด', path: '/series' }", "{ name: m.series_breadcrumb_all(), path: '/series' }"),
    ("return `${valid.length} แพลตฟอร์ม`;", "return m.series_platform_count({ count: String(valid.length) });"),
    ('<span>ย้อนกลับ</span>', '<span>{m.common_back()}</span>'),
    ('title={`${series.titleEn}${series.titleTh ? ` (${series.titleTh})` : \'\'} | GL-Orbit`}', 'title={m.series_share_title({ title })}'),
    ('text={`ดู «${series.titleEn}» บน GL-Orbit — ข้อมูลนักแสดง ตารางฉาย แพลตฟอร์มรับชม`}', 'text={m.series_share_text({ title })}'),
    ('ariaLabel="แชร์ซีรีส์นี้"', 'ariaLabel={m.series_share_aria_label()}'),
    ('ประเภทซีรีส์', '{m.series_genres_label()}'),
    ('>ตอน<', '>{m.common_episodes()}<'),
    ('>ปีฉาย<', '>{m.common_year()}<'),
    ('>นักแสดง</h2>', '>{m.common_cast()}</h2>'),
    ('{series.artists.length} คน', '{series.artists.length} {m.common_people()}'),
    ('>ตารางฉาย</h2>', '>{m.common_schedule()}</h2>'),
    ("aria-label={allExpanded ? 'ย่อทั้งหมด' : 'ขยายทั้งหมด'}", "aria-label={allExpanded ? m.common_collapse_all() : m.common_expand_all()}"),
    ('<span>ย่อทั้งหมด</span>', '<span>{m.common_collapse_all()}</span>'),
    ('<span>ขยายทั้งหมด</span>', '<span>{m.common_expand_all()}</span>'),
    ('alt={`ภาพปกตอนที่ ${item.episode}`}', 'alt={m.series_episode_cover_alt({ episode: item.episode })}'),
    ('>วันนี้</span>', '>{m.common_today()}</span>'),
    ('>ลิงก์นี้ไม่ใช่ YouTube เปิดดูในแท็บใหม่</p>', '>{m.series_trailer_external_notice()}</p>'),
    ('>เปิด Trailer</', '>{m.series_trailer_open()}</'),
    ('>ดูเลย</', '>{m.series_watch_now()}</'),
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
